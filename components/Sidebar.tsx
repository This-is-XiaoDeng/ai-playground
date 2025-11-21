
import React, { useRef } from 'react';
import { Plus, MessageSquare, Trash, Upload, Menu, Download } from 'lucide-react';
import { useStore } from '../store';
import { Session, Role, PlaygroundMessage } from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { v4 as uuidv4 } from 'uuid';

// Helper to safely parse JSON arguments from tool calls
const tryParseJSON = (str: any) => {
    if (typeof str !== 'string') return str || {};
    try {
        return JSON.parse(str);
    } catch (e) {
        return {};
    }
};

export const Sidebar: React.FC = () => {
  const { 
    sessions, currentSessionId, createSession, switchSession, deleteSession, 
    toggleSettings, sidebarOpen, toggleSidebar, importSession 
  } = useStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              let newSession: Session;

              // Case 1: Internal App Export (Has explicit config object)
              if (json.config && Array.isArray(json.messages)) {
                  newSession = { ...json, id: uuidv4() };
              }
              // Case 2: OpenAI API Payload (Has messages array but no internal config object)
              else if (json.messages && Array.isArray(json.messages)) {
                  const newMessages: PlaygroundMessage[] = [];
                  const toolCallMap = new Map<string, { msgIdx: number, toolIdx: number }>();

                  // Iterate through flat list and reconstruct nested tool structure
                  for (const msg of json.messages) {
                      if (msg.role === 'tool') {
                          // This is a result message. Find the parent assistant message and update the tool call result.
                          const mapping = toolCallMap.get(msg.tool_call_id);
                          if (mapping) {
                              const parentMsg = newMessages[mapping.msgIdx];
                              if (parentMsg && parentMsg.toolCalls && parentMsg.toolCalls[mapping.toolIdx]) {
                                  parentMsg.toolCalls[mapping.toolIdx].result = msg.content;
                              }
                          }
                      } else {
                          // Determine Role
                          let role = Role.USER;
                          if (msg.role === 'assistant') role = Role.MODEL;
                          else if (msg.role === 'system') role = Role.SYSTEM;
                          else if (msg.role === 'user') role = Role.USER;

                          // Parse Tool Calls if present
                          let toolCalls = undefined;
                          if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
                              toolCalls = msg.tool_calls.map((tc: any) => ({
                                  id: tc.id,
                                  name: tc.function?.name || 'unknown',
                                  args: tryParseJSON(tc.function?.arguments),
                                  result: undefined // Will be filled by subsequent 'tool' messages
                              }));
                          }

                          const newMessage: PlaygroundMessage = {
                              id: uuidv4(),
                              role: role,
                              content: msg.content || '', // content can be null in tool_calls messages
                              timestamp: Date.now(),
                              isToolCall: !!(toolCalls && toolCalls.length > 0),
                              toolCalls: toolCalls
                          };

                          // Index tool calls for subsequent result folding
                          if (newMessage.toolCalls) {
                              newMessage.toolCalls.forEach((tc, idx) => {
                                  toolCallMap.set(tc.id, { msgIdx: newMessages.length, toolIdx: idx });
                              });
                          }

                          newMessages.push(newMessage);
                      }
                  }

                  // Extract Config from top-level properties
                  const config = { ...DEFAULT_CONFIG };
                  if (json.model) config.model = json.model;
                  if (typeof json.temperature === 'number') config.temperature = json.temperature;
                  if (typeof json.top_p === 'number') config.topP = json.top_p;
                  // Handle max_tokens or max_completion_tokens
                  if (typeof json.max_tokens === 'number') config.maxOutputTokens = json.max_tokens;
                  if (typeof json.max_completion_tokens === 'number') config.maxOutputTokens = json.max_completion_tokens;
                  
                  // Handle tools definition
                  if (json.tools) {
                      config.toolsDefinition = JSON.stringify(json.tools, null, 2);
                  }

                  newSession = {
                      id: uuidv4(),
                      name: `Imported ${config.model || 'Session'}`,
                      createdAt: Date.now(),
                      config: config,
                      messages: newMessages
                  };
              }
              // Case 3: Simple Message Array (Fallback)
              else if (Array.isArray(json)) {
                   newSession = {
                      id: uuidv4(),
                      name: 'Imported Messages',
                      createdAt: Date.now(),
                      config: { ...DEFAULT_CONFIG },
                      messages: json.map((m: any) => ({
                          id: uuidv4(),
                          role: m.role === 'assistant' ? Role.MODEL : (m.role || Role.USER),
                          content: m.content || '',
                          timestamp: Date.now()
                      }))
                   };
              } else {
                  throw new Error("Unknown JSON format. Expected OpenAI payload or Session export.");
              }
              
              importSession(newSession);
          } catch (err) {
              console.error(err);
              alert("Failed to parse JSON: " + (err as Error).message);
          }
      };
      reader.readAsText(file);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!sidebarOpen) {
      return (
          <div className="w-12 border-r border-gray-800 bg-gray-950 flex flex-col items-center py-4 gap-4">
              <button onClick={toggleSidebar} className="text-gray-400 hover:text-white">
                  <Menu size={20} />
              </button>
          </div>
      );
  }

  return (
    <div className="w-64 border-r border-gray-800 bg-gray-950 flex flex-col h-full transition-all shrink-0">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <span className="font-bold text-gray-100">AI Playground</span>
        <button onClick={toggleSidebar} className="text-gray-500 hover:text-white">
            <Menu size={16} />
        </button>
      </div>

      <div className="p-2">
        <button 
          onClick={createSession}
          className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded text-sm transition-colors"
        >
          <Plus size={16} /> New Session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.map((session) => (
          <div 
            key={session.id}
            onClick={() => switchSession(session.id)}
            className={`group flex items-center justify-between p-2 rounded cursor-pointer text-sm ${
              currentSessionId === session.id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <MessageSquare size={14} className="shrink-0" />
              <span className="truncate">{session.name}</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1"
            >
              <Trash size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-gray-800 space-y-1">
        <button 
           onClick={() => fileInputRef.current?.click()}
           className="w-full flex items-center gap-2 p-2 text-sm text-gray-400 hover:text-white hover:bg-gray-900 rounded"
        >
            <Upload size={14} /> Import JSON
        </button>
        <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleImport}
        />
        
        <button 
           onClick={toggleSettings}
           className="w-full flex items-center gap-2 p-2 text-sm text-gray-400 hover:text-white hover:bg-gray-900 rounded"
        >
            {/* Using Download icon as generic settings icon was requested in types but typically Settings is better */}
            <Menu size={14} className="rotate-90" /> Settings
        </button>
      </div>
    </div>
  );
};

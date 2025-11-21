import React, { useRef } from 'react';
import { Plus, MessageSquare, Trash, Settings, Download, Upload, Menu } from 'lucide-react';
import { useStore } from '../store';
import { Session } from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { v4 as uuidv4 } from 'uuid';

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
              
              // Basic validation and conversion
              // Assuming importing OpenAI-like format or internal format
              // If it's an array of messages, wrap it in a session structure
              let newSession: Session;

              if (Array.isArray(json)) {
                  // Assume OpenAI message export
                  newSession = {
                      id: uuidv4(),
                      name: 'Imported Session',
                      createdAt: Date.now(),
                      config: { ...DEFAULT_CONFIG },
                      messages: json.map((m: any) => ({
                          id: uuidv4(),
                          role: m.role,
                          content: m.content || '',
                          timestamp: Date.now()
                      }))
                  };
              } else if (json.messages && json.config) {
                  // Internal format
                  newSession = json;
              } else {
                  alert("Unknown JSON format");
                  return;
              }
              
              importSession(newSession);
          } catch (err) {
              console.error(err);
              alert("Failed to parse JSON");
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
    <div className="w-64 border-r border-gray-800 bg-gray-950 flex flex-col h-full transition-all">
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
            <Settings size={14} /> Settings
        </button>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { useStore } from '../store';
import { PlaygroundMessage, Role } from '../types';
import { Trash2, Plus, Play, Loader2, Terminal } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

// --- Sub-component: Tool Call Block (Manual Entry) ---
const ToolCallBlock: React.FC<{ message: PlaygroundMessage, sessionId: string }> = ({ message, sessionId }) => {
    const { updateToolCallResult } = useStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempResult, setTempResult] = useState('');

    if (!message.toolCalls || message.toolCalls.length === 0) return null;

    return (
        <div className="mt-2 space-y-2 pl-12">
            {message.toolCalls.map(tc => (
                <div key={tc.id} className="bg-gray-900 border border-gray-700 rounded overflow-hidden">
                    <div className="bg-gray-800 px-3 py-1.5 flex items-center gap-2 border-b border-gray-700">
                        <Terminal size={12} className="text-purple-400" />
                        <span className="text-xs font-mono text-purple-300">{tc.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono ml-auto">
                            {JSON.stringify(tc.args)}
                        </span>
                        <span className="text-[10px] text-gray-600 font-mono border border-gray-700 px-1 rounded">
                            ID: {tc.id}
                        </span>
                    </div>
                    
                    <div className="p-2">
                         {editingId === tc.id ? (
                             <div className="space-y-2">
                                 <textarea
                                    value={tempResult}
                                    onChange={(e) => setTempResult(e.target.value)}
                                    className="w-full bg-black border border-gray-600 rounded p-2 text-xs font-mono text-green-400 h-16"
                                    placeholder='{"result": ...}'
                                 />
                                 <div className="flex gap-2 justify-end">
                                     <button 
                                        onClick={() => setEditingId(null)}
                                        className="text-xs text-gray-400 hover:text-white"
                                     >
                                         Cancel
                                     </button>
                                     <button 
                                        onClick={() => {
                                            updateToolCallResult(sessionId, message.id, tc.id, tempResult);
                                            setEditingId(null);
                                        }}
                                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
                                     >
                                         Save Output
                                     </button>
                                 </div>
                             </div>
                         ) : (
                             <div 
                                onClick={() => {
                                    setTempResult(tc.result || '');
                                    setEditingId(tc.id);
                                }}
                                className={`p-1.5 rounded border border-dashed cursor-pointer text-xs font-mono transition-colors ${
                                    tc.result ? 'border-green-900/50 bg-green-900/10 text-green-300' : 'border-gray-600 text-gray-500 hover:bg-gray-800'
                                }`}
                             >
                                 {tc.result || "Click to enter output for this tool call..."}
                             </div>
                         )}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Sub-component: Message Row ---
const MessageRow: React.FC<{ message: PlaygroundMessage, sessionId: string, isLast: boolean }> = ({ message, sessionId, isLast }) => {
    const { updateMessage, deleteMessage } = useStore();

    const handleRoleChange = (newRole: Role) => {
        updateMessage(sessionId, message.id, { role: newRole });
    };

    const handleContentChange = (newContent: string) => {
        updateMessage(sessionId, message.id, { content: newContent });
    };

    return (
        <div className="group relative flex gap-4 p-4 border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors">
            {/* Role Selector */}
            <div className="w-24 shrink-0 pt-1">
                <select 
                    value={message.role}
                    onChange={(e) => handleRoleChange(e.target.value as Role)}
                    className={`w-full bg-transparent text-xs font-bold uppercase tracking-wider cursor-pointer outline-none ${
                        message.role === Role.USER ? 'text-green-400' :
                        message.role === Role.MODEL ? 'text-blue-400' :
                        message.role === Role.SYSTEM ? 'text-red-400' :
                        'text-gray-400'
                    }`}
                >
                    <option value={Role.SYSTEM}>System</option>
                    <option value={Role.USER}>User</option>
                    <option value={Role.MODEL}>Assistant</option>
                </select>
            </div>

            {/* Content Editor */}
            <div className="flex-1 min-w-0">
                <textarea
                    value={message.content || ''}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-200 outline-none resize-none min-h-[24px] overflow-hidden"
                    placeholder={message.role === Role.MODEL ? 'Enter assistant message...' : `Enter ${message.role} message...`}
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                    }}
                    ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                />
                
                {/* Tool Calls */}
                {message.isToolCall && (
                    <ToolCallBlock message={message} sessionId={sessionId} />
                )}
                
                {/* Error display */}
                {message.isError && (
                    <div className="mt-2 text-xs text-red-400 bg-red-900/20 p-2 rounded">
                        Generation failed. Check console or try again.
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                <button 
                    onClick={() => deleteMessage(sessionId, message.id)}
                    className="text-gray-600 hover:text-red-400"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

// --- Main Component ---
export const MessageList: React.FC = () => {
  const { sessions, currentSessionId, addMessage, apiKeys, selectedApiKeyId, updateMessage } = useStore();
  const [isRunning, setIsRunning] = useState(false);
  
  const session = sessions.find(s => s.id === currentSessionId);
  
  if (!session) return null;

  const handleAddMessage = (role: Role = Role.USER) => {
      addMessage(session.id, { role, content: '' });
  };

  const handleRun = async () => {
      if (!selectedApiKeyId) {
          alert("Please select an API Key in settings.");
          return;
      }
      const apiKeyConfig = apiKeys.find(k => k.id === selectedApiKeyId);
      if (!apiKeyConfig) return;

      setIsRunning(true);
      try {
          const service = new GeminiService(apiKeyConfig.key, apiKeyConfig.baseUrl, session.config);
          const response = await service.generate(session.messages);
          
          addMessage(session.id, {
              role: Role.MODEL,
              content: response.text,
              isToolCall: !!response.toolCalls,
              toolCalls: response.toolCalls
          });
      } catch (e: any) {
          alert(e.message);
      } finally {
          setIsRunning(false);
      }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
          {session.messages.map((msg, idx) => (
              <MessageRow 
                key={msg.id} 
                message={msg} 
                sessionId={session.id} 
                isLast={idx === session.messages.length - 1}
              />
          ))}
          
          {/* Add Buttons Area */}
          <div className="p-4 flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleAddMessage(Role.USER)}
                className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded"
              >
                  <Plus size={12} /> Add User
              </button>
              <button 
                onClick={() => handleAddMessage(Role.MODEL)}
                className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded"
              >
                  <Plus size={12} /> Add Assistant
              </button>
          </div>
      </div>

      {/* Sticky Footer Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
          <div className="max-w-2xl mx-auto flex gap-4 items-center">
            <div className="flex-1 bg-gray-900/80 backdrop-blur border border-gray-800 rounded-lg p-1 flex items-center justify-between px-4 py-2 shadow-xl">
                <span className="text-xs text-gray-500">
                    {session.messages.length} messages &bull; {session.config.model}
                </span>
                <button
                    onClick={handleRun}
                    disabled={isRunning}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-6 py-2 rounded flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                >
                    {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                    Run
                </button>
            </div>
          </div>
      </div>
    </div>
  );
};

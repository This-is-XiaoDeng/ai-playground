import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Key } from 'lucide-react';
import { useStore } from '../store';

export const SettingsModal: React.FC = () => {
  const { 
    settingsOpen, toggleSettings, 
    apiKeys, addApiKey, removeApiKey, selectApiKey, selectedApiKeyId
  } = useStore();
  
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newBaseUrl, setNewBaseUrl] = useState('');

  if (!settingsOpen) return null;

  const handleAddKey = () => {
    if (newKeyName && newKeyValue) {
      addApiKey(newKeyName, newKeyValue, newBaseUrl || undefined);
      setNewKeyName('');
      setNewKeyValue('');
      setNewBaseUrl('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Key size={18} /> API Key Management
          </h2>
          <button onClick={toggleSettings} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* API Keys List */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Your Keys</h3>
            
            <div className="space-y-2 mb-6">
              {apiKeys.length === 0 && <p className="text-gray-500 text-sm">No keys configured.</p>}
              {apiKeys.map(key => (
                <div 
                  key={key.id}
                  onClick={() => selectApiKey(key.id)}
                  className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${
                    selectedApiKeyId === key.id 
                      ? 'bg-blue-900/20 border-blue-500/50' 
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedApiKeyId === key.id ? 'border-blue-500' : 'border-gray-500'
                    }`}>
                        {selectedApiKeyId === key.id && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-200">{key.name}</span>
                        <div className="flex gap-2 text-xs text-gray-500">
                             <span>...{key.key.slice(-4)}</span>
                             {key.baseUrl && <span className="text-blue-400">({key.baseUrl})</span>}
                        </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeApiKey(key.id); }}
                    className="text-gray-500 hover:text-red-400 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Key Form */}
            <div className="bg-gray-800 p-4 rounded border border-gray-700 space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase">Add New Key</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-gray-400">Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Google AI Studio"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm outline-none focus:border-blue-500"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-gray-400">API Key</label>
                    <input
                        type="password"
                        placeholder="sk-..."
                        value={newKeyValue}
                        onChange={(e) => setNewKeyValue(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm outline-none focus:border-blue-500"
                    />
                </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs text-gray-400">Base URL (Optional)</label>
                 <input
                    type="text"
                    placeholder="https://generativelanguage.googleapis.com"
                    value={newBaseUrl}
                    onChange={(e) => setNewBaseUrl(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm outline-none focus:border-blue-500"
                 />
                 <p className="text-[10px] text-gray-500">Leave blank for default Google Gemini endpoint.</p>
              </div>

              <div className="pt-2">
                <button 
                    onClick={handleAddKey}
                    disabled={!newKeyName || !newKeyValue}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-3 py-2 rounded flex items-center justify-center gap-2 text-sm"
                >
                    <Plus size={16} /> Add Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-800 flex justify-end">
            <button onClick={toggleSettings} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">
                Done
            </button>
        </div>
      </div>
    </div>
  );
};
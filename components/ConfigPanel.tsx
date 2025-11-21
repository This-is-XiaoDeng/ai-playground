
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { SAMPLE_TOOL_DEFINITION } from '../constants';
import { Trash2, Plus, Code, Settings2 } from 'lucide-react';

interface Parameter {
    name: string;
    type: string;
    description: string;
}

interface Tool {
    name: string;
    description: string;
    parameters: Parameter[];
}

export const ConfigPanel: React.FC = () => {
  const { sessions, currentSessionId, updateSessionConfig } = useStore();
  const session = sessions.find(s => s.id === currentSessionId);
  
  const [toolsDefinition, setToolsDefinition] = useState('');
  const [visualMode, setVisualMode] = useState(true);
  const [modelInput, setModelInput] = useState('');
  
  useEffect(() => {
    if (session) {
        setToolsDefinition(session.config.toolsDefinition);
        setModelInput(session.config.model);
    }
  }, [session?.id, session?.config.toolsDefinition, session?.config.model]);

  if (!session) return <div className="w-80 bg-gray-950 border-l border-gray-800 p-4 text-gray-500">No Session Selected</div>;

  const handleConfigChange = (key: string, value: any) => {
    updateSessionConfig(session.id, { [key]: value });
  };

  const handleBlur = (key: string, value: string) => {
      updateSessionConfig(session.id, { [key]: value });
  };

  // --- Visual Tool Editor Logic (Updated for OpenAI Format) ---

  const parseTools = (json: string): Tool[] => {
      try {
          const parsed = JSON.parse(json);
          if (!Array.isArray(parsed)) return [];
          
          // Handle OpenAI format: [{ type: 'function', function: { ... } }]
          return parsed.map((t: any) => {
              const fn = t.function || t; // Fallback if user pasted raw function objects
              return {
                  name: fn.name || '',
                  description: fn.description || '',
                  parameters: Object.entries(fn.parameters?.properties || {}).map(([k, v]: [string, any]) => ({
                      name: k,
                      type: v.type || 'string',
                      description: v.description || ''
                  }))
              };
          });
      } catch {
          return [];
      }
  };

  const convertToJSON = (tools: Tool[]) => {
      const apiTools = tools.map(t => ({
          type: "function",
          function: {
              name: t.name,
              description: t.description,
              parameters: {
                  type: 'object',
                  properties: t.parameters.reduce((acc: any, p) => {
                      acc[p.name] = { type: p.type, description: p.description };
                      return acc;
                  }, {}),
                  required: t.parameters.map(p => p.name)
              }
          }
      }));
      return JSON.stringify(apiTools, null, 2);
  };

  const visualTools = parseTools(toolsDefinition);

  const addTool = () => {
      const newTools = [...visualTools, { name: 'new_function', description: '', parameters: [] }];
      const json = convertToJSON(newTools);
      setToolsDefinition(json);
      handleConfigChange('toolsDefinition', json);
  };

  const updateTool = (index: number, updates: Partial<Tool>) => {
      const newTools = [...visualTools];
      newTools[index] = { ...newTools[index], ...updates };
      const json = convertToJSON(newTools);
      setToolsDefinition(json);
      handleConfigChange('toolsDefinition', json);
  };

  const deleteTool = (index: number) => {
      const newTools = visualTools.filter((_, i) => i !== index);
      const json = convertToJSON(newTools);
      setToolsDefinition(json);
      handleConfigChange('toolsDefinition', json);
  };

  const addParam = (toolIndex: number) => {
      const newTools = [...visualTools];
      newTools[toolIndex].parameters.push({ name: 'arg', type: 'string', description: '' });
      const json = convertToJSON(newTools);
      setToolsDefinition(json);
      handleConfigChange('toolsDefinition', json);
  };

  const updateParam = (toolIndex: number, paramIndex: number, updates: Partial<Parameter>) => {
      const newTools = [...visualTools];
      newTools[toolIndex].parameters[paramIndex] = { ...newTools[toolIndex].parameters[paramIndex], ...updates };
      const json = convertToJSON(newTools);
      setToolsDefinition(json);
      handleConfigChange('toolsDefinition', json);
  };

  const deleteParam = (toolIndex: number, paramIndex: number) => {
      const newTools = [...visualTools];
      newTools[toolIndex].parameters = newTools[toolIndex].parameters.filter((_, i) => i !== paramIndex);
      const json = convertToJSON(newTools);
      setToolsDefinition(json);
      handleConfigChange('toolsDefinition', json);
  };


  return (
    <div className="w-96 bg-gray-950 border-l border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800 font-semibold text-sm text-gray-200 flex justify-between items-center">
        <span>Configuration</span>
        <div className="text-xs text-gray-500">OpenAI Mode</div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Model Selection - Manual Input */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Model</label>
            <div className="relative">
                <input
                    list="models-list"
                    value={modelInput}
                    onChange={(e) => {
                        setModelInput(e.target.value);
                        handleConfigChange('model', e.target.value);
                    }}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="Select or type model ID..."
                />
                <datalist id="models-list">
                    <option value="gpt-4o" />
                    <option value="gpt-4o-mini" />
                    <option value="gpt-4-turbo" />
                    <option value="gpt-3.5-turbo" />
                    <option value="o1-preview" />
                    <option value="o1-mini" />
                </datalist>
            </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
            <div>
                <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Temperature</label>
                    <span className="text-xs text-gray-400">{session.config.temperature}</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="2" 
                    step="0.1"
                    value={session.config.temperature}
                    onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>

            <div>
                <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Top P</label>
                    <span className="text-xs text-gray-400">{session.config.topP}</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    value={session.config.topP}
                    onChange={(e) => handleConfigChange('topP', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>
        </div>

        {/* Tool Definitions */}
        <div className="flex flex-col gap-2 pt-4 border-t border-gray-800">
            <div className="flex justify-between items-center mb-2">
                 <label className="text-xs font-bold text-gray-500 uppercase">Tools</label>
                 <div className="flex gap-2 bg-gray-800 rounded p-1">
                     <button 
                        onClick={() => setVisualMode(true)}
                        className={`p-1 rounded ${visualMode ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
                        title="Visual Editor"
                     >
                        <Settings2 size={14} />
                     </button>
                     <button 
                        onClick={() => setVisualMode(false)}
                        className={`p-1 rounded ${!visualMode ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
                        title="JSON Code"
                     >
                        <Code size={14} />
                     </button>
                 </div>
            </div>

            {!visualMode ? (
                <div className="space-y-2">
                    <textarea
                        value={toolsDefinition}
                        onChange={(e) => setToolsDefinition(e.target.value)}
                        onBlur={() => handleBlur('toolsDefinition', toolsDefinition)}
                        className="w-full h-[400px] bg-gray-900 border border-gray-700 rounded p-2 text-xs text-green-400 focus:ring-1 focus:ring-blue-500 outline-none resize-none font-mono custom-scrollbar"
                        placeholder="[]"
                        spellCheck={false}
                    />
                     <button 
                        onClick={() => {
                            setToolsDefinition(SAMPLE_TOOL_DEFINITION);
                            handleConfigChange('toolsDefinition', SAMPLE_TOOL_DEFINITION);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300"
                     >
                        Load Sample JSON
                     </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {visualTools.map((tool, tIdx) => (
                        <div key={tIdx} className="bg-gray-900 border border-gray-800 rounded p-3 space-y-3">
                            <div className="flex items-start gap-2">
                                <div className="flex-1 space-y-2">
                                    <input 
                                        value={tool.name} 
                                        onChange={(e) => updateTool(tIdx, { name: e.target.value })}
                                        className="w-full bg-transparent border-b border-gray-700 text-sm font-medium focus:border-blue-500 outline-none"
                                        placeholder="Function Name"
                                    />
                                    <input 
                                        value={tool.description} 
                                        onChange={(e) => updateTool(tIdx, { description: e.target.value })}
                                        className="w-full bg-transparent text-xs text-gray-400 outline-none"
                                        placeholder="Description..."
                                    />
                                </div>
                                <button onClick={() => deleteTool(tIdx)} className="text-gray-600 hover:text-red-400">
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="pl-2 space-y-2">
                                <div className="text-[10px] font-bold text-gray-600 uppercase">Parameters</div>
                                {tool.parameters.map((param, pIdx) => (
                                    <div key={pIdx} className="flex items-center gap-2 bg-gray-950/50 p-1.5 rounded border border-gray-800/50">
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                            <input 
                                                value={param.name} 
                                                onChange={(e) => updateParam(tIdx, pIdx, { name: e.target.value })}
                                                className="bg-transparent text-xs font-mono text-blue-300 outline-none" 
                                                placeholder="arg_name"
                                            />
                                            <select 
                                                value={param.type}
                                                onChange={(e) => updateParam(tIdx, pIdx, { type: e.target.value })}
                                                className="bg-transparent text-[10px] text-gray-400 outline-none"
                                            >
                                                <option value="string">String</option>
                                                <option value="number">Number</option>
                                                <option value="boolean">Boolean</option>
                                            </select>
                                            <input 
                                                value={param.description} 
                                                onChange={(e) => updateParam(tIdx, pIdx, { description: e.target.value })}
                                                className="col-span-2 bg-transparent text-[10px] text-gray-500 outline-none" 
                                                placeholder="Description of argument..."
                                            />
                                        </div>
                                        <button onClick={() => deleteParam(tIdx, pIdx)} className="text-gray-700 hover:text-red-400">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => addParam(tIdx)}
                                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                >
                                    <Plus size={10} /> Add Parameter
                                </button>
                            </div>
                        </div>
                    ))}
                    <button 
                        onClick={addTool}
                        className="w-full py-2 border border-dashed border-gray-700 rounded text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                    >
                        + Add Function
                    </button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

import React from 'react';
import { Sidebar } from './components/Sidebar';
import { MessageList } from './components/MessageList';
import { ConfigPanel } from './components/ConfigPanel';
import { SettingsModal } from './components/SettingsModal';
import { useStore } from './store';

const App: React.FC = () => {
  const { currentSessionId } = useStore();

  return (
    <div className="flex h-screen w-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col relative min-w-0 bg-gray-950">
        {currentSessionId ? (
            <MessageList />
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 p-8 text-center">
                <h1 className="text-2xl font-bold mb-2 text-gray-400">Gemini Playground</h1>
                <p className="max-w-md text-sm">
                    Create a session to start engineering prompts. 
                    Add "System" messages for instructions, define tools in the panel, 
                    and manually edit conversation history.
                </p>
            </div>
        )}
      </main>
      
      <ConfigPanel />
      <SettingsModal />
    </div>
  );
};

export default App;
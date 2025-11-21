
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { AppState, Session, SessionConfig, PlaygroundMessage, ApiKeyConfig, Role } from './types';
import { DEFAULT_CONFIG } from './constants';

interface StoreActions {
  // Session Management
  createSession: () => void;
  deleteSession: (id: string) => void;
  switchSession: (id: string) => void;
  updateSessionConfig: (id: string, config: Partial<SessionConfig>) => void;
  updateSessionName: (id: string, name: string) => void;
  importSession: (session: Session) => void;
  
  // Message Management
  addMessage: (sessionId: string, message: Omit<PlaygroundMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (sessionId: string, messageId: string, updates: Partial<PlaygroundMessage>) => void;
  deleteMessage: (sessionId: string, messageId: string) => void;
  updateToolCallResult: (sessionId: string, messageId: string, toolCallId: string, result: string) => void;
  
  // Settings
  addApiKey: (name: string, key: string, baseUrl?: string) => void;
  removeApiKey: (id: string) => void;
  selectApiKey: (id: string) => void;
  toggleSidebar: () => void;
  toggleSettings: () => void;
}

type Store = AppState & StoreActions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      apiKeys: [],
      selectedApiKeyId: null,
      sidebarOpen: true,
      settingsOpen: false,
      theme: 'dark',

      createSession: () => {
        const newSession: Session = {
          id: uuidv4(),
          name: `Untitled Session ${new Date().toLocaleTimeString()}`,
          createdAt: Date.now(),
          messages: [
            {
                id: uuidv4(),
                role: Role.SYSTEM,
                content: "You are a helpful AI assistant.",
                timestamp: Date.now()
            }
          ],
          config: { ...DEFAULT_CONFIG },
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: newSession.id,
        }));
      },

      deleteSession: (id) => {
        set((state) => {
          const newSessions = state.sessions.filter((s) => s.id !== id);
          return {
            sessions: newSessions,
            currentSessionId: state.currentSessionId === id 
              ? (newSessions.length > 0 ? newSessions[0].id : null) 
              : state.currentSessionId,
          };
        });
      },

      switchSession: (id) => set({ currentSessionId: id }),

      updateSessionConfig: (id, config) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, config: { ...s.config, ...config } } : s
          ),
        }));
      },

      updateSessionName: (id, name) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, name } : s
          ),
        }));
      },

      importSession: (session) => {
        const newSession = { ...session, id: uuidv4() };
        set((state) => ({
            sessions: [newSession, ...state.sessions],
            currentSessionId: newSession.id
        }));
      },

      addMessage: (sessionId, message) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: [
                    ...s.messages,
                    { ...message, id: uuidv4(), timestamp: Date.now() },
                  ],
                }
              : s
          ),
        }));
      },

      updateMessage: (sessionId, messageId, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                }
              : s
          ),
        }));
      },

      deleteMessage: (sessionId, messageId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.filter((m) => m.id !== messageId),
                }
              : s
          ),
        }));
      },

      updateToolCallResult: (sessionId, messageId, toolCallId, result) => {
         set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) => {
                    if (m.id !== messageId || !m.toolCalls) return m;
                    return {
                        ...m,
                        toolCalls: m.toolCalls.map(tc => tc.id === toolCallId ? { ...tc, result } : tc)
                    }
                  }),
                }
              : s
          ),
        }));
      },

      addApiKey: (name, key, baseUrl) => {
        const newKey: ApiKeyConfig = { id: uuidv4(), name, key, baseUrl };
        set((state) => ({
          apiKeys: [...state.apiKeys, newKey],
          selectedApiKeyId: state.selectedApiKeyId || newKey.id,
        }));
      },

      removeApiKey: (id) => {
        set((state) => ({
          apiKeys: state.apiKeys.filter((k) => k.id !== id),
          selectedApiKeyId: state.selectedApiKeyId === id ? null : state.selectedApiKeyId,
        }));
      },

      selectApiKey: (id) => set({ selectedApiKeyId: id }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
    }),
    {
      name: 'gemini-playground-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

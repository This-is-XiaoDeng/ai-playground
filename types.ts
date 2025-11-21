
export enum Role {
  USER = 'user',
  MODEL = 'model', // We treat 'model' as 'assistant' in UI for continuity, mapped to 'assistant' in API
  SYSTEM = 'system',
  TOOL = 'tool' // Internal use if needed, though we handle tool outputs via the UI blocks on Model messages
}

export interface PlaygroundMessage {
  id: string;
  role: Role;
  content: string; // Text content
  timestamp: number;
  isToolCall?: boolean;
  toolCalls?: ToolCallInfo[];
  isError?: boolean;
}

export interface ToolCallInfo {
  id: string;
  name: string;
  args: Record<string, any>;
  result?: string; // JSON string of the result, entered manually by user
}

export interface SessionConfig {
  model: string;
  temperature: number;
  topP: number;
  topK: number; // Not always used in OpenAI, but kept for compatibility with some proxies
  maxOutputTokens?: number;
  toolsDefinition: string; // JSON string representing OpenAI Tool[]
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  messages: PlaygroundMessage[];
  config: SessionConfig;
}

export interface ApiKeyConfig {
  id: string;
  name: string;
  key: string;
  baseUrl?: string; // Per-key Base URL
}

export interface AppState {
  sessions: Session[];
  currentSessionId: string | null;
  apiKeys: ApiKeyConfig[];
  selectedApiKeyId: string | null;
  sidebarOpen: boolean;
  settingsOpen: boolean;
  theme: 'dark' | 'light';
}

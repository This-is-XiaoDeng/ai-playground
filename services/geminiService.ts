
import { PlaygroundMessage, Role, SessionConfig } from '../types';

interface GenerateResponse {
  text: string;
  toolCalls?: { id: string; name: string; args: any }[];
}

export class GeminiService { // Keeping class name for compatibility with existing imports in MessageList
  private apiKey: string;
  private baseUrl: string;
  private config: SessionConfig;

  constructor(apiKey: string, baseUrl: string | undefined, config: SessionConfig) {
    this.apiKey = apiKey;
    // Default to OpenAI official API if no base URL provided
    this.baseUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : 'https://api.openai.com/v1';
    this.config = config;
  }

  // Helper to reconstruct the full conversation history including function calls and responses
  // converting internal UI structure to OpenAI Chat Completion format
  private buildMessages(messages: PlaygroundMessage[]): any[] {
      const apiMessages: any[] = [];
      
      for (const msg of messages) {
          const role = msg.role === Role.MODEL ? 'assistant' : msg.role;

          if (msg.isToolCall && msg.toolCalls && msg.toolCalls.length > 0) {
              // 1. Push the Assistant message with tool_calls
              apiMessages.push({
                  role: 'assistant',
                  content: msg.content || null,
                  tool_calls: msg.toolCalls.map(tc => ({
                      id: tc.id,
                      type: 'function',
                      function: {
                          name: tc.name,
                          arguments: JSON.stringify(tc.args)
                      }
                  }))
              });

              // 2. Push subsequent Tool messages for any results that have been entered
              // In the UI, results are stored on the same message object.
              // We extract them here to form the valid conversation chain.
              msg.toolCalls.forEach(tc => {
                  if (tc.result) {
                      apiMessages.push({
                          role: 'tool',
                          tool_call_id: tc.id,
                          content: tc.result
                      });
                  }
              });
          } else {
              // Standard text message
              apiMessages.push({
                  role: role,
                  content: msg.content
              });
          }
      }
      return apiMessages;
  }

  async generate(messages: PlaygroundMessage[]): Promise<GenerateResponse> {
    const apiMessages = this.buildMessages(messages);
    
    // Parse tools from config
    let tools: any[] | undefined = undefined;
    try {
        const parsedTools = JSON.parse(this.config.toolsDefinition);
        if (Array.isArray(parsedTools) && parsedTools.length > 0) {
            tools = parsedTools;
        }
    } catch (e) {
        console.warn("Invalid tool definition", e);
    }

    const payload = {
        model: this.config.model,
        messages: apiMessages,
        temperature: this.config.temperature,
        top_p: this.config.topP,
        tools: tools,
        // stream: false // Explicitly disabling stream as requested
    };

    try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(err.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        const choice = data.choices?.[0];
        const message = choice?.message;

        if (!message) throw new Error("No message returned from API");

        let toolCalls: { id: string; name: string; args: any }[] = [];
        
        if (message.tool_calls) {
            toolCalls = message.tool_calls.map((tc: any) => {
                let args = {};
                try {
                    args = JSON.parse(tc.function.arguments);
                } catch (e) {
                    args = { raw: tc.function.arguments };
                }
                return {
                    id: tc.id,
                    name: tc.function.name,
                    args: args
                };
            });
        }

        return {
            text: message.content || '',
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined
        };

    } catch (error: any) {
        console.error("OpenAI API Error:", error);
        throw new Error(error.message || "Unknown API Error");
    }
  }
}

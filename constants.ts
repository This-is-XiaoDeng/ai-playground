
import { SessionConfig } from './types';

export const DEFAULT_MODEL = 'gpt-4o';

export const DEFAULT_CONFIG: SessionConfig = {
  model: DEFAULT_MODEL,
  temperature: 0.7,
  topP: 1.0,
  topK: 0, 
  maxOutputTokens: 4096,
  toolsDefinition: '[]',
};

export const SAMPLE_TOOL_DEFINITION = `[
  {
    "type": "function",
    "function": {
      "name": "get_weather",
      "description": "Get the current weather for a location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and state, e.g. San Francisco, CA"
          },
          "unit": {
            "type": "string",
            "enum": ["celsius", "fahrenheit"]
          }
        },
        "required": ["location"]
      }
    }
  }
]`;

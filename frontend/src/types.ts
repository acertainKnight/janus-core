export interface ModelSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
}

export interface Prompt {
  id: number;
  name: string;
  systemPrompt: string;
  userPrompt: string;
}

import Groq from 'groq-sdk';

const groqApiKey = process.env.GROQ_API_KEY || '';

export const groq = new Groq({
  apiKey: groqApiKey,
});

export const LLAMA_MODEL = 'llama-3.3-70b-versatile';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export async function chatCompletion(options: ChatOptions) {
  const {
    messages,
    temperature = 0.7,
    max_tokens = 2048,
    top_p = 1,
    stream = false,
  } = options;

  const response = await groq.chat.completions.create({
    model: LLAMA_MODEL,
    messages,
    temperature,
    max_tokens,
    top_p,
    stream,
  });

  return response;
}

export async function streamingChatCompletion(options: ChatOptions) {
  const {
    messages,
    temperature = 0.7,
    max_tokens = 2048,
    top_p = 1,
  } = options;

  const stream = await groq.chat.completions.create({
    model: LLAMA_MODEL,
    messages,
    temperature,
    max_tokens,
    top_p,
    stream: true,
  });

  return stream;
}

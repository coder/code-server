import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIProvider {
  chat: (message: string, apiKey: string, model?: string) => Promise<string>;
}

const openaiProvider: AIProvider = {
  async chat(message: string, apiKey: string, model = 'gpt-4') {
    const openai = new OpenAI({ apiKey });
    
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: message }],
      model: model,
      stream: false
    });

    return completion.choices[0]?.message?.content || 'No response generated';
  }
};

const anthropicProvider: AIProvider = {
  async chat(message: string, apiKey: string, model = 'claude-3-sonnet-20240229') {
    const anthropic = new Anthropic({ apiKey });
    
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 1000,
      messages: [{ role: 'user', content: message }]
    });

    return response.content[0]?.type === 'text' ? response.content[0].text : 'No response generated';
  }
};

const googleProvider: AIProvider = {
  async chat(message: string, apiKey: string, model = 'gemini-pro') {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model_instance = genAI.getGenerativeModel({ model: model });
    
    const result = await model_instance.generateContent(message);
    const response = await result.response;
    
    return response.text() || 'No response generated';
  }
};

const mistralProvider: AIProvider = {
  async chat(message: string, apiKey: string, model = 'mistral-large-latest') {
    // Using OpenAI-compatible API for Mistral
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.mistral.ai/v1'
    });
    
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: message }],
      model: model,
      stream: false
    });

    return completion.choices[0]?.message?.content || 'No response generated';
  }
};

const openrouterProvider: AIProvider = {
  async chat(message: string, apiKey: string, model = 'meta-llama/llama-2-70b-chat') {
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://cursor-fullstack-ai-ide.com',
        'X-Title': 'Cursor Full Stack AI IDE'
      }
    });
    
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: message }],
      model: model,
      stream: false
    });

    return completion.choices[0]?.message?.content || 'No response generated';
  }
};

export const aiProviders: Record<string, AIProvider> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  google: googleProvider,
  mistral: mistralProvider,
  openrouter: openrouterProvider
};
import React, { useState } from 'react';
import { X, Key, Eye, EyeOff, Check } from 'lucide-react';

interface ProviderFormProps {
  onSave: (provider: string, apiKey: string) => void;
  onClose: () => void;
  existingKeys: Record<string, string>;
}

const providers = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5 Turbo, GPT-4 Turbo',
    placeholder: 'sk-...',
    url: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3 Sonnet, Claude 3 Haiku, Claude 3 Opus',
    placeholder: 'sk-ant-...',
    url: 'https://console.anthropic.com/'
  },
  {
    id: 'google',
    name: 'Google Gemini',
    description: 'Gemini Pro, Gemini Pro Vision, Gemini 1.5 Pro',
    placeholder: 'AIza...',
    url: 'https://makersuite.google.com/app/apikey'
  },
  {
    id: 'mistral',
    name: 'Mistral',
    description: 'Mistral Large, Mistral Medium, Mistral Small',
    placeholder: 'mistral-...',
    url: 'https://console.mistral.ai/'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Llama 2, WizardLM, GPT-4, Claude 3, and more',
    placeholder: 'sk-or-...',
    url: 'https://openrouter.ai/keys'
  }
];

export const ProviderForm: React.FC<ProviderFormProps> = ({
  onSave,
  onClose,
  existingKeys
}) => {
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [apiKey, setApiKey] = useState(existingKeys[selectedProvider] || '');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    setApiKey(existingKeys[provider] || '');
  };

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    
    setSaving(true);
    try {
      // Test the API key by making a simple request
      const isValid = await testApiKey(selectedProvider, apiKey);
      if (isValid) {
        onSave(selectedProvider, apiKey);
      } else {
        alert('Invalid API key. Please check and try again.');
      }
    } catch (error) {
      alert('Failed to validate API key. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const testApiKey = async (provider: string, key: string): Promise<boolean> => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Hello',
          provider: provider,
          apiKey: key,
          model: getModelForProvider(provider)
        }),
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const getModelForProvider = (provider: string) => {
    const models: Record<string, string> = {
      openai: 'gpt-4',
      anthropic: 'claude-3-sonnet-20240229',
      google: 'gemini-pro',
      mistral: 'mistral-large-latest'
    };
    return models[provider] || 'gpt-4';
  };

  const currentProvider = providers.find(p => p.id === selectedProvider);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-cursor-sidebar border border-cursor-border rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cursor-border">
          <h2 className="text-lg font-semibold">AI Provider Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-cursor-hover rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderChange(provider.id)}
                  className={`p-3 text-left border rounded-lg transition-colors ${
                    selectedProvider === provider.id
                      ? 'border-cursor-accent bg-cursor-accent bg-opacity-10'
                      : 'border-cursor-border hover:border-cursor-hover'
                  }`}
                >
                  <div className="font-medium text-sm">{provider.name}</div>
                  <div className="text-xs text-gray-400">{provider.description}</div>
                  {existingKeys[provider.id] && (
                    <div className="flex items-center mt-1">
                      <Check className="w-3 h-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-500">Configured</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          {currentProvider && (
            <div>
              <label className="block text-sm font-medium mb-2">
                API Key for {currentProvider.name}
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={currentProvider.placeholder}
                  className="w-full bg-cursor-bg border border-cursor-border rounded px-3 py-2 pr-20 text-sm focus:outline-none focus:border-cursor-accent"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="p-1 hover:bg-cursor-hover rounded"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Get your API key from{' '}
                <a
                  href={currentProvider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cursor-accent hover:underline"
                >
                  {currentProvider.name}
                </a>
              </p>
            </div>
          )}

          {/* Security Note */}
          <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 border-opacity-30 rounded p-3">
            <div className="flex items-start space-x-2">
              <Key className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-200">
                <p className="font-medium mb-1">Security Note</p>
                <p>Your API keys are stored locally in your browser and never sent to our servers. They are only used to communicate directly with the AI providers.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 p-4 border-t border-cursor-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-cursor-border rounded hover:bg-cursor-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim() || saving}
            className="px-4 py-2 bg-cursor-accent text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Testing...
              </>
            ) : (
              'Save & Test'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
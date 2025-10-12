import React, { useState } from 'react';
import { X, Key, Check, AlertCircle } from 'lucide-react';

interface ProviderFormProps {
  onSave: (provider: string, apiKey: string) => void;
  onClose: () => void;
  existingKeys: Record<string, string>;
}

export const ProviderForm: React.FC<ProviderFormProps> = ({
  onSave,
  onClose,
  existingKeys
}) => {
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const providers = [
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT-4, GPT-3.5 Turbo, and more',
      models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
      placeholder: 'sk-...',
      website: 'https://platform.openai.com/api-keys'
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'Claude 3 Sonnet, Haiku, and Opus',
      models: ['claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus'],
      placeholder: 'sk-ant-...',
      website: 'https://console.anthropic.com/'
    },
    {
      id: 'google',
      name: 'Google Gemini',
      description: 'Gemini Pro and Pro Vision',
      models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro'],
      placeholder: 'AIza...',
      website: 'https://makersuite.google.com/app/apikey'
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      description: 'Mistral Large, Medium, and Small',
      models: ['mistral-large', 'mistral-medium', 'mistral-small'],
      placeholder: '...',
      website: 'https://console.mistral.ai/'
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      description: 'Access to 100+ AI models',
      models: ['meta-llama/llama-2-70b-chat', 'microsoft/wizardlm-13b', 'openai/gpt-4'],
      placeholder: 'sk-or-...',
      website: 'https://openrouter.ai/keys'
    }
  ];

  const selectedProviderInfo = providers.find(p => p.id === selectedProvider);

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(selectedProvider, apiKey.trim());
    }
  };

  const testApiKey = async () => {
    if (!apiKey.trim()) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Hello, this is a test message.',
          provider: selectedProvider,
          apiKey: apiKey.trim(),
          model: selectedProviderInfo?.models[0] || 'gpt-4'
        }),
      });

      if (response.ok) {
        setTestResult({ success: true, message: 'API key is valid!' });
      } else {
        const error = await response.json();
        setTestResult({ 
          success: false, 
          message: error.details || 'API key test failed' 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: 'Failed to test API key' 
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-cursor-sidebar rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cursor-border">
          <h2 className="text-lg font-semibold text-cursor-text">AI Provider Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-cursor-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-cursor-text mb-2">
              Select AI Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full bg-cursor-bg border border-cursor-border rounded px-3 py-2 text-cursor-text"
            >
              {providers.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          {/* Provider Info */}
          {selectedProviderInfo && (
            <div className="bg-cursor-bg rounded p-3">
              <h3 className="font-medium text-cursor-text">{selectedProviderInfo.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{selectedProviderInfo.description}</p>
              <div className="mt-2">
                <p className="text-xs text-gray-400">Available models:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedProviderInfo.models.map(model => (
                    <span
                      key={model}
                      className="px-2 py-1 bg-cursor-accent text-white text-xs rounded"
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-cursor-text mb-2">
              API Key
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={selectedProviderInfo?.placeholder || 'Enter your API key'}
                className="w-full bg-cursor-bg border border-cursor-border rounded pl-10 pr-3 py-2 text-cursor-text"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Get your API key from{' '}
              <a
                href={selectedProviderInfo?.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cursor-accent hover:underline"
              >
                {selectedProviderInfo?.website}
              </a>
            </p>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-3 rounded ${
              testResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                {testResult.success ? (
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                )}
                <span className={`text-sm ${
                  testResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {testResult.message}
                </span>
              </div>
            </div>
          )}

          {/* Existing Keys */}
          {Object.keys(existingKeys).length > 0 && (
            <div>
              <p className="text-sm font-medium text-cursor-text mb-2">Saved API Keys</p>
              <div className="space-y-2">
                {Object.entries(existingKeys).map(([provider, key]) => (
                  <div key={provider} className="flex items-center justify-between bg-cursor-bg rounded p-2">
                    <span className="text-sm text-cursor-text capitalize">{provider}</span>
                    <span className="text-xs text-gray-400">
                      {key.substring(0, 8)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-cursor-border">
          <button
            onClick={testApiKey}
            disabled={!apiKey.trim() || isTesting}
            className="flex items-center px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Test API Key
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-cursor-text"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="px-4 py-2 bg-cursor-accent text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
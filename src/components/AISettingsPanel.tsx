
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Brain, Key, Server } from 'lucide-react';
import { aiNotesService } from '@/services/aiNoteService';
import { toast } from 'sonner';

const AISettingsPanel: React.FC = () => {
  const [provider, setProvider] = useState<'openai' | 'ollama'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('http://localhost:11434');
  const [model, setModel] = useState('');

  useEffect(() => {
    // Load saved settings
    const savedProvider = localStorage.getItem('ai-provider') as 'openai' | 'ollama' || 'openai';
    const savedApiKey = localStorage.getItem('openai-api-key') || '';
    const savedBaseUrl = localStorage.getItem('ollama-base-url') || 'http://localhost:11434';
    const savedModel = localStorage.getItem('ai-model') || '';

    setProvider(savedProvider);
    setApiKey(savedApiKey);
    setBaseUrl(savedBaseUrl);
    setModel(savedModel);
  }, []);

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('ai-provider', provider);
    if (provider === 'openai') {
      localStorage.setItem('openai-api-key', apiKey);
      localStorage.setItem('ai-model', model || 'gpt-4o-mini');
    } else {
      localStorage.setItem('ollama-base-url', baseUrl);
      localStorage.setItem('ai-model', model || 'llama2');
    }

    // Update AI service config
    aiNotesService.setConfig({
      provider,
      apiKey: provider === 'openai' ? apiKey : undefined,
      baseUrl: provider === 'ollama' ? baseUrl : undefined,
      model: model || (provider === 'openai' ? 'gpt-4o-mini' : 'llama2')
    });

    toast.success('AI settings saved successfully');
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
          <span>AI Assistant Settings</span>
          <Badge variant="outline" style={{ borderColor: 'var(--theme-accent)', color: 'var(--theme-accent)' }}>
            Beta
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="provider">AI Provider</Label>
          <Select value={provider} onValueChange={(value: 'openai' | 'ollama') => setProvider(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select AI provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
              <SelectItem value="ollama">Ollama (Local)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* OpenAI Settings */}
        {provider === 'openai' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="api-key" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                OpenAI API Key
              </Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="font-mono"
              />
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Your API key is stored locally and never sent to our servers
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="openai-model">Model</Label>
              <Select value={model || 'gpt-4o-mini'} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Recommended)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Ollama Settings */}
        {provider === 'ollama' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="base-url" className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                Ollama Base URL
              </Label>
              <Input
                id="base-url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ollama-model">Model</Label>
              <Input
                id="ollama-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="llama2, codellama, etc."
              />
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Make sure the model is installed in Ollama
              </p>
            </div>
          </>
        )}

        <Button 
          onClick={handleSave} 
          className="w-full"
          style={{
            backgroundColor: 'var(--theme-accent)',
            color: 'white'
          }}
        >
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default AISettingsPanel;

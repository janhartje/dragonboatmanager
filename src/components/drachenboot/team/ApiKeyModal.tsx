'use client';

import React, { useState } from 'react';
import { getBaseUrl } from '@/utils/url';


import { X, Copy, Check, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<string | null>;
}

export function ApiKeyModal({ isOpen, onClose, onSubmit }: ApiKeyModalProps) {
  const t = useTranslations();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  
  const baseUrl = getBaseUrl();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('api.keyNameRequired') || 'Please enter a name for the API key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const key = await onSubmit(name.trim());
      if (key) {
        setGeneratedKey(key);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate API key');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName('');
    setGeneratedKey(null);
    setError('');
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          {generatedKey 
            ? (t('api.keyGenerated') || 'API Key Generated') 
            : (t('api.generateKey') || 'Generate New API Key')}
        </h2>

        {!generatedKey ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="keyName"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('api.keyName') || 'API Key Name'}
              </label>
              <input
                type="text"
                id="keyName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('api.keyNamePlaceholder') || 'e.g., Claude Desktop, Development'}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('api.keyNameDesc') || 'Give this key a descriptive name so you can identify it later'}
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                disabled={loading}
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (t('api.loading') || 'Generating...') : (t('api.generateKey') || 'Generate Key')}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="mb-4 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <div className="flex items-start">
                <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-500" />
                <div className="text-sm text-yellow-700 dark:text-yellow-400">
                  <p className="font-semibold">{t('api.saveKeyWarning') || 'Save this API key now!'}</p>
                  <p className="mt-1">
                    {t('api.saveKeyWarningDesc') || 'This is the only time you will see this key. Store it in a safe place.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('api.yourKey') || 'Your API Key'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedKey}
                  readOnly
                  className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t('api.copied') || 'Copied!'}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {t('api.copyKey') || 'Copy'}
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-4 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                {t('api.nextSteps') || 'Next Steps: Configure Claude Desktop'}
              </p>
              <p className="mt-2 text-xs text-blue-700 dark:text-blue-400">
                Add this to your <code className="rounded bg-blue-100 px-1 dark:bg-blue-800">claude_desktop_config.json</code>:
              </p>
              <pre className="mt-2 overflow-x-auto rounded bg-blue-100 p-2 text-xs dark:bg-blue-900/40">
{`{
  "mcpServers": {
    "drachenboot": {
      "command": "npx",
      "args": [
        "-y",
        "@mcpwizard/sse-bridge",
        "${baseUrl}/api/mcp",
        "--header",
        "X-API-KEY:${generatedKey}"
      ]
    }
  }
}`}
              </pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {t('api.done') || 'Done'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

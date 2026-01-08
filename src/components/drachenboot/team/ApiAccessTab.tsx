'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Key, Trash2, Plus, ExternalLink, AlertCircle } from 'lucide-react';
import { ApiKeyModal } from './ApiKeyModal';
import { useLanguage } from '@/context/LanguageContext';
import { ConfirmModal } from '@/components/ui/Modals';
import { Link } from '@/i18n/routing';

interface ApiKey {
  id: string;
  name: string;
  lastUsed: string | null;
  createdAt: string;
}

interface ApiAccessTabProps {
  teamId: string;
  isPro: boolean;
}

export function ApiAccessTab({ teamId, isPro }: ApiAccessTabProps) {
  const { t } = useLanguage();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  
  // Delete confirmation state
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}/api-keys`);
      if (!res.ok) {
        throw new Error('Failed to fetch API keys');
      }
      const data = await res.json();
      setApiKeys(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (isPro) {
      fetchApiKeys();
    }
  }, [isPro, fetchApiKeys]);

  const handleCreateKey = async (name: string): Promise<string | null> => {
    const res = await fetch(`/api/teams/${teamId}/api-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create API key');
    }

    const data = await res.json();
    await fetchApiKeys(); // Refresh the list
    return data.key;
  };

  const handleDeleteKey = async () => {
    if (!deleteConfirmKey) return;

    try {
      const res = await fetch(`/api/teams/${teamId}/api-keys/${deleteConfirmKey}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to revoke API key');
      }

      await fetchApiKeys(); // Refresh the list
      setDeleteConfirmKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('api.never') || 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!isPro) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <Key className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          {t('api.proRequired') || 'MCP API Access is a PRO Feature'}
        </h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          {t('api.proRequiredDesc') || 'Upgrade to PRO to access the Model Context Protocol API and integrate with AI assistants like Claude Desktop.'}
        </p>
        <Link
          href={`/app/teams/${teamId}/upgrade`}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('api.upgradeBtn') || 'Upgrade to PRO'}
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-300">
          <AlertCircle className="h-4 w-4" />
          {t('api.aboutTitle') || 'About MCP API Access'}
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400">
          {t('api.aboutDesc') || 'The Model Context Protocol (MCP) allows AI assistants like Claude Desktop to interact with your team data programmatically. Generate an API key to enable this integration.'}
        </p>
        <a
          href="https://github.com/janhartje/drachenbootplan/blob/main/docs/mcp-guide.md"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        >
          {t('api.learnMore') || 'Learn more about MCP'}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('api.title') || 'API Keys'}</h3>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          {t('api.generateKey') || 'Generate New Key'}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">{t('api.loading') || 'Loading...'}</div>
      ) : apiKeys.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <Key className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('api.noKeys') || 'No API keys yet'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
             {t('api.noKeysDesc') || 'Generate a key to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{key.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('api.created') || 'Created'}: {formatDate(key.createdAt)} • {t('api.lastUsed') || 'Last used'}: {formatDate(key.lastUsed)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteConfirmKey(key.id)}
                className="rounded-md p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                title={t('api.revokeKey') || 'Revoke API key'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ApiKeyModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateKey}
      />

      <ConfirmModal
        isOpen={!!deleteConfirmKey}
        onCancel={() => setDeleteConfirmKey(null)}
        onConfirm={handleDeleteKey}
        title={t('api.revokeKey') || 'Delete API Key'}
        message={t('api.revokeConfirm') || 'Are you sure you want to delete this API key? This action cannot be undone.'}
        confirmLabel={t('api.revokeKey') || 'Delete'}
        cancelLabel={t('cancel') || 'Cancel'}
        isDestructive={true}
      />
    </div>
  );
}

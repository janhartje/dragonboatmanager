import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, AlertTriangle, X } from 'lucide-react';

interface SyncLog {
  id: string;
  status: 'SUCCESS' | 'ERROR';
  createdCount: number;
  updatedCount: number;
  deletedCount: number;
  error?: string;
  details?: string[];
  createdAt: string;
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface SyncHistoryListProps {
  teamId: string;
  refreshTrigger: number; // Increment to reload
  t: (key: string) => string;
}

export const SyncHistoryList: React.FC<SyncHistoryListProps> = ({ teamId, refreshTrigger, t }) => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);

  const fetchLogs = async (currentPage: number) => {
    if (!teamId) return;
    setLoading(true);
    try {
        const res = await fetch(`/api/teams/${teamId}/sync-history?page=${currentPage}&limit=5`);
        if (!res.ok) throw new Error('Failed to fetch logs');
        const result = await res.json();
        
        // Handle both old array format (fallback) and new paginated format
        if (Array.isArray(result)) {
             setLogs(result);
             setPagination(null);
        } else {
            setLogs(result.data);
            setPagination(result.pagination);
        }
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, refreshTrigger, page]);

  if (loading && logs.length === 0) {
      return <div className="text-xs text-slate-400 animate-pulse mt-4">Loading history...</div>;
  }

  if (logs.length === 0 && !loading) {
      return null;
  }

  return (
    <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
        <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide flex justify-between items-center">
            {t('icalSyncHistory') || 'Sync History'}
            {(pagination?.totalPages || 0) > 1 && (
                <span className="text-[10px] font-normal lowercase">
                    {t('icalSyncPage') || 'Page'} {pagination?.page} {t('icalSyncOf') || 'of'} {pagination?.totalPages}
                </span>
            )}
        </h4>
        
        <div className="space-y-2">
            {logs.length === 0 && <p className="text-xs text-slate-400">{t('icalSyncNoLogs') || 'No sync history available.'}</p>}
            
            {logs.map(log => (
                <div 
                    key={log.id} 
                    className="flex items-start gap-2 text-xs p-2 rounded bg-slate-50 dark:bg-slate-800/50 transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setSelectedLog(log)}
                >
                    {log.status === 'SUCCESS' ? (
                        <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                    ) : (
                        <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                            <span className={`font-medium ${log.status === 'SUCCESS' ? 'text-slate-700 dark:text-slate-300' : 'text-red-600'}`}>
                                {log.status === 'SUCCESS' ? (t('icalSyncStatusSuccess') || 'Success') : (t('icalSyncStatusError') || 'Error')}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                                {new Date(log.createdAt).toLocaleString()}
                            </span>
                        </div>
                        {log.status === 'SUCCESS' ? (
                            <p className="text-slate-500">
                                {log.createdCount} {t('icalSyncCreated') || 'created'}, {log.updatedCount} {t('icalSyncUpdated') || 'updated'}, {log.deletedCount} {t('icalSyncDeleted') || 'deleted'}
                            </p>
                        ) : (
                            <p className="text-red-500/80 truncate" title={log.error}>
                                {log.error || t('icalSyncUnknownError') || 'Unknown error'}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-3">
                <button
                    type="button"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                    title={t('icalSyncPrev') || 'Previous'}
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages || loading}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                    title={t('icalSyncNext') || 'Next'}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        )}

        {/* Detail Modal */}
        {selectedLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`flex items-center gap-2 ${selectedLog.status === 'ERROR' ? 'text-red-600' : 'text-slate-700 dark:text-slate-200'}`}>
                            {selectedLog.status === 'ERROR' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                            <h3 className="font-semibold text-lg">
                                {selectedLog.status === 'ERROR' ? (t('icalSyncErrorDetails') || 'Error Details') : (t('icalSyncLogTitle') || 'Sync Details')}
                            </h3>
                        </div>
                        <button 
                            onClick={() => setSelectedLog(null)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-md border border-slate-100 dark:border-slate-800 overflow-x-auto max-h-[60vh] overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap font-mono text-slate-600 dark:text-slate-400">
                            {selectedLog.error ? (
                                <span className="text-red-600 block mb-2 font-bold">{selectedLog.error}</span>
                            ) : null}
                            {selectedLog.details && selectedLog.details.length > 0 
                                ? selectedLog.details.join('\n') 
                                : (selectedLog.status === 'SUCCESS' ? (t('icalSyncStatusSuccess') || 'Success') : '')}
                        </pre>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => setSelectedLog(null)}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                        >
                            {t('icalSyncClose') || 'Close'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

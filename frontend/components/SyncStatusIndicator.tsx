import React from 'react';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SyncStatusIndicatorProps {
  syncing?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ syncing = false }) => {
  const { user, isGuest } = useAuth();
  const progressSyncEnabled = import.meta.env.VITE_ENABLE_PROGRESS_SYNC === 'true';

  if (!progressSyncEnabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-st-charcoal/90 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 shadow-xl flex items-center gap-2">
        {syncing ? (
          <>
            <Loader2 size={16} className="animate-spin text-blue-400" />
            <span className="text-xs text-gray-400">Syncing...</span>
          </>
        ) : user && !isGuest ? (
          <>
            <Cloud size={16} className="text-green-400" />
            <span className="text-xs text-gray-400">Synced</span>
          </>
        ) : (
          <>
            <CloudOff size={16} className="text-gray-500" />
            <span className="text-xs text-gray-500">Local only</span>
          </>
        )}
      </div>
    </div>
  );
};

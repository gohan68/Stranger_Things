import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveProgress, fetchAllProgress, syncLocalProgressToSupabase } from '../lib/api/progress';

interface ProgressState {
  [chapterId: string]: number; // scroll percentage
}

export const useReadingProgress = () => {
  const { user, isGuest } = useAuth();
  const [progress, setProgress] = useState<ProgressState>({});
  const [syncing, setSyncing] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);

  const progressSyncEnabled = import.meta.env.VITE_ENABLE_PROGRESS_SYNC === 'true';

  // Load progress on mount and user change
  useEffect(() => {
    if (!progressSyncEnabled) return;

    if (user) {
      // Authenticated user: load from Supabase
      loadProgressFromSupabase();
      // Sync any local progress to Supabase
      syncLocalProgressToSupabase(user.id);
    } else {
      // Guest user: load from localStorage
      loadProgressFromLocalStorage();
    }
  }, [user, progressSyncEnabled]);

  const loadProgressFromSupabase = async () => {
    if (!user) return;

    try {
      setSyncing(true);
      const data = await fetchAllProgress(user.id);
      const progressMap: ProgressState = {};
      data.forEach(p => {
        progressMap[p.chapter_id] = p.scroll_percentage;
      });
      setProgress(progressMap);
    } catch (error) {
      console.error('Error loading progress from Supabase:', error);
      // Fallback to localStorage
      loadProgressFromLocalStorage();
    } finally {
      setSyncing(false);
    }
  };

  const loadProgressFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('chapterScrollPositions');
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading progress from localStorage:', error);
    }
  };

  const saveProgressDebounced = useCallback(
    async (chapterId: string, scrollPercentage: number) => {
      if (!progressSyncEnabled) return;

      // Always save to localStorage immediately
      const newProgress = { ...progress, [chapterId]: scrollPercentage };
      setProgress(newProgress);
      localStorage.setItem('chapterScrollPositions', JSON.stringify(newProgress));

      // For authenticated users, debounce Supabase saves (every 5 seconds)
      if (user && !isGuest) {
        const now = Date.now();
        if (now - lastSaveTime > 5000) {
          try {
            await saveProgress(user.id, {
              chapter_id: chapterId,
              scroll_percentage: scrollPercentage
            });
            setLastSaveTime(now);
          } catch (error) {
            console.error('Error saving progress to Supabase:', error);
          }
        }
      }
    },
    [user, isGuest, progress, lastSaveTime, progressSyncEnabled]
  );

  const getProgress = (chapterId: string): number => {
    return progress[chapterId] || 0;
  };

  return {
    progress,
    getProgress,
    saveProgress: saveProgressDebounced,
    syncing
  };
};

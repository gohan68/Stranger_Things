import { supabase, ReadingProgress } from '../supabase';

export interface SaveProgressData {
  chapter_id: string;
  scroll_percentage: number;
}

/**
 * Save reading progress to Supabase (authenticated users only)
 */
export const saveProgress = async (
  userId: string,
  progressData: SaveProgressData
): Promise<ReadingProgress> => {
  try {
    const { data, error } = await supabase
      .from('reading_progress')
      .upsert(
        {
          user_id: userId,
          chapter_id: progressData.chapter_id,
          scroll_percentage: progressData.scroll_percentage,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,chapter_id'
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving progress:', error);
    throw error;
  }
};

/**
 * Fetch all reading progress for a user
 */
export const fetchAllProgress = async (
  userId: string
): Promise<ReadingProgress[]> => {
  try {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching progress:', error);
    throw error;
  }
};

/**
 * Fetch progress for a specific chapter
 */
export const fetchChapterProgress = async (
  userId: string,
  chapterId: string
): Promise<ReadingProgress | null> => {
  try {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('chapter_id', chapterId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching chapter progress:', error);
    return null;
  }
};

/**
 * Sync local storage progress to Supabase (on login)
 */
export const syncLocalProgressToSupabase = async (userId: string): Promise<void> => {
  try {
    // Get local progress from localStorage
    const localLastChapter = localStorage.getItem('lastReadChapter');
    const localScrollPositions = localStorage.getItem('chapterScrollPositions');

    if (!localLastChapter) return;

    // Parse scroll positions if they exist
    const scrollPositions: Record<string, number> = localScrollPositions
      ? JSON.parse(localScrollPositions)
      : {};

    // Fetch existing progress from Supabase
    const existingProgress = await fetchAllProgress(userId);
    const existingMap = new Map(
      existingProgress.map(p => [p.chapter_id, p])
    );

    // Sync each chapter's progress
    const syncPromises = Object.entries(scrollPositions).map(
      async ([chapterId, scrollPercentage]) => {
        const existing = existingMap.get(chapterId);
        const localTimestamp = new Date().getTime(); // Use current time as proxy

        // Only sync if local progress is newer or doesn't exist in Supabase
        if (!existing) {
          await saveProgress(userId, {
            chapter_id: chapterId,
            scroll_percentage: scrollPercentage
          });
        }
      }
    );

    await Promise.all(syncPromises);
  } catch (error) {
    console.error('Error syncing local progress:', error);
  }
};

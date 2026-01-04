export interface Chapter {
  id: string;
  title: string;
  excerpt: string;
  content: string;
}

export interface Story {
  title: string;
  author: string;
  description: string;
  dedication: string;
  chapters: Chapter[];
}

export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  theme: 'dark' | 'light' | 'sepia';
}

export interface ReadingProgress {
  lastChapterId: string;
  scrollPosition: number; // Percentage 0-1
}
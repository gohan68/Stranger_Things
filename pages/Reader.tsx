import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Settings, ChevronLeft, ChevronRight, Menu as MenuIcon } from 'lucide-react';
import { story } from '../story';
import { ReaderSettings } from '../types';
import { CommentSection } from '../components/comments/CommentSection';
import { useReadingProgress } from '../hooks/useReadingProgress';

const defaultSettings: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.6,
  theme: 'dark'
};

export const Reader: React.FC = () => {
  const { chapterId } = useParams<{ chapterId?: string }>();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const { saveProgress, getProgress } = useReadingProgress();
  
  // State
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const saved = localStorage.getItem('readerSettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Determine current chapter
  const currentIndex = chapterId 
    ? story.chapters.findIndex(c => c.id === chapterId)
    : 0; // Default to first chapter
  
  const currentChapter = story.chapters[currentIndex];
  
  const prevChapter = currentIndex > 0 ? story.chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < story.chapters.length - 1 ? story.chapters[currentIndex + 1] : null;

  // Effects
  useEffect(() => {
    localStorage.setItem('readerSettings', JSON.stringify(settings));
  }, [settings]);

  // Save progress on scroll with throttling
  useEffect(() => {
    if (!currentChapter) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          const scrollTop = window.scrollY;
          const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;

          // Save progress (debounced in hook)
          saveProgress(currentChapter.id, Math.min(scrollPercentage, 100));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentChapter, saveProgress]);

  useEffect(() => {
    // Save last read chapter
    if (currentChapter) {
      localStorage.setItem('lastReadChapter', currentChapter.id);
    }
    // Scroll to saved position or top
    const savedProgress = getProgress(currentChapter?.id || '');
    if (savedProgress > 0) {
      setTimeout(() => {
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const scrollTop = (savedProgress / 100) * (documentHeight - windowHeight);
        window.scrollTo(0, scrollTop);
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [currentChapter, getProgress]);

  // If no ID provided, redirect to saved or first
  useEffect(() => {
    if (!chapterId) {
      const saved = localStorage.getItem('lastReadChapter');
      if (saved) {
        navigate(`/read/${saved}`, { replace: true });
      } else {
        navigate(`/read/${story.chapters[0].id}`, { replace: true });
      }
    }
  }, [chapterId, navigate]);

  if (!currentChapter) return <div>Loading...</div>;

  // Theme Classes
  const themeClasses = {
    dark: 'bg-st-black text-gray-300',
    light: 'bg-gray-100 text-gray-900',
    sepia: 'bg-[#f4ecd8] text-[#5b4636]',
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses[settings.theme]}`}>
      
      {/* Reader Controls Bar (Sticky) */}
      <div className={`sticky top-16 z-30 border-b transition-colors duration-300 ${
          settings.theme === 'dark' ? 'bg-st-black/90 border-white/10' : 
          settings.theme === 'light' ? 'bg-white/90 border-gray-200' : 'bg-[#f4ecd8]/90 border-[#d3c4a9]'
      } backdrop-blur`}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded hover:bg-black/10 dark:hover:bg-white/10"
          >
            <MenuIcon size={20} />
          </button>
          
          <span className="font-display tracking-wider text-sm truncate max-w-[200px] sm:max-w-md">
            {currentChapter.title}
          </span>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded hover:bg-black/10 dark:hover:bg-white/10"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Settings Dropdown */}
        {showSettings && (
          <div className="absolute right-4 top-14 p-4 rounded shadow-xl w-64 border z-50 bg-st-charcoal border-gray-700 text-gray-200">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-2 uppercase">Theme</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSettings({...settings, theme: 'light'})}
                    className={`w-8 h-8 rounded-full bg-gray-100 border-2 ${settings.theme === 'light' ? 'border-st-red' : 'border-transparent'}`}
                  />
                  <button 
                    onClick={() => setSettings({...settings, theme: 'sepia'})}
                    className={`w-8 h-8 rounded-full bg-[#f4ecd8] border-2 ${settings.theme === 'sepia' ? 'border-st-red' : 'border-transparent'}`}
                  />
                  <button 
                    onClick={() => setSettings({...settings, theme: 'dark'})}
                    className={`w-8 h-8 rounded-full bg-st-black border-2 ${settings.theme === 'dark' ? 'border-st-red' : 'border-gray-600'}`}
                  />
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-400 mb-2 uppercase">Size: {settings.fontSize}px</p>
                <input 
                  type="range" 
                  min="14" 
                  max="24" 
                  value={settings.fontSize}
                  onChange={(e) => setSettings({...settings, fontSize: parseInt(e.target.value)})}
                  className="w-full accent-st-red"
                />
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2 uppercase">Spacing</p>
                <div className="flex gap-2 text-sm">
                   <button 
                    onClick={() => setSettings({...settings, lineHeight: 1.4})}
                    className={`px-3 py-1 rounded ${settings.lineHeight === 1.4 ? 'bg-st-red text-white' : 'bg-white/10'}`}
                   >Compact</button>
                   <button 
                    onClick={() => setSettings({...settings, lineHeight: 1.8})}
                    className={`px-3 py-1 rounded ${settings.lineHeight === 1.8 ? 'bg-st-red text-white' : 'bg-white/10'}`}
                   >Relaxed</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-80 h-full bg-st-charcoal border-r border-white/10 shadow-2xl overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-st-red text-xl">Chapters</h3>
              <button onClick={() => setShowSidebar(false)}><ChevronLeft /></button>
            </div>
            <div className="space-y-2">
              {story.chapters.map((chapter) => (
                <Link
                  key={chapter.id}
                  to={`/read/${chapter.id}`}
                  onClick={() => setShowSidebar(false)}
                  className={`block p-3 rounded transition-colors ${
                    chapter.id === currentChapter.id 
                      ? 'bg-st-red/10 text-st-red border-l-2 border-st-red' 
                      : 'hover:bg-white/5 text-gray-400'
                  }`}
                >
                  <p className="text-sm font-bold">{chapter.title}</p>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex-grow bg-black/50 backdrop-blur-sm" onClick={() => setShowSidebar(false)}></div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center text-st-red opacity-90">
          {currentChapter.title}
        </h1>
        
        <div 
          ref={contentRef}
          className="font-serif prose prose-lg max-w-none prose-p:mb-6 prose-p:leading-relaxed prose-invert"
          style={{ 
            fontSize: `${settings.fontSize}px`, 
            lineHeight: settings.lineHeight 
          }}
        >
          {currentChapter.content.split('\n\n').map((paragraph, idx) => {
            // Check for bold syntax **Text**
            const parts = paragraph.split(/(\*\*.*?\*\*)/g);
            return (
              <p key={idx} className={settings.theme !== 'dark' ? 'text-gray-800' : 'text-gray-300'}>
                {parts.map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-sans font-bold block mt-8 mb-4 text-xl">{part.slice(2, -2)}</strong>;
                  }
                  return part;
                })}
              </p>
            );
          })}
        </div>

        {/* Navigation Footer */}
        <div className="mt-20 pt-8 border-t border-gray-700 flex justify-between items-center">
          {prevChapter ? (
            <Link 
              to={`/read/${prevChapter.id}`}
              className="flex items-center text-st-red hover:text-white transition-colors"
            >
              <ChevronLeft className="mr-2" />
              <div className="text-left">
                <span className="text-xs text-gray-500 block">Previous</span>
                <span className="font-display hidden sm:inline">{prevChapter.title}</span>
              </div>
            </Link>
          ) : <div></div>}

          {nextChapter ? (
            <Link 
              to={`/read/${nextChapter.id}`}
              className="flex items-center text-st-red hover:text-white transition-colors text-right"
            >
              <div className="text-right">
                <span className="text-xs text-gray-500 block">Next</span>
                <span className="font-display hidden sm:inline">{nextChapter.title}</span>
              </div>
              <ChevronRight className="ml-2" />
            </Link>
          ) : (
            <Link to="/chapters" className="text-gray-500 hover:text-white">Return to Index</Link>
          )}
        </div>
      </div>

      {/* Comment Section */}
      <CommentSection chapterId={currentChapter.id} />
    </div>
  );
};
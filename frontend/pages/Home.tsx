import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Download, Loader2 } from 'lucide-react';
import { story } from '../story';

export const Home: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    
    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = '/stranger-things-the-right-side-up.pdf';
      link.download = 'Stranger-Things-The-Right-Side-Up.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success feedback
      setTimeout(() => {
        setIsDownloading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to download PDF', error);
      alert('Failed to download PDF. Please try again.');
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
      
      {/* Hero Section */}
      <div className="relative z-10 text-center space-y-8 px-4 max-w-4xl">
        <h1 className="text-5xl md:text-7xl font-display font-bold tracking-wider text-st-red drop-shadow-[0_0_25px_rgba(220,38,38,0.5)] animate-pulse-slow">
          {story.title}
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 font-light tracking-wide">
          {story.description}
        </p>
        
        <p className="text-gray-500 italic text-lg">
          By {story.author}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Link 
            to="/read" 
            className="group flex items-center gap-3 bg-st-red hover:bg-red-700 text-white px-8 py-4 rounded-lg font-display text-lg tracking-wider transition-all hover:scale-105 shadow-lg hover:shadow-red-500/50"
            data-testid="start-reading-btn"
          >
            <BookOpen className="group-hover:rotate-12 transition-transform" />
            START READING
          </Link>
          
          <button 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 text-gray-300 px-8 py-4 rounded-lg font-display text-lg tracking-wider transition-all hover:scale-105 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="download-pdf-btn"
          >
            {isDownloading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download className="group-hover:translate-y-1 transition-transform" />
            )}
            {isDownloading ? 'DOWNLOADING...' : 'DOWNLOAD PDF'}
          </button>
        </div>

        <div className="pt-8 text-gray-500 text-sm">
          <p>{story.chapters.length} Chapters • Fan Fiction • Non-Commercial</p>
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-st-red/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl"></div>
      </div>

      {/* Chapter Preview */}
      <div className="relative z-10 mt-20 w-full max-w-5xl px-4 pb-20">
        <h2 className="text-3xl font-display font-bold text-gray-300 mb-8 text-center">
          Chapters
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {story.chapters.slice(0, 6).map((chapter) => (
            <Link
              key={chapter.id}
              to={`/read/${chapter.id}`}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all hover:border-st-red/50"
              data-testid={`chapter-preview-${chapter.id}`}
            >
              <h3 className="font-display text-lg font-bold text-st-red mb-2 group-hover:text-red-400 transition-colors">
                {chapter.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {chapter.excerpt}
              </p>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link 
            to="/chapters" 
            className="text-st-red hover:text-red-400 font-display tracking-wider transition-colors"
            data-testid="view-all-chapters-link"
          >
            VIEW ALL {story.chapters.length} CHAPTERS →
          </Link>
        </div>
      </div>
    </div>
  );
};

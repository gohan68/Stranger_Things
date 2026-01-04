import React from 'react';
import { Link } from 'react-router-dom';
import { story } from '../story';

export const ChapterIndex: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-display font-bold text-white mb-4">CHAPTERS</h1>
        <div className="w-16 h-1 bg-st-red mx-auto rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {story.chapters.map((chapter, index) => (
          <Link 
            key={chapter.id} 
            to={`/read/${chapter.id}`}
            className="group block p-6 bg-white/5 border border-white/10 rounded-lg hover:border-st-red transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-[0_5px_15px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-display tracking-widest text-st-red uppercase">
                {index === 0 ? 'Start' : `Part ${index + 1}`}
              </span>
              <span className="text-xs text-gray-500 font-serif">
                ~{Math.ceil(chapter.content.length / 1000)} min read
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-100 group-hover:text-white mb-3">
              {chapter.title}
            </h2>
            <p className="text-gray-400 text-sm font-serif line-clamp-2">
              {chapter.excerpt}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};
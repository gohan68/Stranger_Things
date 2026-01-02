import React from 'react';
import { story } from '../story';

export const About: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-display text-st-red mb-8">About the Story</h1>
      <div className="prose prose-invert mx-auto font-serif text-gray-300">
        <p className="text-lg italic mb-8">"{story.dedication}"</p>
        <p>
          This novel, <strong>The Right Side Up</strong>, is an emotional rewrite of the Stranger Things finale. 
          It explores the themes of healing, trauma recovery, and the quiet life that comes after the battle is won.
        </p>
        <p>
          Written by <strong>{story.author}</strong>, this project was born out of a desire to give the characters—and the fans—the closure they deserved.
        </p>
      </div>
    </div>
  );
};

export const Legal: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-display text-st-red mb-8 border-b border-gray-800 pb-4">Legal Disclaimer</h1>
      <div className="prose prose-invert font-serif text-sm text-gray-400">
        <p className="mb-6">
          <strong>Non-Commercial Use Only:</strong> This website and the story contained within are entirely non-commercial fan fiction. No profit is being made from this work. It is available for free for fans to read.
        </p>
        <p className="mb-6">
          <strong>Copyright:</strong> "Stranger Things", its characters, settings, and related assets are the intellectual property of The Duffer Brothers and Netflix. This work is not affiliated with, endorsed by, or sponsored by Netflix or the creators of the original series.
        </p>
        <p className="mb-6">
          <strong>Content Ownership:</strong> The transformative story text "The Right Side Up" is © 2026 {story.author}. Do not repost or distribute for profit.
        </p>
        <p>
          If you are a rights holder and wish for this content to be removed, please contact the developer via the repository issue tracker.
        </p>
      </div>
    </div>
  );
};
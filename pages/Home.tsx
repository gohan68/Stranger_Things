import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Download, Loader2 } from 'lucide-react';
import { story } from '../story';
import { jsPDF } from "jspdf";

export const Home: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    
    // Slight delay to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const textWidth = pageWidth - (margin * 2);

      // --- Title Page ---
      doc.setFont("times", "bold");
      doc.setFontSize(24);
      const titleLines = doc.splitTextToSize(story.title.toUpperCase(), textWidth);
      doc.text(titleLines, pageWidth / 2, 80, { align: "center" });

      doc.setFontSize(14);
      doc.setFont("times", "normal");
      doc.text(`By ${story.author}`, pageWidth / 2, 100, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "italic");
      const descLines = doc.splitTextToSize(story.description, textWidth - 20);
      doc.text(descLines, pageWidth / 2, 120, { align: "center" });

      // --- Dedication Page ---
      doc.addPage();
      doc.setFont("times", "italic");
      doc.setFontSize(12);
      const dedLines = doc.splitTextToSize(story.dedication, textWidth - 40);
      doc.text(dedLines, pageWidth / 2, pageHeight / 2, { align: "center" });

      // --- Chapters ---
      story.chapters.forEach(chapter => {
        doc.addPage();
        
        // Chapter Title
        doc.setFont("times", "bold");
        doc.setFontSize(18);
        const chTitleLines = doc.splitTextToSize(chapter.title, textWidth);
        doc.text(chTitleLines, pageWidth / 2, 40, { align: "center" });
        
        // Decorative Divider
        doc.setLineWidth(0.5);
        doc.line(pageWidth / 2 - 15, 45, pageWidth / 2 + 15, 45);

        // Content
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.setLineHeightFactor(1.5);
        
        // Process content to handle bold markdown
        const paragraphs = chapter.content.split('\n\n');
        let y = 60;
        
        paragraphs.forEach(para => {
          // Remove markdown bold asterisks for PDF simplicity
          // (A full markdown parser would be complex for this scope)
          const cleanPara = para.replace(/\*\*/g, '');
          
          const lines = doc.splitTextToSize(cleanPara, textWidth);
          
          lines.forEach((line: string) => {
            if (y > pageHeight - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin, y);
            y += 6; // Line spacing
          });
          
          y += 4; // Paragraph spacing
        });
      });

      // Save
      doc.save("Stranger-Things-The-Right-Side-Up.pdf");
    } catch (error) {
      console.error("Failed to generate PDF", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Gradient / Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-st-black via-st-charcoal to-st-black opacity-80 z-0"></div>
      
      {/* Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-8">
        
        <div className="space-y-2 animate-fade-in-up">
          <p className="text-st-red font-display tracking-[0.3em] uppercase text-sm md:text-base">
            A Stranger Things Fan Novel
          </p>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl">
            THE RIGHT SIDE UP
          </h1>
          <div className="w-24 h-1 bg-st-red mx-auto rounded-full shadow-[0_0_15px_#ff0909]"></div>
        </div>

        <p className="text-lg md:text-xl text-gray-300 font-serif leading-relaxed max-w-2xl mx-auto italic opacity-90">
          "{story.description}"
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            to="/read"
            className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-st-red-dim hover:bg-st-red transition-all duration-300 rounded-sm shadow-[0_0_20px_rgba(179,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,9,9,0.6)]"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Read Full Story
          </Link>
          
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-st-red border border-st-red hover:bg-st-red hover:text-white transition-all duration-300 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            {isGenerating ? "Generating..." : "Download PDF"}
          </button>
          
          <Link
            to="/chapters"
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-gray-300 border border-gray-600 hover:border-white hover:text-white transition-all duration-300 rounded-sm hover:bg-white/5"
          >
            <span className="mr-2">Chapter Index</span>
          </Link>
        </div>

        <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-3xl mx-auto">
          <div className="p-6 border border-white/5 bg-white/5 rounded-lg hover:border-st-red/30 transition-colors">
            <h3 className="font-display text-xl mb-2 text-st-red">Closure</h3>
            <p className="text-sm text-gray-400 font-serif">The emotional ending Eleven, Mike, and Hopper deserved.</p>
          </div>
          <div className="p-6 border border-white/5 bg-white/5 rounded-lg hover:border-st-red/30 transition-colors">
            <h3 className="font-display text-xl mb-2 text-st-red">Healing</h3>
            <p className="text-sm text-gray-400 font-serif">A journey through trauma, recovery, and finding peace in Hawkins.</p>
          </div>
          <div className="p-6 border border-white/5 bg-white/5 rounded-lg hover:border-st-red/30 transition-colors">
            <h3 className="font-display text-xl mb-2 text-st-red">Future</h3>
            <p className="text-sm text-gray-400 font-serif">Life after the Upside Down. Growing up, moving on, and staying together.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
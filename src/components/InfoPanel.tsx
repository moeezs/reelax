'use client';

import { useState } from 'react';
import { X } from 'lucide-react';


export default function InfoPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('what');

  const tabs = [
    { id: 'what', label: 'What' },
    { id: 'how', label: 'How' },
    { id: 'why', label: 'Why' },
    { id: 'other', label: 'Other' },
  ];

  const content = {
    what: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">What is Reelax?</h3>
        <p className="text-white/80 leading-relaxed">
          Reelax is a personalized movie recommendation engine that helps you find the perfect film based on your mood, available time, and sleep schedule. No more endless scrolling through streaming platforms.
        </p>
        <p className="text-white/80 leading-relaxed">
          Simply tell us your preferred genre, when you want to sleep, and how long you want to watch. We'll find movies that fit perfectly into your evening routine.
        </p>
      </div>
    ),
    how: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">How it works</h3>
        <p className="text-white/80 leading-relaxed">
          Our system uses The Movie Database (TMDB) API to fetch high-quality movie data and recommendations. We filter results based on your preferences and calculate optimal viewing times.
        </p>
        <p className="text-white/80 leading-relaxed">
          Built with Next.js, TypeScript, and Tailwind CSS for a fast, responsive experience. Movie data is fetched server-side to ensure security and performance.
        </p>
      </div>
    ),
    why: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Why we built this</h3>
        <p className="text-white/80 leading-relaxed">
          Decision fatigue is real, especially after a long day. We wanted to create a tool that removes the stress of choosing what to watch and helps you stick to healthy sleep schedules.
        </p>
        <p className="text-white/80 leading-relaxed">
          By considering your sleep time and available viewing window, Reelax ensures you can enjoy a great movie without sacrificing rest.
        </p>
      </div>
    ),
    other: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">More info</h3>
        <p className="text-white/80 leading-relaxed">
          This project was built as a demonstration of modern web development practices, combining user experience design with practical functionality.
        </p>
        <p className="text-white/80 leading-relaxed">
          Data is sourced from TMDB and no personal information is stored. Share links contain only your preferences in the URL parameters.
        </p>
      </div>
    ),
  };

  return (
    <>
      <div className="absolute top-6 left-8 z-50 flex flex-col items-start text-left pointer-events-none select-none">
        <span className="text-white text-xl font-bold tracking-wide">Reelax</span>
        <span className="text-white/70 text-sm">scatter by moeez</span>
      </div>

      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-center group shadow-lg"
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <span className="text-white font-medium text-lg group-hover:scale-110 transition-transform">i</span>
      </button>

      {/* Glass Panel Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div 
            className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl overflow-hidden"
            style={{
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            {/* Header with tabs */}
            <div className="border-b border-white/20">
              <div className="flex items-center justify-between p-6 pb-0">
                <h2 className="text-2xl font-bold text-white">Info</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex px-6 pb-4 mt-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 mr-2 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    style={{
                      backdropFilter: activeTab === tab.id ? 'blur(10px)' : 'none',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-96">
              {content[activeTab as keyof typeof content]}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

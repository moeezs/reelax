'use client';

import { useState, useEffect, JSX } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';


type TabKey = 'what' | 'how' | 'why' | 'other';

export default function InfoPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('what');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const tabs = [
    { id: 'what', label: 'What' },
    { id: 'how', label: 'How' },
    { id: 'why', label: 'Why' },
    { id: 'other', label: 'Other' },
  ];

  const info: Record<TabKey, { title: string; body: (string | JSX.Element)[] }> = {
    what: {
      title: 'What is Reelax? 🎬',
      body: [
        'Reelax is a personalized movie recommendation engine built for the Scatter project where I create a fun new app every week! 🚀 (get it "movie reel" and "relax" = "reelax"...',
        "Simply tell us your preferred genre, when you want to sleep, and how long you want to watch. We'll find movies that fit perfectly into your evening routine, so you can relax without the stress of choosing!",
      ],
    },
    how: {
      title: 'How it works ⚡',
      body: [
        'Our system uses The Movie Database (TMDB) API to fetch high-quality movie data and smart recommendations. We filter results based on your preferences and calculate optimal viewing times that work with your sleep schedule.',
        'Built with Next.js, TypeScript, Framer Motion for smooth animations, and Tailwind CSS for a fast, responsive experience. All movie data is fetched securely to ensure privacy and performance.',
      ],
    },
    why: {
      title: 'Why I built this 💡',
      body: [
        'Part of the Scatter project where I ship creative apps weekly! Decision fatigue is real, especially after a long day. I wanted to create a tool that removes the stress of choosing what to watch and also lets you pick a movie without you getting late for bed.',
        'By considering your sleep time and available viewing window, Reelax ensures you can enjoy a great movie without sacrificing rest. Perfect for those "I just want to relax but can\'t decide what to watch" moments!',
      ],
    },
    other: {
      title: 'About Scatter 🌟',
      body: [
        'Scatter is our weekly app challenge where we build and ship fun, useful apps every single week. Each app tackles a different problem or explores new creative ideas!',
        'From productivity tools to entertainment apps to silly gags, I\'m always experimenting with new concepts. Follow my journey as I scatter creative solutions across the web, one app at a time!',
        <>
          Want to see what we build next? Check out our other Scatter apps and join the fun{' '}
          <Link
            href="https://scatter.moeezs.com"
            target="_blank"
            className="underline text-blue-300 hover:text-blue-200 transition-colors"
          >
            here
          </Link>
          ! 🎉
        </>,
      ],
    },
  };

  return (
    <motion.div 
      style={{ fontFamily: 'Menlo, monospace' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute top-6 left-8 z-50 flex flex-col items-start text-left select-none">
        <motion.span 
          className="text-white text-xl font-bold tracking-wide"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Reelax
        </motion.span>
        <motion.span 
          className="text-white/70 text-sm"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <span className="pointer-events-auto">
            <Link
              href="https://scatter.moeezs.com"
              target="_blank"
              className="underline text-white/70 text-sm hover:text-white/90 transition-colors"
            >
              scatter
            </Link>
          </span> by moeez
        </motion.span>
      </div>

      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-center group shadow-lg"
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <motion.span 
          className="text-white font-medium text-lg transition-transform"
          whileHover={{ scale: 1.1 }}
        >
          i
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div 
              className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl overflow-hidden"
              style={{
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              }}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
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
                    onClick={() => setActiveTab(tab.id as TabKey)}
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
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">{info[activeTab].title}</h3>
                {info[activeTab].body.map((item, idx) =>
                  typeof item === 'string' ? (
                    <p key={idx} className="text-white/80 leading-relaxed">{item}</p>
                  ) : (
                    <span key={idx}>{item}</span>
                  )
                )}
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

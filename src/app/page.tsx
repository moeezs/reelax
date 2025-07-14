'use client';

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Star, Moon, Share2, ArrowLeft, Edit3, Youtube, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import InfoPanel from "@/components/InfoPanel";
import Image from "next/image";

const FONT_FAMILY = "Menlo, Consolas, DejaVu Sans Mono, sans-serif";

interface Show {
  name: string;
  summary?: string;
  image?: { medium: string };
  runtime?: number;
  language?: string;
  release?: string;
  rating?: number;
  uniqueStyle?: React.CSSProperties;
}

const initialGenres = ["Action", "Comedy", "Drama", "Horror", "Romance", "Sci-Fi"];
const allGenres = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Science Fiction", "Sci-Fi", "Thriller", "Documentary"
];

function ReelaxApp() {
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [step, setStep] = useState(0);
  const [genre, setGenre] = useState("");
  const [sleepTime, setSleepTime] = useState("");
  const [duration, setDuration] = useState(90);
  const [recommendations, setRecommendations] = useState<Show[]>([]);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openMovieIdx, setOpenMovieIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const timeRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const genreParam = searchParams.get("genre");
    const sleepTimeParam = searchParams.get("sleepTime");
    const durationParam = searchParams.get("duration");
    if (genreParam && sleepTimeParam && durationParam) {
      setGenre(genreParam);
      setSleepTime(sleepTimeParam);
      setDuration(Number(durationParam));
      setStep(4);
      getMovieRecommendations({
        genre: genreParam,
        sleepTime: sleepTimeParam,
        duration: Number(durationParam),
      });
    }
  }, [searchParams]);

  const totalSteps = 4;

  // Function to get 6 random unique movies from array
  function getRandomMovies(movies: any[], count: number = 6) {
    const shuffled = [...movies].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async function fetchTMDBRecommendations({ genre, sleepTime, duration }: {
    genre: string;
    sleepTime: string;
    duration: number;
  }) {
    const params = new URLSearchParams();
    if (genre) params.append('genre', genre);
    if (duration) params.append('duration', String(duration));

    const url = `/api/getrecs?${params.toString()}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) {
        console.error('API error:', data);
        return [];
      }
      return data.results || [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }

  async function getMovieRecommendations(paramsOverride?: any) {
    setLoading(true);
    const params = paramsOverride || { genre, sleepTime, duration };
    
    // Only update URL if we have valid params and it's not just a refresh
    if (params.genre && params.sleepTime && params.duration && !isNaN(params.duration)) {
      const allMovies = await fetchTMDBRecommendations(params);
      
      // Get 6 random movies from the results
      const selectedMovies = getRandomMovies(allMovies, 6);
      
      const parsed = selectedMovies.map((movie: any) => ({
        name: movie.title || movie.original_title,
        summary: movie.overview,
        image: movie.poster_path ? { medium: `https://image.tmdb.org/t/p/w300${movie.poster_path}` } : undefined,
        runtime: movie.runtime,
        release: movie.release_date ? movie.release_date.slice(0, 4) : undefined,
        rating: movie.vote_average,
      }));
      
      setRecommendations(parsed);
      
      // Only update URL if this is the initial load or step navigation, not refresh
      if (!paramsOverride || (paramsOverride && !recommendations.length)) {
        const urlParams = new URLSearchParams({
          genre: params.genre,
          sleepTime: params.sleepTime,
          duration: String(params.duration),
        });
        router.replace(`?${urlParams.toString()}`);
      }
    }
    
    setLoading(false);
  }

  function getAvailableMinutes() {
    if (!sleepTime) return 120;
    const now = new Date();
    const [h, m] = sleepTime.split(":").map(Number);
    const sleep = new Date(now);
    sleep.setHours(h, m, 0, 0);
    let diff = (sleep.getTime() - now.getTime()) / 60000;
    if (diff < 0) diff += 24 * 60;
    return Math.max(30, Math.floor(diff));
  }

  function getBedtime(runtime?: number) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes + (runtime || 0);
    const sleepHour = Math.floor(totalMinutes / 60) % 24;
    const sleepMinute = totalMinutes % 60;
    return `${sleepHour.toString().padStart(2, "0")}:${sleepMinute.toString().padStart(2, "0")}`;
  }

  function getCurrentTimePlusOne() {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  }

  function handleTrailerClick(movieName: string) {
    const searchQuery = encodeURIComponent(`${movieName} official trailer`);
    window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
  }

  return (
    <div 
      className="min-h-screen transition-all duration-500 relative"
      style={{ 
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
        backgroundAttachment: "fixed",
        fontFamily: FONT_FAMILY,
        minHeight: "100vh",
      }}
    >
      {/* Scrollable content container */}
      <motion.div 
        className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="w-full flex justify-center mb-6">
          <InfoPanel />
        </div>
      <div className="absolute top-20 left-10 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl" />
      {step < totalSteps && (
        <div className="absolute top-6 right-8 z-40 flex justify-end items-center h-12">
          {[...Array(totalSteps)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full mx-1 transition-all duration-300 ${i <= step ? "bg-white shadow-lg" : "bg-white/30"}`}
            />
          ))}
        </div>
      )}

      {step === totalSteps && (
        <motion.div 
          className="absolute top-6 right-8 z-40 flex gap-4 items-center h-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <motion.button
            onClick={() => { setStep(0); router.push("/"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all duration-200 font-medium"
            style={{ position: 'relative', zIndex: 10 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Start Over</span>
          </motion.button>
          <motion.button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/70 text-white hover:bg-gray-700/80 transition-all duration-200 font-medium border border-white/10"
            style={{ position: 'relative', zIndex: 10 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 size={20} />
            <span className="hidden sm:inline">Share</span>
          </motion.button>
        </motion.div>
      )}
      {step === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-md mx-auto px-6"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">What type of movie?</h1>
            <p className="text-white/70 text-sm">Choose your preferred genre</p>
          </div>
          <motion.div 
            className="grid grid-cols-2 gap-3 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {(showAllGenres ? allGenres : initialGenres).map((g, index) => {
              // Calculate proper stagger delay for both columns
              const row = Math.floor(index / 2);
              const staggerDelay = row * 0.06;
              
              return (
                <motion.button
                  key={g}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: staggerDelay,
                    duration: 0.2,
                    ease: "easeOut"
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl font-medium transition-all duration-200 ${genre === g ? "bg-white text-gray-900 shadow-lg scale-105" : "bg-white/10 text-white border border-white/20 hover:bg-white/20"}`}
                  onClick={() => setGenre(g)}
                >
                  {g}
                </motion.button>
              );
            })}
          </motion.div>
          <AnimatePresence>
            {!showAllGenres && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center mb-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-white/50 text-xs underline font-normal lowercase tracking-wide bg-none border-none shadow-none focus:outline-none"
                  onClick={() => setShowAllGenres(true)}
                >
                  view more
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: genre ? 1.02 : 1 }}
            whileTap={{ scale: genre ? 0.98 : 1 }}
            className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${genre ? "bg-white text-gray-900 shadow-lg hover:shadow-xl" : "bg-white/20 text-white/50 cursor-not-allowed"}`}
            disabled={!genre}
            onClick={() => setStep(1)}
          >
            Next
          </motion.button>
        </motion.div>
      )}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-md mx-auto px-6"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">When do you want to sleep?</h1>
            <p className="text-white/70 text-sm">We'll find content that fits your schedule</p>
          </div>
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <motion.input
              ref={timeRef}
              type="time"
              value={sleepTime}
              onChange={e => setSleepTime(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white text-center text-xl font-mono"
              placeholder={getCurrentTimePlusOne()}
              whileFocus={{ scale: 1.02 }}
            />
            <AnimatePresence>
              {sleepTime && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 text-white/70 text-sm"
                >
                  Available time: {getAvailableMinutes()} minutes
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <motion.button
            whileHover={{ scale: sleepTime ? 1.02 : 1 }}
            whileTap={{ scale: sleepTime ? 0.98 : 1 }}
            className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${sleepTime ? "bg-white text-gray-900 shadow-lg hover:shadow-xl" : "bg-white/20 text-white/50 cursor-not-allowed"}`}
            disabled={!sleepTime}
            onClick={() => { setDuration(getAvailableMinutes()); setStep(2); }}
          >
            Next
          </motion.button>
        </motion.div>
      )}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-md mx-auto px-6"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">How long do you want to watch?</h1>
            <p className="text-white/70 text-sm">Based on your sleep time</p>
          </div>
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <motion.input
              type="range"
              min={30}
              max={getAvailableMinutes()}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              whileHover={{ scale: 1.01 }}
            />
            <motion.div 
              className="text-2xl font-bold text-white mt-4"
              key={duration}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {duration} minutes
            </motion.div>
            <motion.div 
              className="text-white/70 text-sm mt-2"
              key={getBedtime(duration)}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              You'll finish by {getBedtime(duration)}
            </motion.div>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3 rounded-xl font-medium bg-white text-gray-900 shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => setStep(3)}
          >
            Next
          </motion.button>
        </motion.div>
      )}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-md mx-auto px-6"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Review your preferences</h1>
            <p className="text-white/70 text-sm">Make sure everything looks right before we find your perfect movie</p>
          </div>
          <motion.div 
            className="bg-white/10 rounded-2xl p-6 mb-8 border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="space-y-4">
              <motion.div 
                className="flex justify-between items-center"
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-white/70">Genre:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{genre}</span>
                  <motion.button
                    onClick={() => setStep(0)}
                    className="p-1 rounded hover:bg-white/20 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Edit3 size={16} className="text-white/70" />
                  </motion.button>
                </div>
              </motion.div>
              <motion.div 
                className="flex justify-between items-center"
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-white/70">Sleep by:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{sleepTime}</span>
                  <motion.button
                    onClick={() => setStep(1)}
                    className="p-1 rounded hover:bg-white/20 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Edit3 size={16} className="text-white/70" />
                  </motion.button>
                </div>
              </motion.div>
              <motion.div 
                className="flex justify-between items-center"
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-white/70">Watch time:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{duration} minutes</span>
                  <motion.button
                    onClick={() => setStep(2)}
                    className="p-1 rounded hover:bg-white/20 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Edit3 size={16} className="text-white/70" />
                  </motion.button>
                </div>
              </motion.div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Finish by:</span>
                <span className="text-white font-medium">{getBedtime(duration)}</span>
              </div>
            </div>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3 rounded-xl font-medium bg-white text-gray-900 shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => { getMovieRecommendations(); setStep(4); }}
          >
            Find My Perfect Movie
          </motion.button>
        </motion.div>
      )}
      {step === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-6xl mx-auto px-6 py-8 pt-8"
        >
          <div className="text-center mb-8">
            <motion.h1 
              className="text-4xl font-bold text-white mt-15 mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Your perfect movies for tonight
            </motion.h1>
            <motion.p 
              className="text-white/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Perfect for your {duration} min watch time
            </motion.p>
            <motion.button
              onClick={() => getMovieRecommendations({ genre, sleepTime, duration })}
              className="mt-4 flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200 font-medium border border-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              disabled={loading}
            >
              <motion.div
                animate={loading ? { rotate: 360 } : { rotate: 0 }}
                transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
              >
                <RefreshCw size={18} />
              </motion.div>
              <span>{loading ? "Getting new movies..." : "Get New Movies"}</span>
            </motion.button>
          </div>
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div 
                className="flex justify-center items-center py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {!loading && recommendations.length > 0 && (
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {recommendations.map((rec, i) => (
                  <motion.div
                    key={`${rec.name}-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="group relative bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg p-6 flex flex-col min-h-[220px]"
                    onClick={() => setOpenMovieIdx(i)}
                  >
                    <button 
                      className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/30 text-white hover:bg-white/40 transition-all duration-200 shadow-lg z-10"
                      onClick={e => { e.stopPropagation(); handleTrailerClick(rec.name); }}
                      title="Watch Trailer"
                    >
                      <Youtube size={20} />
                    </button>
                    <div className="flex h-48">
                      {rec.image?.medium && (
                        <div className="flex-shrink-0 w-32 mr-6">
                          <Image 
                            src={rec.image.medium} 
                            alt={rec.name} 
                            width={128} height={192}
                            className="w-full h-full object-cover rounded-xl shadow-md"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">{rec.name}</h3>
                          {rec.release && (
                            <span className="text-white/60 text-sm">{rec.release}</span>
                          )}
                        </div>
                        <div className="space-y-2 mt-2">
                          {rec.rating && (
                            <div className="flex items-center gap-2">
                              <Star size={14} className="text-yellow-400" />
                              <span className="text-sm text-white">{rec.rating}/10</span>
                            </div>
                          )}
                          {rec.runtime && (
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-white" color="#fff" />
                              <span className="text-sm text-white">{rec.runtime} min</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Moon size={14} className="text-purple-400" />
                            <span className="text-sm text-white">Sleep by {getBedtime(rec.runtime)}</span>
                          </div>
                        </div>
                        {rec.summary && (
                          <p className="text-white/70 text-xs line-clamp-2 mt-4">
                            {rec.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {!loading && recommendations.length === 0 && (
              <motion.div 
                className="text-center py-20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-white/70 text-lg mb-4">No matches found</div>
                <motion.button
                  onClick={() => setStep(0)}
                  className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Try different preferences
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Custom Glass Dialog for Movie Info */}
      <AnimatePresence>
        {openMovieIdx !== null && recommendations[openMovieIdx] && (
          <>
            <style>{`body { overflow: hidden !important; }`}</style>
            <motion.div 
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#162032]/80 backdrop-blur-sm" 
              onClick={() => setOpenMovieIdx(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="relative w-full max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-[#1e293b]/80 via-[#334155]/80 to-[#0f172a]/80 border border-white/20 shadow-2xl flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
                style={{ maxHeight: '90vh' }}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                  {/* Desktop layout */}
                  <div className="hidden md:flex flex-row w-full justify-center items-start px-6 pt-8 pb-4 gap-8">
                    <div className="flex-shrink-0 flex items-center justify-center" style={{ height: '100%' }}>
                      {recommendations[openMovieIdx].image?.medium && (
                        <Image
                          src={recommendations[openMovieIdx].image.medium}
                          alt={recommendations[openMovieIdx].name}
                          width={180} height={270}
                          className="w-44 h-72 object-cover rounded-2xl shadow-xl border-4 border-white/20 mx-auto"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col items-start justify-start">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
                        <h2 className="text-3xl font-bold text-white mb-0">{recommendations[openMovieIdx].name}</h2>
                        {recommendations[openMovieIdx].release && (
                          <span className="text-white/60 text-lg">{recommendations[openMovieIdx].release}</span>
                        )}
                      </div>
                      <div className="flex flex-row gap-4 mt-4 mb-4">
                        {recommendations[openMovieIdx].rating && (
                          <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl bg-white/20 shadow min-w-[90px]">
                            <span className="text-white text-lg font-semibold">{Number(recommendations[openMovieIdx].rating).toFixed(1)}/10</span>
                            <span className="text-xs text-white/70 mt-1">Rating</span>
                          </div>
                        )}
                        {recommendations[openMovieIdx].runtime && (
                          <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl bg-white/20 shadow min-w-[90px]">
                            <span className="text-white text-lg font-semibold">{recommendations[openMovieIdx].runtime} min</span>
                            <span className="text-xs text-white/70 mt-1">Duration</span>
                          </div>
                        )}
                        <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl bg-white/20 shadow min-w-[90px]">
                          <span className="text-white text-lg font-semibold">{getBedtime(recommendations[openMovieIdx].runtime)}</span>
                          <span className="text-xs text-white/70 mt-1">Sleep by</span>
                        </div>
                      </div>
                      <button
                        className="mb-4 px-6 py-3 rounded-xl font-medium bg-white/30 text-white hover:bg-white/40 transition-all duration-200 shadow-lg border border-white/20 flex items-center justify-center gap-3 text-lg w-full max-w-xs"
                        onClick={() => handleTrailerClick(recommendations[openMovieIdx].name)}
                        title="Watch Trailer"
                      >
                        <Youtube size={24} /> <span>Watch Trailer</span>
                      </button>
                      {recommendations[openMovieIdx].summary && (
                        <>
                          <h3 className="font-semibold mb-2 text-lg text-white">Synopsis</h3>
                          <div className="max-h-56 overflow-y-auto pr-2 w-full">
                            <p className="text-white/80 leading-relaxed text-base">
                              {recommendations[openMovieIdx].summary}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="md:hidden w-full px-4 pb-4 flex flex-col items-center justify-start">
                    {/* Poster at top */}
                    {recommendations[openMovieIdx].image?.medium && (
                      <div className="w-full max-w-md mx-auto mt-6 flex">
                      <div className="flex items-center justify-center w-full mb-4">
                        <Image
                          src={recommendations[openMovieIdx].image.medium}
                          alt={recommendations[openMovieIdx].name}
                          width={160} height={240}
                          className="w-40 h-60 object-cover rounded-2xl shadow-xl border-4 border-white/20 mx-auto"
                          unoptimized
                        />
                      </div>
                      <div className="flex flex-col gap-3 w-full justify-start mb-4 my-auto">
                      {recommendations[openMovieIdx].rating && (
                        <div className="flex flex-col items-center justify-center px-3 py-2 rounded-xl bg-white/20 shadow min-w-[70px]">
                          <span className="text-white text-base font-semibold">{Number(recommendations[openMovieIdx].rating).toFixed(1)}/10</span>
                          <span className="text-xs text-white/70 mt-1">Rating</span>
                        </div>
                        
                      )}
                      {recommendations[openMovieIdx].runtime && (
                        <div className="flex flex-col items-center justify-center px-3 py-2 rounded-xl bg-white/20 shadow min-w-[70px]">
                          <span className="text-white text-base font-semibold">{recommendations[openMovieIdx].runtime} min</span>
                          <span className="text-xs text-white/70 mt-1">Duration</span>
                        </div>
                      )}
                      <div className="flex flex-col items-center justify-center px-3 py-2 rounded-xl bg-white/20 shadow min-w-[70px]">
                        <span className="text-white text-base font-semibold">{getBedtime(recommendations[openMovieIdx].runtime)}</span>
                        <span className="text-xs text-white/70 mt-1">Sleep by</span>
                      </div>
                    </div>
                    </ div>

                    )}
                    {/* Info boxes in a row */}
                    
                    {/* Title, year, trailer, synopsis */}
                    <h2 className="text-2xl font-bold text-white mt-2 mb-1 text-center">{recommendations[openMovieIdx].name}</h2>
                    {recommendations[openMovieIdx].release && (
                      <p className="text-white/60 mb-2 text-lg text-center">{recommendations[openMovieIdx].release}</p>
                    )}
                    <button
                      className="mt-2 mb-4 px-6 py-3 rounded-xl font-medium bg-white/30 text-white hover:bg-white/40 transition-all duration-200 shadow-lg border border-white/20 flex items-center justify-center gap-3 text-lg w-full max-w-md mx-auto"
                      onClick={() => handleTrailerClick(recommendations[openMovieIdx].name)}
                      title="Watch Trailer"
                    >
                      <Youtube size={24} /> <span>Watch Trailer</span>
                    </button>
                    {recommendations[openMovieIdx].summary && (
                      <>
                        <h3 className="font-semibold mb-2 text-lg text-white text-center">Synopsis</h3>
                        <div className="mt-2 max-h-56 overflow-y-auto pr-2 w-full max-w-2xl mx-auto">
                          <p className="text-white/80 leading-relaxed text-base">
                            {recommendations[openMovieIdx].summary}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    className="absolute top-6 right-6 text-white/70 hover:text-white text-2xl"
                    onClick={() => setOpenMovieIdx(null)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </motion.div>
              </motion.div>
            </>
          )}
      </AnimatePresence>
      {/* Custom Glass Dialog for Share */}
      <AnimatePresence>
        {showShare && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="relative w-full max-w-lg mx-auto rounded-3xl bg-gradient-to-br from-[#1e293b]/80 via-[#334155]/80 to-[#0f172a]/80 border border-white/20 shadow-2xl p-10 flex flex-col items-center" 
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <h2 className="text-2xl font-bold text-white mb-2">Share your picks</h2>
              <p className="text-gray-300 mb-4">Send this link to share your recommendations.</p>
              <div className="bg-gray-800/60 p-3 rounded-lg font-mono text-sm text-blue-200 break-all w-full mb-4">
                {typeof window !== "undefined" ? window.location.href : ""}
              </div>
              <motion.button
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 ${copied ? "bg-green-500 text-white" : "bg-white/30 text-white hover:bg-white/40"}`}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {copied ? "Copied!" : "Copy link"}
              </motion.button>
              <motion.button
                className="absolute top-6 right-6 text-white/70 hover:text-white text-2xl"
                onClick={() => { setShowShare(false); setCopied(false); }}
                aria-label="Close"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </motion.div>
      )}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: none; } 
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (max-width: 480px) {
          .startover-btn, .share-btn {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
            min-width: 0;
          }
          .btn-text {
            display: none;
          }
        }
      `}</style>
      </motion.div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <ReelaxApp />
    </Suspense>
  );
}

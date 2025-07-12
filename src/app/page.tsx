'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Star, Moon, Share2, ArrowLeft, Edit3, Youtube } from "lucide-react";
import InfoPanel from "@/components/InfoPanel";
import Image from "next/image";

const CLAUDE_FONT = "Fira Code, Fira Mono, Menlo, Consolas, DejaVu Sans Mono, sans-serif";

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

const genres = ["Action", "Comedy", "Drama", "Horror", "Romance", "Sci-Fi"];

export default function ReelaxApp() {
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
    const shows = await fetchTMDBRecommendations(params);
    const parsed = await Promise.all(shows.map(async (movie: any) => {
      let runtime = movie.runtime;
      let fullDescription = movie.overview;
      if ((!runtime || !fullDescription) && movie.id) {
        try {
          const detailsRes = await fetch(`/api/getrecs/details?id=${movie.id}`);
          const details = await detailsRes.json();
          runtime = details.runtime;
          fullDescription = details.overview;
        } catch {}
      }
      return {
        name: movie.title || movie.original_title,
        summary: fullDescription,
        image: movie.poster_path ? { medium: `https://image.tmdb.org/t/p/w300${movie.poster_path}` } : undefined,
        runtime: runtime || undefined,
        release: movie.release_date ? movie.release_date.slice(0, 4) : undefined,
        rating: movie.vote_average,
      };
    }));
    setRecommendations(parsed);
    setLoading(false);
    const urlParams = new URLSearchParams({
      genre: params.genre,
      sleepTime: params.sleepTime,
      duration: String(params.duration),
    });
    router.replace(`?${urlParams.toString()}`);
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
      className="min-h-screen flex flex-col items-center justify-center transition-all duration-500 relative overflow-hidden"
      style={{ 
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
        fontFamily: CLAUDE_FONT 
      }}
    >
      <div className="w-full flex justify-center mb-6">
        <InfoPanel />
      </div>
      <div className="absolute top-20 left-10 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl" />
      {/* Branding */}
      <div className="absolute top-6 left-8 z-50 flex flex-col items-start text-left pointer-events-none select-none">
        <span className="text-white text-xl font-bold tracking-wide">Reelax</span>
        <span className="text-white/70 text-sm">scatter by moeez</span>
      </div>
      {/* Step Counter - only show before final step */}
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
      {step === 0 && (
        <div className="text-center max-w-md mx-auto px-6 animate-fade-in">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">What type of movie?</h1>
            <p className="text-white/70 text-sm">Choose your preferred genre</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {genres.map((g) => (
              <button
                key={g}
                className={`p-4 rounded-xl font-medium transition-all duration-200 ${genre === g ? "bg-white text-gray-900 shadow-lg scale-105" : "bg-white/10 text-white border border-white/20 hover:bg-white/20"}`}
                onClick={() => setGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
          <button
            className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${genre ? "bg-white text-gray-900 shadow-lg hover:shadow-xl" : "bg-white/20 text-white/50 cursor-not-allowed"}`}
            disabled={!genre}
            onClick={() => setStep(1)}
          >
            Next
          </button>
        </div>
      )}
      {step === 1 && (
        <div className="text-center max-w-md mx-auto px-6 animate-fade-in">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">When do you want to sleep?</h1>
            <p className="text-white/70 text-sm">We'll find content that fits your schedule</p>
          </div>
          <div className="mb-8">
            <input
              ref={timeRef}
              type="time"
              value={sleepTime}
              onChange={e => setSleepTime(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white text-center text-xl font-mono"
              placeholder={getCurrentTimePlusOne()}
            />
            {sleepTime && (
              <div className="mt-4 text-white/70 text-sm">
                Available time: {getAvailableMinutes()} minutes
              </div>
            )}
          </div>
          <button
            className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${sleepTime ? "bg-white text-gray-900 shadow-lg hover:shadow-xl" : "bg-white/20 text-white/50 cursor-not-allowed"}`}
            disabled={!sleepTime}
            onClick={() => { setDuration(getAvailableMinutes()); setStep(2); }}
          >
            Next
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="text-center max-w-md mx-auto px-6 animate-fade-in">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">How long do you want to watch?</h1>
            <p className="text-white/70 text-sm">Based on your sleep time</p>
          </div>
          <div className="mb-8">
            <input
              type="range"
              min={30}
              max={getAvailableMinutes()}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-2xl font-bold text-white mt-4">{duration} minutes</div>
            <div className="text-white/70 text-sm mt-2">
              You'll finish by {getBedtime(duration)}
            </div>
          </div>
          <button
            className="px-8 py-3 rounded-xl font-medium bg-white text-gray-900 shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => setStep(3)}
          >
            Next
          </button>
        </div>
      )}
      {step === 3 && (
        <div className="text-center max-w-md mx-auto px-6 animate-fade-in">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Review your preferences</h1>
            <p className="text-white/70 text-sm">Make sure everything looks right before we find your perfect movie</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 mb-8 border border-white/20">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Genre:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{genre}</span>
                  <button
                    onClick={() => setStep(0)}
                    className="p-1 rounded hover:bg-white/20 transition-colors"
                  >
                    <Edit3 size={16} className="text-white/70" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Sleep by:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{sleepTime}</span>
                  <button
                    onClick={() => setStep(1)}
                    className="p-1 rounded hover:bg-white/20 transition-colors"
                  >
                    <Edit3 size={16} className="text-white/70" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Watch time:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{duration} minutes</span>
                  <button
                    onClick={() => setStep(2)}
                    className="p-1 rounded hover:bg-white/20 transition-colors"
                  >
                    <Edit3 size={16} className="text-white/70" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Finish by:</span>
                <span className="text-white font-medium">{getBedtime(duration)}</span>
              </div>
            </div>
          </div>
          <button
            className="px-8 py-3 rounded-xl font-medium bg-white text-gray-900 shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => { getMovieRecommendations(); setStep(4); }}
          >
            Find My Perfect Movie
          </button>
        </div>
      )}
      {step === 4 && (
        <div className="w-full max-w-6xl mx-auto px-6 py-8 animate-fade-in pt-8">
          <div className="flex justify-between items-center mb-8 relative" style={{ minHeight: '48px' }}>
            <div className="flex gap-4">
              <button
                onClick={() => { setStep(0); router.push("/"); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all duration-200 font-medium"
                style={{ position: 'relative', zIndex: 10 }}
              >
                <ArrowLeft size={20} />
                Start Over
              </button>
              <button
                onClick={() => setShowShare(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/70 text-white hover:bg-gray-700/80 transition-all duration-200 font-medium border border-white/10"
                style={{ position: 'relative', zIndex: 10 }}
              >
                <Share2 size={20} />
                Share
              </button>
            </div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Your perfect movies for tonight</h1>
            <p className="text-white/70">Perfect for your {duration}min watch time</p>
          </div>
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
          {!loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {recommendations.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <div className="text-white/70 text-lg mb-4">No matches found</div>
                  <button
                    onClick={() => setStep(0)}
                    className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
                  >
                    Try different preferences
                  </button>
                </div>
              ) : (
                recommendations.map((rec, i) => (
                  <div
                    key={i}
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
                              <Clock size={14} className="text-blue-400" />
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
                  </div>
                ))
              )}
            </div>
          )}
          {/* Custom Glass Dialog for Movie Info */}
          {openMovieIdx !== null && recommendations[openMovieIdx] && (
            <>
              <style>{`body { overflow: hidden !important; }`}</style>
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#162032]/80 backdrop-blur-sm" onClick={() => setOpenMovieIdx(null)}>
                <div className="relative w-full max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-[#1e293b]/80 via-[#334155]/80 to-[#0f172a]/80 border border-white/20 shadow-2xl flex flex-row overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="flex-shrink-0 w-[400px] flex items-center justify-center p-8">
                    {recommendations[openMovieIdx].image?.medium && (
                      <Image 
                        src={recommendations[openMovieIdx].image.medium} 
                        alt={recommendations[openMovieIdx].name} 
                        width={320} height={480}
                        className="w-80 h-[480px] object-cover rounded-2xl shadow-xl border-4 border-white/20 mx-auto"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="flex-1 p-10 flex flex-col justify-center min-w-0">
                    <h2 className="text-4xl font-bold text-white mb-2">{recommendations[openMovieIdx].name}</h2>
                    {recommendations[openMovieIdx].release && (
                      <p className="text-white/60 mb-2 text-lg">{recommendations[openMovieIdx].release}</p>
                    )}
                    <div className="flex gap-6 mb-6">
                      <div className="flex gap-4">
                        {recommendations[openMovieIdx].rating && (
                          <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl bg-white/20 shadow">
                            <span className="text-white text-2xl font-semibold">{recommendations[openMovieIdx].rating}/10</span>
                            <span className="text-xs text-white/70 mt-1">Rating</span>
                          </div>
                        )}
                        {recommendations[openMovieIdx].runtime && (
                          <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl bg-white/20 shadow">
                            <span className="text-white text-2xl font-semibold">{recommendations[openMovieIdx].runtime} min</span>
                            <span className="text-xs text-white/70 mt-1">Runtime</span>
                          </div>
                        )}
                        <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl bg-white/20 shadow">
                          <span className="text-white text-2xl font-semibold">{getBedtime(recommendations[openMovieIdx].runtime)}</span>
                          <span className="text-xs text-white/70 mt-1">Sleep by</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="mt-2 mb-6 px-6 py-3 rounded-xl font-medium bg-white/30 text-white hover:bg-white/40 transition-all duration-200 shadow-lg border border-white/20 flex items-center justify-center gap-3 text-lg"
                      onClick={() => handleTrailerClick(recommendations[openMovieIdx].name)}
                      title="Watch Trailer"
                    >
                      <Youtube size={24} /> <span>Watch Trailer</span>
                    </button>
                    {recommendations[openMovieIdx].summary && (
                      <div className="mt-2 max-h-56 overflow-y-auto pr-2">
                        <h3 className="font-semibold mb-2 text-lg text-white">Synopsis</h3>
                        <p className="text-white/80 leading-relaxed text-base">
                          {recommendations[openMovieIdx].summary}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    className="absolute top-6 right-6 text-white/70 hover:text-white text-2xl"
                    onClick={() => setOpenMovieIdx(null)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
            </>
          )}
          {/* Custom Glass Dialog for Share */}
          {showShare && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="relative w-full max-w-lg mx-auto rounded-3xl bg-gradient-to-br from-[#1e293b]/80 via-[#334155]/80 to-[#0f172a]/80 border border-white/20 shadow-2xl p-10 flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-2">Share your picks</h2>
                <p className="text-gray-300 mb-4">Send this link to share your recommendations.</p>
                <div className="bg-gray-800/60 p-3 rounded-lg font-mono text-sm text-blue-200 break-all w-full mb-4">
                  {typeof window !== "undefined" ? window.location.href : ""}
                </div>
                <button
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 ${copied ? "bg-green-500 text-white" : "bg-white/30 text-white hover:bg-white/40"}`}
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(window.location.href);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1200);
                    }
                  }}
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
                <button
                  className="absolute top-6 right-6 text-white/70 hover:text-white text-2xl"
                  onClick={() => { setShowShare(false); setCopied(false); }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
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
      `}</style>
    </div>
  );
}

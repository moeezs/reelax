'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link2 } from "lucide-react";

const CLAUDE_FONT = "Fira Code, Fira Mono, Menlo, Consolas, DejaVu Sans Mono, sans-serif";

function getBgGradient() {
  const hour = new Date().getHours();
  if (hour >= 20 || hour < 6)
    return "linear-gradient(135deg, #18181b 60%, #23272f 100%)"; // night
  if (hour >= 6 && hour < 12)
    return "linear-gradient(135deg, #e0f2fe 60%, #bae6fd 100%)"; // morning
  if (hour >= 12 && hour < 18)
    return "linear-gradient(135deg, #f1f5f9 60%, #dbeafe 100%)"; // afternoon
  return "linear-gradient(135deg, #a7f3d0 60%, #f0fdfa 100%)"; // evening
}

// TMDB API key (replace with your own key)
const TMDB_API_KEY = "0c15caf4eb7e10a30c9b242aabb13b71";

// Helper to map mood to TMDB genre IDs
const moodGenreMap: Record<string, number[]> = {
  Chill: [35, 10749], // Comedy, Romance
  Excited: [28, 12], // Action, Adventure
  Thoughtful: [18, 99], // Drama, Documentary
  Funny: [35], // Comedy
  Spooky: [27, 53], // Horror, Thriller
  Romantic: [10749], // Romance
};

// TVMaze show type
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
const moods = ["Chill", "Excited", "Thoughtful", "Funny", "Spooky", "Romantic"];
const languages = ["Any", "English", "Spanish", "French", "German", "Japanese"];

export default function ReelaxApp() {
  const [step, setStep] = useState(0);
  const [bg, setBg] = useState(getBgGradient());
  const [genre, setGenre] = useState("");
  const [sleepTime, setSleepTime] = useState("");
  const [duration, setDuration] = useState(90);
  const [mood, setMood] = useState("");
  const [language, setLanguage] = useState("Any");
  const [popularity, setPopularity] = useState("Popular");
  const [type, setType] = useState("Movie");
  const [actor, setActor] = useState("");
  const [recommendations, setRecommendations] = useState<Show[]>([]);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openMovieIdx, setOpenMovieIdx] = useState<number | null>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const interval = setInterval(() => setBg(getBgGradient()), 60000);
    return () => clearInterval(interval);
  }, []);

  // On mount, check for params and auto-run recommendations
  useEffect(() => {
    const genreParam = searchParams.get("genre");
    const moodParam = searchParams.get("mood");
    const typeParam = searchParams.get("type");
    const durationParam = searchParams.get("duration");
    const popularityParam = searchParams.get("popularity");
    const languageParam = searchParams.get("language");
    if (genreParam && moodParam && typeParam && durationParam && popularityParam && languageParam) {
      setGenre(genreParam);
      setMood(moodParam);
      setType(typeParam);
      setDuration(Number(durationParam));
      setPopularity(popularityParam);
      setLanguage(languageParam);
      setStep(8);
      getMovieRecommendations({
        genre: genreParam,
        mood: moodParam,
        type: typeParam,
        duration: Number(durationParam),
        popularity: popularityParam,
        language: languageParam,
      });
    }
  }, []);

  const totalSteps = 8;

  async function fetchTMDBRecommendations({ genre, mood, type, duration, popularity, language }: {
    genre: string;
    mood: string;
    type: string;
    duration: number;
    popularity: string;
    language: string;
  }) {
    // Map genre and mood to TMDB genre IDs
    let genreIds: number[] = [];
    if (genre) {
      // Example: Action = 28, Comedy = 35, etc. (TMDB genre IDs)
      const genreMap: Record<string, number> = {
        Action: 28,
        Comedy: 35,
        Drama: 18,
        Horror: 27,
        Romance: 10749,
        "Sci-Fi": 878,
      };
      if (genreMap[genre]) genreIds.push(genreMap[genre]);
    }
    if (mood && moodGenreMap[mood]) {
      genreIds = [...new Set([...genreIds, ...moodGenreMap[mood]])];
    }

    // Build TMDB discover API URL
    let url = `https://api.themoviedb.org/3/discover/${type === "Series" ? "tv" : "movie"}?api_key=${TMDB_API_KEY}`;
    if (genreIds.length) url += `&with_genres=${genreIds.join(",")}`;
    if (language !== "Any") url += `&with_original_language=${language.slice(0,2).toLowerCase()}`;
    if (duration) url += `&with_runtime.lte=${duration}`;
    if (popularity === "Popular") url += `&sort_by=popularity.desc`;
    if (popularity === "Hidden Gem") url += `&sort_by=vote_average.asc`;

    const res = await fetch(url);
    const data = await res.json();
    return data.results.slice(0, 3);
  }

  async function getMovieRecommendations(paramsOverride?: any) {
    const params = paramsOverride || { genre, mood, type, duration, popularity, language };
    const shows = await fetchTMDBRecommendations(params);
    // Fetch runtime and full description for each movie if missing
    const parsed = await Promise.all(shows.map(async (movie: any) => {
      let runtime = movie.runtime;
      let fullDescription = movie.overview;
      if ((!runtime || !fullDescription) && movie.id) {
        try {
          const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}`);
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
    // Update URL for sharing
    const urlParams = new URLSearchParams({
      genre: params.genre,
      mood: params.mood,
      type: params.type,
      duration: String(params.duration),
      popularity: params.popularity,
      language: params.language,
    });
    router.replace(`?${urlParams.toString()}`);
  }

  function quirkySummary(movie: any, idx: number) {
    // Quirky, sleep-focused summary, unique per card
    const year = movie.release_date ? movie.release_date.slice(0, 4) : "";
    let base = movie.overview ? movie.overview.split(".")[0] : "No summary available.";
    if (base.length > 80) base = base.slice(0, 77) + "...";
    const quirks = [
      "Dreamy pick for your night!",
      "Sleepy vibes, big fun.",
      "Perfect for a cozy snooze.",
      "Watch, relax, snooze!",
      "A quirky dream before bed.",
      "Your sleep spirit film!",
    ];
    return `${movie.title} (${year}): ${base} ${quirks[idx % quirks.length]}`;
  }

  function uniqueCardStyle(idx: number) {
    // Unique style per card
    const colors = ["#bae6fd", "#a7f3d0", "#f0fdfa", "#f1f5f9", "#dbeafe", "#f9fafb"];
    return {
      background: `linear-gradient(135deg, ${colors[idx % colors.length]} 60%, #18181b 100%)`,
      border: `2px solid ${colors[(idx+1) % colors.length]}`,
      boxShadow: `0 8px 32px ${colors[idx % colors.length]}44`,
    };
  }

  // Calculate available watch time
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

  // Helper to get bedtime string
  function getBedtime(runtime?: number) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes + (runtime || 0);
    const sleepHour = Math.floor(totalMinutes / 60) % 24;
    const sleepMinute = totalMinutes % 60;
    // Format as HH:MM
    return `${sleepHour.toString().padStart(2, "0")}:${sleepMinute.toString().padStart(2, "0")}`;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        fontFamily: CLAUDE_FONT,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.5s",
        position: "relative",
      }}
    >
      {/* Progress bar */}
      <div style={{ position: "absolute", top: 24, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        {[...Array(totalSteps)].map((_, i) => (
          <span
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: i <= step ? "#18181b" : "#e5e7eb",
              margin: "0 4px",
              transition: "background 0.3s",
              display: "inline-block",
            }}
          />
        ))}
      </div>
      {/* Step 1: Genre */}
      {step === 0 && (
        <div style={{ textAlign: "center", maxWidth: 320, animation: "fadeIn 0.5s" }}>
          <h1 style={{ fontWeight: 600, fontSize: 24, marginBottom: 24 }}>What type of movie?</h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {genres.map((g) => (
              <button
                key={g}
                style={{
                  background: genre === g ? "#18181b" : "#fff",
                  color: genre === g ? "#fff" : "#18181b",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 16,
                  cursor: "pointer",
                  fontFamily: CLAUDE_FONT,
                  boxShadow: genre === g ? "0 2px 8px #18181b22" : "none",
                  transition: "all 0.2s",
                }}
                onClick={() => setGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
          <button
            style={{
              marginTop: 32,
              background: "#18181b",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontSize: 16,
              fontFamily: CLAUDE_FONT,
              cursor: genre ? "pointer" : "not-allowed",
              opacity: genre ? 1 : 0.5,
              boxShadow: genre ? "0 2px 8px #18181b22" : "none",
            }}
            disabled={!genre}
            onClick={() => setStep(1)}
          >
            Next
          </button>
        </div>
      )}
      {/* Step 2: Sleep time */}
      {step === 1 && (
        <div style={{ textAlign: "center", maxWidth: 320, animation: "fadeIn 0.5s" }}>
          <h1 style={{ fontWeight: 600, fontSize: 24, marginBottom: 24 }}>When do you want to sleep by?</h1>
          <input
            ref={timeRef}
            type="time"
            value={sleepTime}
            onChange={e => setSleepTime(e.target.value)}
            style={{
              fontSize: 18,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontFamily: CLAUDE_FONT,
              marginBottom: 24,
              background: "#fff",
              color: "#18181b",
              boxShadow: "0 2px 8px #18181b11",
            }}
          />
          <button
            style={{
              background: "#18181b",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontSize: 16,
              fontFamily: CLAUDE_FONT,
              cursor: sleepTime ? "pointer" : "not-allowed",
              opacity: sleepTime ? 1 : 0.5,
              boxShadow: sleepTime ? "0 2px 8px #18181b22" : "none",
            }}
            disabled={!sleepTime}
            onClick={() => { setDuration(getAvailableMinutes()); setStep(2); }}
          >
            Next
          </button>
        </div>
      )}
      {/* Step 3: Duration */}
      {step === 2 && (
        <div style={{ textAlign: "center", maxWidth: 320, animation: "fadeIn 0.5s" }}>
          <h1 style={{ fontWeight: 600, fontSize: 24, marginBottom: 24 }}>How long do you want to watch?</h1>
          <input
            type="range"
            min={30}
            max={getAvailableMinutes()}
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            style={{ width: "100%", marginBottom: 16 }}
          />
          <div style={{ fontSize: 16, marginBottom: 24 }}>{duration} min</div>
          <button
            style={{
              background: "#18181b",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontSize: 16,
              fontFamily: CLAUDE_FONT,
              cursor: "pointer",
              boxShadow: "0 2px 8px #18181b22",
            }}
            onClick={() => setStep(3)}
          >
            Next
          </button>
        </div>
      )}
      {/* Step 4: Mood */}
      {step === 3 && (
        <div style={{ textAlign: "center", maxWidth: 320, animation: "fadeIn 0.5s" }}>
          <h1 style={{ fontWeight: 600, fontSize: 24, marginBottom: 24 }}>What's your mood?</h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {moods.map((m) => (
              <button
                key={m}
                style={{
                  background: mood === m ? "#18181b" : "#fff",
                  color: mood === m ? "#fff" : "#18181b",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 16,
                  cursor: "pointer",
                  fontFamily: CLAUDE_FONT,
                  boxShadow: mood === m ? "0 2px 8px #18181b22" : "none",
                  transition: "all 0.2s",
                }}
                onClick={() => setMood(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            style={{
              marginTop: 32,
              background: "#18181b",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontSize: 16,
              fontFamily: CLAUDE_FONT,
              cursor: mood ? "pointer" : "not-allowed",
              opacity: mood ? 1 : 0.5,
              boxShadow: mood ? "0 2px 8px #18181b22" : "none",
            }}
            disabled={!mood}
            onClick={() => setStep(4)}
          >
            Next
          </button>
        </div>
      )}
      {/* Step 5: Language */}
      {step === 4 && (
        <div style={{ textAlign: "center", maxWidth: 320, animation: "fadeIn 0.5s" }}>
          <h1 style={{ fontWeight: 600, fontSize: 24, marginBottom: 24 }}>Language preference?</h1>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            style={{
              fontSize: 16,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontFamily: CLAUDE_FONT,
              marginBottom: 24,
              background: "#fff",
              color: "#18181b",
              boxShadow: "0 2px 8px #18181b11",
            }}
          >
            {languages.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <button
            style={{
              background: "#18181b",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontSize: 16,
              fontFamily: CLAUDE_FONT,
              cursor: "pointer",
              boxShadow: "0 2px 8px #18181b22",
            }}
            onClick={() => setStep(5)}
          >
            Next
          </button>
        </div>
      )}
      {/* Step 6: Popularity */}
      {step === 5 && (
        <div style={{ textAlign: "center", maxWidth: 320, animation: "fadeIn 0.5s" }}>
          <h1 style={{ fontWeight: 600, fontSize: 24, marginBottom: 24 }}>Popular or hidden gem?</h1>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {["Popular", "Hidden Gem"].map((p) => (
              <button
                key={p}
                style={{
                  background: popularity === p ? "#18181b" : "#fff",
                  color: popularity === p ? "#fff" : "#18181b",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 16,
                  cursor: "pointer",
                  fontFamily: CLAUDE_FONT,
                  boxShadow: popularity === p ? "0 2px 8px #18181b22" : "none",
                  transition: "all 0.2s",
                }}
                onClick={() => setPopularity(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            style={{
              marginTop: 32,
              background: "#18181b",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontSize: 16,
              fontFamily: CLAUDE_FONT,
              cursor: popularity ? "pointer" : "not-allowed",
              opacity: popularity ? 1 : 0.5,
              boxShadow: popularity ? "0 2px 8px #18181b22" : "none",
            }}
            disabled={!popularity}
            onClick={() => setStep(6)}
          >
            Next
          </button>
        </div>
      )}
      {/* Step 7: Type */}
      {step === 6 && (
        <div style={{ textAlign: "center", maxWidth: 320, animation: "fadeIn 0.5s" }}>
          <h1 style={{ fontWeight: 600, fontSize: 24, marginBottom: 24 }}>Series or movie?</h1>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {["Movie", "Series"].map((t) => (
              <button
                key={t}
                style={{
                  background: type === t ? "#18181b" : "#fff",
                  color: type === t ? "#fff" : "#18181b",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 16,
                  cursor: "pointer",
                  fontFamily: CLAUDE_FONT,
                  boxShadow: type === t ? "0 2px 8px #18181b22" : "none",
                  transition: "all 0.2s",
                }}
                onClick={() => setType(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            style={{
              marginTop: 32,
              background: "#18181b",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontSize: 16,
              fontFamily: CLAUDE_FONT,
              cursor: type ? "pointer" : "not-allowed",
              opacity: type ? 1 : 0.5,
              boxShadow: type ? "0 2px 8px #18181b22" : "none",
            }}
            disabled={!type}
            onClick={() => setStep(7)}
          >
            Next
          </button>
        </div>
      )}
      {/* Step 8: Actor/Director */}
      {step === 7 && (
        <div style={{ textAlign: "center", maxWidth: 320, animation: "fadeIn 0.5s" }}>
          <h1 style={{ fontWeight: 600, fontSize: 24, marginBottom: 24 }}>Any actor or director?</h1>
          <input
            type="text"
            value={actor}
            onChange={e => setActor(e.target.value)}
            placeholder="Optional"
            style={{
              fontSize: 16,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontFamily: CLAUDE_FONT,
              marginBottom: 24,
              background: "#fff",
              color: "#18181b",
              boxShadow: "0 2px 8px #18181b11",
            }}
          />
          <button
            style={{
              background: "#18181b",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontSize: 16,
              fontFamily: CLAUDE_FONT,
              cursor: "pointer",
              boxShadow: "0 2px 8px #18181b22",
            }}
            onClick={() => { getMovieRecommendations(); setStep(8); }}
          >
            See Recommendations
          </button>
        </div>
      )}
      {/* Step 9: Recommendations */}
      {step === 8 && (
        <div style={{ textAlign: "center", maxWidth: 600, animation: "fadeIn 0.5s", margin: "0 auto", position: "relative" }}>
          {/* Share icon at top right of screen */}
          <div style={{ position: "fixed", top: 24, right: 32, zIndex: 100 }}>
            <button
              aria-label="Share"
              style={{
                background: "#18181b",
                border: "none",
                borderRadius: 8,
                padding: 8,
                cursor: "pointer",
                boxShadow: "0 2px 8px #18181b22",
                display: "flex",
                alignItems: "center"
              }}
              onClick={() => setShowShare(true)}
            >
              <Link2 size={22} color="#bae6fd" />
            </button>
          </div>
          {/* Share dialog using shadcn/ui */}
          <Dialog open={showShare} onOpenChange={v => { setShowShare(v); setCopied(false); }}>
            <DialogContent style={{ background: "#18181b", color: "#bae6fd", border: "2px solid #23272f" }}>
              <DialogHeader>
                <DialogTitle style={{ color: "#bae6fd" }}>Share your picks</DialogTitle>
                <DialogDescription style={{ color: "#e0e0e0" }}>Send this link to share your recommendations.</DialogDescription>
              </DialogHeader>
              <div style={{ background: "#23272f", padding: "10px 16px", borderRadius: 8, fontFamily: "Fira Mono, monospace", fontSize: 15, marginBottom: 18, wordBreak: "break-all", color: "#bae6fd" }}>
                {typeof window !== "undefined" ? window.location.href : ""}
              </div>
              <button
                style={{ background: copied ? "#bae6fd" : "#23272f", color: copied ? "#18181b" : "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 15, fontFamily: "Fira Mono, monospace", cursor: "pointer", boxShadow: "0 2px 8px #18181b22", marginBottom: 8 }}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  }
                }}
              >{copied ? "Copied!" : "Copy link"}</button>
            </DialogContent>
          </Dialog>
          {/* Movie details dialog */}
          <Dialog open={openMovieIdx !== null} onOpenChange={v => setOpenMovieIdx(v ? openMovieIdx : null)}>
            <DialogContent style={{ background: "#18181b", color: "#bae6fd", border: "2px solid #23272f", padding: 0 }}>
              {openMovieIdx !== null && recommendations[openMovieIdx] && (
                <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
                  {recommendations[openMovieIdx].image?.medium && (
                    <img src={recommendations[openMovieIdx].image.medium} alt={recommendations[openMovieIdx].name} style={{ width: 120, borderRadius: 16, marginBottom: 18, boxShadow: "0 2px 8px #18181b22" }} />
                  )}
                  <div style={{ textAlign: "center", width: "100%" }}>
                    <div style={{ fontWeight: 700, fontSize: 22, color: "#bae6fd", marginBottom: 4 }}>{recommendations[openMovieIdx].name}</div>
                    <div style={{ fontSize: 16, color: "#e0e0e0", marginBottom: 12 }}>{recommendations[openMovieIdx].release}</div>
                  </div>
                  <div style={{ display: "flex", gap: 18, justifyContent: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 15, color: "#bae6fd" }}>TMDB Rating: {recommendations[openMovieIdx].rating}/10</div>
                    <div style={{ fontSize: 15, color: "#bae6fd" }}>⏰ Runtime: {recommendations[openMovieIdx].runtime ? `${recommendations[openMovieIdx].runtime} min` : "N/A"}</div>
                    <div style={{ fontSize: 15, color: "#bae6fd" }}>🛏️ Sleep by: {getBedtime(recommendations[openMovieIdx].runtime)}</div>
                  </div>
                  <div style={{ color: "#e0e0e0", fontSize: 16, marginTop: 8, textAlign: "left", maxWidth: 400, lineHeight: 1.6 }}>
                    {/* Show full description, not quirky summary */}
                    {recommendations[openMovieIdx].summary && typeof recommendations[openMovieIdx].summary === "string"
                      ? recommendations[openMovieIdx].summary.split(": ")[1] || recommendations[openMovieIdx].summary
                      : "No description available."}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <h1 style={{ fontWeight: 600, fontSize: 24, marginBottom: 24 }}>Your picks for tonight</h1>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32, justifyContent: "center", paddingBottom: 24 }}>
            {recommendations.length === 0 && <div style={{ color: "#fff", textAlign: "center", gridColumn: "1 / -1" }}>No matches found. Try changing your answers!</div>}
            {recommendations.map((rec, i) => (
              <div key={i} style={{
                minWidth: 220,
                maxWidth: 300,
                borderRadius: 24,
                padding: 24,
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                position: "relative",
                overflow: "hidden",
                backdropFilter: "blur(8px)",
                background: "#18181b",
                border: "2px solid #23272f",
                boxShadow: "0 8px 32px #18181b44",
                cursor: "pointer"
              }}
              onClick={() => setOpenMovieIdx(i)}
              >
                {rec.image?.medium && (
                  <img src={rec.image.medium} alt={rec.name} style={{ width: 88, borderRadius: 16, boxShadow: "0 2px 8px #18181b22", zIndex: 1 }} />
                )}
                <div style={{ zIndex: 1, width: "100%" }}>
                  <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6, color: "#bae6fd" }}>{rec.name} <span style={{ color: "#e0e0e0", fontSize: 14 }}>({rec.release})</span></div>
                  <div style={{ fontSize: 15, color: "#bae6fd", marginBottom: 8 }}>TMDB Rating: {rec.rating}/10</div>
                  <div style={{ fontSize: 15, color: "#bae6fd", marginBottom: 8 }}>⏰ Runtime: {rec.runtime ? `${rec.runtime} min` : "N/A"}</div>
                  <div style={{ fontSize: 15, color: "#bae6fd", marginBottom: 8 }}>🛏️ Sleep by: {getBedtime(rec.runtime)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Minimal fadeIn animation */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .bg-accent {
          position: absolute;
          border-radius: 50%;
          filter: blur(32px);
          opacity: 0.5;
          pointer-events: none;
          z-index: 0;
        }
      `}</style>
      <div className="bg-accent" style={{ top: 80, left: 40, width: 180, height: 180, background: "radial-gradient(circle, #bae6fd 0%, transparent 80%)" }} />
      <div className="bg-accent" style={{ bottom: 40, right: 60, width: 120, height: 120, background: "radial-gradient(circle, #a7f3d0 0%, transparent 80%)" }} />
    </div>
  );
}

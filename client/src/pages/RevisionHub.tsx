import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Upload, Play, Pause, MessageSquare,
  Mic, MicOff, Send, CheckCircle2,
  XCircle, HelpCircle, BookOpen, Headphones, Brain, Loader2,
  ArrowRight, Volume2, Globe, Sparkles, RefreshCw, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}
type AnswerState = "unanswered" | "correct" | "wrong";
type Tab = "podcast" | "quiz";
type VoiceEngine = "neural" | "browser";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ar", label: "Arabic" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "hi", label: "Hindi" },
  { code: "ur", label: "Urdu" },
  { code: "pl", label: "Polish" },
  { code: "tr", label: "Turkish" },
  { code: "ru", label: "Russian" },
];

// Neural AI voices — powered by OpenAI TTS (tts-1-hd) with Azure Neural TTS fallback
// Voice IDs are mapped server-side to OpenAI voice names (nova, shimmer, alloy, echo, fable, onyx)
const NEURAL_VOICES = [
  { id: "nova",    label: "Aoede — Warm Female",        desc: "Natural, engaging — best for most content" },
  { id: "shimmer", label: "Leda — Soft Female",          desc: "Gentle, clear — great for science topics" },
  { id: "alloy",   label: "Kore — Confident Female",     desc: "Authoritative, precise — ideal for essays" },
  { id: "echo",    label: "Charon — Natural Male",       desc: "Warm, conversational — perfect for history" },
  { id: "fable",   label: "Fenrir — Expressive Male",    desc: "Dynamic, engaging — great for literature" },
  { id: "onyx",    label: "Orus — Deep Male",            desc: "Rich, authoritative — ideal for science" },
];

const YEAR_GROUPS = [
  { value: "year1",  label: "Year 1 (age 5–6)" },
  { value: "year2",  label: "Year 2 (age 6–7)" },
  { value: "year3",  label: "Year 3 (age 7–8)" },
  { value: "year4",  label: "Year 4 (age 8–9)" },
  { value: "year5",  label: "Year 5 (age 9–10)" },
  { value: "year6",  label: "Year 6 (age 10–11)" },
  { value: "year7",  label: "Year 7 (age 11–12)" },
  { value: "year8",  label: "Year 8 (age 12–13)" },
  { value: "year9",  label: "Year 9 (age 13–14)" },
  { value: "year10", label: "Year 10 (age 14–15)" },
  { value: "year11", label: "Year 11 (age 15–16)" },
  { value: "year12", label: "Year 12 / AS Level (age 16–17)" },
  { value: "year13", label: "Year 13 / A Level (age 17–18)" },
];

function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem("send_token");
  return token ? { Authorization: `Bearer ${token}`, ...extra } : extra;
}

async function apiPost(path: string, body: Record<string, any>) {
  const res = await fetch(`/api/revision${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ── Loading fun facts — wacky, random, always different, child-friendly ─────
const NEURAL_FUN_FACTS = [
  "🐙 Octopuses have three hearts, blue blood, and can open jars — basically underwater superheroes.",
  "🍕 The word 'pizza' appeared in a document over 1,000 years ago. Ancient Romans were onto something.",
  "🦷 Snails have up to 25,000 teeth — and they're on their tongue. Sleep well.",
  "🌍 If you dug a hole straight through the Earth from the UK, you'd come out near New Zealand.",
  "🐘 Elephants are the only animals that can't jump. They also hold grudges. Choose your enemies wisely.",
  "🍯 Honey never goes off. Archaeologists found 3,000-year-old honey in Egyptian tombs. Still edible.",
  "🦈 Sharks are older than trees. They've been here for 450 million years. Trees showed up 350 million years ago.",
  "🧠 Your brain generates enough electricity to power a small lightbulb. You are literally bright.",
  "🌙 The Moon is moving away from Earth at about 3.8cm per year. Rude.",
  "🐝 A single bee makes only 1/12th of a teaspoon of honey in its entire lifetime. Respect the bees.",
  "🦩 Flamingos are white. They turn pink from the shrimp they eat. You are what you eat.",
  "🎵 The dot over a lowercase 'i' has a name — it's called a tittle. Tell your friends.",
  "🦴 Your nose and ears never stop growing your entire life. Science is terrifying.",
  "🐧 Penguins propose to their mates with pebbles. More romantic than most humans, honestly.",
  "🌊 The Pacific Ocean is wider than the Moon. Let that sink in.",
  "🍌 Bananas are technically berries. Strawberries are not. The world is a lie.",
  "🐴 Horses can sleep standing up but need to lie down to dream. Relatable.",
  "🔥 Hot water can freeze faster than cold water — it's called the Mpemba effect and scientists still argue about why.",
  "🌵 A cactus spine is actually a modified leaf. The green bit is the stem. Plants are deceptive.",
  "🦋 Butterflies taste with their feet. They land on something and instantly know if it's food.",
  "🐠 Clownfish can change sex. If the female dies, the dominant male becomes female. Nemo would have become Nemo's mum.",
  "🌟 There are more stars in the universe than grains of sand on all Earth's beaches. Show-off.",
  "🦥 Sloths move so slowly that algae grows on their fur. They're tiny walking ecosystems.",
  "🧊 A day on Venus is longer than a year on Venus. And it spins backwards. Venus does not follow rules.",
  "🐍 Some snakes can fly — they flatten their bodies and glide between trees. Just in case you needed more reasons to be nervous.",
  "🎮 The creator of the GIF confirmed it's pronounced 'JIF'. The internet has collectively refused to accept this.",
  "🦁 A lion's roar can be heard 8 kilometres away. Your teacher's voice, however, can feel even further.",
  "🍎 Apple seeds contain cyanide. You'd need to eat around 200 ground-up seeds to feel ill. Still, maybe don't.",
  "🐬 Dolphins have names for each other — unique whistles other dolphins use to call them. Basically phone contacts.",
  "🦜 Parrots don't just mimic — African Grey parrots can reason at the level of a 5-year-old child.",
  "🧲 If the Earth's magnetic field disappeared, we wouldn't die instantly — but within a few years solar wind would strip the atmosphere.",
  "🐊 Crocodiles haven't changed much in 200 million years. If it ain't broke, don't fix it.",
  "🌈 A rainbow is actually a full circle — you only see a semicircle because the ground gets in the way.",
  "🦓 Every zebra's stripe pattern is unique, like a fingerprint. Wildlife photographers use this to identify individuals.",
  "🍫 White chocolate isn't technically chocolate — it contains no cocoa solids, just cocoa butter, milk, and sugar.",
  "🧬 You share about 50% of your DNA with a banana. Next time someone calls you bananas, take it as a compliment.",
  "🐋 Blue whales have a heartbeat slow enough to hear from 3 metres away. Each heartbeat pumps 220 litres of blood.",
  "🎸 The electric guitar was invented in 1932. Rock and roll was technically inevitable.",
  "🌍 Oxford University is older than the Aztec Empire. Teaching started there around 1096 AD.",
  "🕷 Spiders can't fly — but they can travel thousands of miles by floating on silk threads. Goodbye.",
  "🐣 A group of flamingos is called a flamboyance. A group of crows is called a murder. Nature has opinions.",
  "🌿 Grass screams (chemically) when you cut it. That smell of fresh-cut grass is a distress signal.",
  "🧪 The human body contains enough carbon to make about 9,000 pencils. You're basically a walking art supply.",
  "🪐 Saturn's rings are only about 10 metres thick on average, despite being hundreds of thousands of kilometres wide.",
  "🐟 Goldfish have a memory of at least 3 months. The '3-second memory' thing is completely made up.",
  "🧊 A single cloud can weigh over 500,000 kg. They just happen to be spread over a huge area, so they float.",
  "🦔 Hedgehogs are lactose intolerant. Please stop leaving milk out for them.",
  "🌺 The smell of freshly printed books comes from a chemical called lignin — it breaks down into vanillin as paper ages.",
  "🐢 Some turtles can breathe through their backsides. Technically it's called cloacal bursae. You're welcome.",
  "🎲 The word 'checkmate' in chess comes from the Persian 'Shah Mat' — meaning 'the king is dead'.",
  "🦦 Sea otters hold hands while sleeping so they don't drift apart. This is called a raft. You can smile.",
  "🌙 There are more possible iterations of a game of chess than there are atoms in the observable universe.",
  "🐸 A group of frogs is called an army. A group of toads is called a knot. Amphibians know how to organise.",
  "🍊 Orange the colour was named after orange the fruit. Before that, English speakers called it 'geoluhread' (yellow-red).",
  "🦆 Ducks have regional accents. London ducks are louder and more harsh-sounding than rural ducks. City life.",
  "🔭 The Voyager 1 spacecraft, launched in 1977, is now over 24 billion km from Earth — the furthest human-made object ever.",
  "🧲 Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.",
  "🍦 The first ice lolly was invented accidentally in 1905 by an 11-year-old who left a fruit drink outside overnight.",
  "🌊 More people have been to space than have been to the deepest part of the ocean, the Mariana Trench.",
  "🐼 Giant pandas have a pseudo-thumb — a modified wrist bone that acts like a thumb. Evolution improvises.",
  "🎭 Shakespeare invented over 1,700 words we still use today, including 'bedroom', 'lonely', and 'swagger'.",
  "🦩 Wombat poo is cube-shaped. Scientists recently figured out why — it's the intestinal walls. Nature is weird.",
  "🧊 When hot water freezes faster than cold water it is called the Mpemba effect. Physicists still argue about exactly why it happens.",
  "🌻 Sunflowers are actually thousands of tiny flowers packed together. What looks like one flower is up to 2,000 individual florets.",
  "🎲 The dots on opposite sides of a dice always add up to seven. This holds for every standard die ever made.",
  "🦭 Sea lions can clap in rhythm to a beat. They are among the very few non-human animals that genuinely process tempo, not just mimic.",
  "🧲 If you cut a magnet in half you get two smaller magnets, each with its own north and south pole. You cannot isolate one magnetic pole.",
  "🌡️ The surface of the Sun is about 5,500°C. Its outer corona is over 1,000,000°C. Scientists are still not entirely sure why.",
  "🐊 Crocodiles cannot stick out their tongues. A membrane holds it permanently flat. Possibly why they look so grumpy.",
  "🍋 Lemons float in water. Limes sink. They are closely related but that tiny density difference has confused people for centuries.",
  "🔢 0.999... recurring forever is mathematically exactly equal to 1. This is not an approximation. It is provably, rigorously true.",
  "🦀 Crabs can regrow lost limbs. They wait for their next moult and a new claw simply grows back. Inconvenient for their enemies.",
  "🌊 The Atlantic Ocean is widening by about 2.5 cm every year as the tectonic plates beneath it slowly drift apart.",
  "🦋 A butterfly's eye can contain up to six types of photoreceptor. Humans have three. Butterflies can see colours we literally cannot imagine.",
  "🧪 Gallium melts at 29.76°C — just above room temperature. You can melt it in your hand. It is also non-toxic, unlike mercury.",
  "🐬 Dolphins sleep with one eye open. Only half their brain sleeps at a time so they keep swimming and stay alert for predators.",
  "🏔️ Mount Everest is not the furthest point from the Earth's centre. That is Mount Chimborazo in Ecuador, because the Earth bulges at the equator.",
  "🦠 There are roughly 38 trillion bacterial cells in your body and about 30 trillion human cells. You are technically a collaboration.",
  "🎸 Jimi Hendrix, Eric Clapton, and Keith Richards all used the same guitar shop on Denmark Street, London in the 1960s.",
  "📡 Wi-Fi signals travel at the speed of light. The slow part of your internet connection is almost never the Wi-Fi itself.",
  "🐙 When an octopus swims, the heart that pumps blood to its body actually stops beating. That is why octopuses prefer crawling to swimming.",
];

// Keep a shuffled queue so facts never repeat until the full list is exhausted
let _factQueue: number[] = [];
function pickRandomFact(excludeIndex: number): number {
  if (_factQueue.length === 0) {
    // Refill and shuffle
    _factQueue = Array.from({ length: NEURAL_FUN_FACTS.length }, (_, i) => i)
      .filter(i => i !== excludeIndex)
      .sort(() => Math.random() - 0.5);
  }
  return _factQueue.pop()!;
}

export default function RevisionHub() {
  const [tab, setTab] = useState<Tab>("podcast");
  const [uploading, setUploading] = useState(false);
  const [documentText, setDocumentText] = useState("");
  const [podcastScript, setPodcastScript] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [interrupted, setInterrupted] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [funFactIndex, setFunFactIndex] = useState(() => Math.floor(Math.random() * NEURAL_FUN_FACTS.length));

  // Voice / TTS state — declared BEFORE the useEffect that references audioLoading
  const [yearGroup, setYearGroup] = useState("year10");
  const [voiceEngine, setVoiceEngine] = useState<VoiceEngine>("neural");
  const [neuralVoice, setNeuralVoice] = useState("nova");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Rotate to a new random fact every 7s during loading — never repeats until full list exhausted
  useEffect(() => {
    if (!uploading && !audioLoading) return;
    const interval = setInterval(() => {
      setFunFactIndex(prev => pickRandomFact(prev));
    }, 18000);
    return () => clearInterval(interval);
  }, [uploading, audioLoading]);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load browser voices (for when user explicitly selects browser engine)
  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis?.getVoices() || [];
      setBrowserVoices(all);
      if (!selectedBrowserVoice && all.length > 0) {
        const pick =
          all.find(v => /natural|enhanced|premium/i.test(v.name) && v.lang.startsWith("en")) ||
          all.find(v => v.lang.startsWith("en")) ||
          all[0];
        if (pick) setSelectedBrowserVoice(pick.name);
      }
    };
    load();
    window.speechSynthesis?.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", load);
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    return () => { if (audioUrl) URL.revokeObjectURL(audioUrl); };
  }, [audioUrl]);

  // ── Neural TTS via server ────────────────────────────────────────────────────
  const generateNeuralAudio = async (
    script: string,
    voice: string = neuralVoice,
    lang: string = selectedLanguage
  ) => {
    if (!script) return;

    // Stop any current playback
    window.speechSynthesis?.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    setAudioUrl(null);
    setIsPlaying(false);
    setAudioError(null);
    setAudioLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 150000); // 150s timeout for long scripts

    try {
      const token = localStorage.getItem("send_token");
      const res = await fetch("/api/revision/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({ text: script, voice, language: lang }),
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("audio")) {
          const blob = await res.blob();
          if (blob.size > 1000) {
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            toast.success("Neural podcast ready — press Play!");
          } else {
            throw new Error("Audio response was too small. Please try again.");
          }
        } else {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Server returned a non-audio response.");
        }
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Neural voice server error (${res.status}). Please try again.`);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err?.name === "AbortError";
      const msg = isAbort
        ? "Neural voice timed out — the script may be too long. Try a shorter document."
        : (err?.message || "Neural voice generation failed. Please try again.");
      console.error("[TTS] Neural TTS failed:", err);
      setAudioError(msg);
      toast.error(msg, { duration: 6000 });
      // DO NOT auto-switch to browser voice — user must choose explicitly
    } finally {
      setAudioLoading(false);
    }
  };

  // ── Browser TTS ──────────────────────────────────────────────────────────────
  const startBrowserSpeech = (rate = speechRate) => {
    if (!podcastScript) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(podcastScript);
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.name === selectedBrowserVoice);
    if (v) { utt.voice = v; utt.lang = v.lang; }
    else utt.lang = "en-GB";
    utt.rate = rate;
    utt.pitch = 1.0;
    utt.volume = 1;
    utt.onend = () => setIsPlaying(false);
    utt.onerror = () => setIsPlaying(false);
    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
    setIsPlaying(true);
  };

  // ── Unified generate audio (called after upload or re-generate) ──────────────
  const generateAudio = async (
    script: string,
    engine: VoiceEngine = voiceEngine,
    voice: string = neuralVoice,
    lang: string = selectedLanguage
  ) => {
    if (engine === "neural") {
      await generateNeuralAudio(script, voice, lang);
    } else {
      // Browser engine — no server call, just confirm ready
      window.speechSynthesis?.cancel();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      setAudioUrl(null);
      setIsPlaying(false);
      setAudioError(null);
      toast.info("Browser voice ready — press Play to listen.");
    }
  };

  // ── Playback controls ────────────────────────────────────────────────────────
  const togglePlay = () => {
    if (!podcastScript) return;
    if (voiceEngine === "neural" && audioUrl && audioRef.current) {
      const audio = audioRef.current;
      if (isPlaying) { audio.pause(); setIsPlaying(false); }
      else { audio.play().catch(e => console.error("Audio play error:", e)); setIsPlaying(true); }
    } else if (voiceEngine === "browser") {
      if (isPlaying) { window.speechSynthesis.pause(); setIsPlaying(false); }
      else if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); setIsPlaying(true); }
      else startBrowserSpeech();
    }
  };

  const handleInterrupt = () => {
    if (isPlaying) {
      if (voiceEngine === "neural" && audioRef.current) audioRef.current.pause();
      else window.speechSynthesis.pause();
      setIsPlaying(false);
    }
    setInterrupted(true);
    setAnswer("");
  };

  const resumePodcast = () => {
    setInterrupted(false);
    setQuestion("");
    setAnswer("");
    if (voiceEngine === "neural" && audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    } else if (voiceEngine === "browser" && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  };

  const changeRate = (rate: number) => {
    setSpeechRate(rate);
    if (voiceEngine === "neural" && audioRef.current) {
      audioRef.current.playbackRate = rate;
    } else if (voiceEngine === "browser") {
      const wasPlaying = isPlaying;
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      if (wasPlaying) setTimeout(() => startBrowserSpeech(rate), 100);
    }
  };

  // ── Upload handler ───────────────────────────────────────────────────────────
  const handleUpload = async (file: File) => {
    setUploading(true);
    setDocumentText("");
    setPodcastScript("");
    setAudioUrl(null);
    setAudioError(null);
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setQuestions([]);
    setCurrentQIndex(0);
    setScore({ correct: 0, total: 0 });

    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("language", selectedLanguage);
      formData.append("yearGroup", yearGroup);
      const res = await fetch("/api/revision/upload", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }

      const { jobId } = await res.json();
      if (!jobId) throw new Error("No job ID returned");

      toast.info("Extracting text from document...", { id: "revision-progress", duration: 120000 });

      let finalData: { text: string; script: string } | null = null;
      const token = localStorage.getItem("send_token");
      for (let attempt = 0; attempt < 90; attempt++) {
        await new Promise(r => setTimeout(r, 2000));
        const pollRes = await fetch(`/api/revision/job/${jobId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });
        if (!pollRes.ok) throw new Error("Job polling failed");
        const poll = await pollRes.json();
        if (poll.status === "pending") {
          toast.info(poll.progress || "Processing...", { id: "revision-progress", duration: 120000 });
          continue;
        }
        if (poll.status === "error") throw new Error(poll.error || "Processing failed");
        if (poll.status === "done") { finalData = poll; break; }
      }
      toast.dismiss("revision-progress");

      if (!finalData?.script) throw new Error("Processing timed out. Please try again.");
      setDocumentText(finalData.text || "");
      setPodcastScript(finalData.script);
      await generateAudio(finalData.script, voiceEngine, neuralVoice, selectedLanguage);
    } catch (err: any) {
      toast.dismiss("revision-progress");
      toast.error(err.message || "Failed to process document");
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  // ── Q&A / Quiz ───────────────────────────────────────────────────────────────
  const askQuestion = async () => {
    if (!question.trim() || !documentText) return;
    setAskingQuestion(true);
    setAnswer("");
    try {
      const data = await apiPost("/ask", { question, documentText });
      setAnswer(data.answer || "");
    } catch (err: any) {
      toast.error(err.message || "Failed to get answer");
    } finally {
      setAskingQuestion(false);
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error("Voice input not supported in this browser"); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => { setQuestion(e.results[0][0].transcript); setIsListening(false); };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const loadQuiz = async (append = false) => {
    if (!documentText) return;
    if (append) setLoadingMore(true); else setLoadingQuiz(true);
    try {
      const data = await apiPost("/quiz", { documentText, count: 5, existingQuestions: questions });
      if (append) {
        setQuestions(prev => [...prev, ...(data.questions || [])]);
      } else {
        setQuestions(data.questions || []);
        setCurrentQIndex(0);
        setSelectedOption(null);
        setAnswerState("unanswered");
        setScore({ correct: 0, total: 0 });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate quiz");
    } finally {
      setLoadingQuiz(false);
      setLoadingMore(false);
    }
  };

  const selectOption = (idx: number) => {
    if (answerState !== "unanswered") return;
    setSelectedOption(idx);
    const q = questions[currentQIndex];
    const isCorrect = idx === q.correct;
    setAnswerState(isCorrect ? "correct" : "wrong");
    setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
  };

  const nextQuestion = () => {
    const nextIdx = currentQIndex + 1;
    if (nextIdx >= questions.length - 2 && !loadingMore) loadQuiz(true);
    if (nextIdx < questions.length) {
      setCurrentQIndex(nextIdx);
      setSelectedOption(null);
      setAnswerState("unanswered");
    }
  };

  const currentQ = questions[currentQIndex];

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!documentText && !uploading && !audioLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="px-6 py-8 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Revision Hub</h1>
              <p className="text-sm text-muted-foreground">Upload any document — get a podcast, quiz, and AI tutor</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Headphones, label: "Neural Podcast", desc: "Natural human-like AI voice" },
                { icon: MessageSquare, label: "Interrupt & Ask", desc: "Ask questions mid-podcast" },
                { icon: Brain, label: "Smart Quiz", desc: "Unlimited interactive questions" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-muted/40 rounded-xl p-3 text-center space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center mx-auto">
                    <Icon className="w-4 h-4 text-brand" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{desc}</p>
                </div>
              ))}
            </div>

            {/* Year Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> Year Group
              </label>
              <select
                value={yearGroup}
                onChange={e => setYearGroup(e.target.value)}
                className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
              >
                {YEAR_GROUPS.map(yg => (
                  <option key={yg.value} value={yg.value}>{yg.label}</option>
                ))}
              </select>
            </div>

            {/* Language + Voice Engine */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={e => setSelectedLanguage(e.target.value)}
                  className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Voice Engine
                </label>
                <select
                  value={voiceEngine}
                  onChange={e => setVoiceEngine(e.target.value as VoiceEngine)}
                  className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
                >
                  <option value="neural">Neural AI Voice (Human)</option>
                  <option value="browser">Browser Voice (built-in)</option>
                </select>
              </div>
            </div>

            {/* Neural voice picker */}
            {voiceEngine === "neural" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" /> Neural Voice
                </label>
                <select
                  value={neuralVoice}
                  onChange={e => setNeuralVoice(e.target.value)}
                  className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
                >
                  {NEURAL_VOICES.map(v => (
                    <option key={v.id} value={v.id}>{v.label} — {v.desc}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Browser voice picker */}
            {voiceEngine === "browser" && browserVoices.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" /> Browser Voice
                </label>
                <select
                  value={selectedBrowserVoice}
                  onChange={e => setSelectedBrowserVoice(e.target.value)}
                  className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
                >
                  {browserVoices.map(v => (
                    <option key={v.name} value={v.name}>
                      {v.name.replace(/Microsoft |Google /, "").replace(/ \(.*\)/, "")} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Upload area */}
            <div
              className="border-2 border-dashed border-brand/30 rounded-2xl p-8 text-center space-y-4 cursor-pointer hover:border-brand/60 hover:bg-brand/5 transition-all"
              onClick={() => fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
            >
              <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto">
                <Upload className="w-7 h-7 text-brand" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Drop your notes here</p>
                <p className="text-sm text-muted-foreground mt-1">PDF, Word (.docx), or plain text — up to 10MB</p>
              </div>
              <Button className="bg-brand hover:bg-brand/90 text-white gap-2">
                <Upload className="w-4 h-4" /> Choose File
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.docx,text/plain,application/pdf"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────
  if (uploading || audioLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-4">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
          </div>
          <p className="font-semibold text-foreground">
            {uploading ? "Processing your document..." : "Generating neural audio..."}
          </p>
          <p className="text-sm text-muted-foreground">
            {uploading
              ? "Extracting text and writing your revision podcast script"
              : "Creating your natural-sounding podcast. Long scripts may take up to 90 seconds."}
          </p>
          {/* Rotating fun fact */}
          <div className="mt-4 rounded-xl border border-brand/20 bg-brand/5 p-3 text-left">
            <p className="text-[10px] font-semibold text-brand uppercase tracking-wide mb-1">🧠 Did you know?</p>
            <p className="text-xs text-muted-foreground leading-relaxed transition-all duration-500">
              {NEURAL_FUN_FACTS[funFactIndex]}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          style={{ display: "none" }}
        />
      )}

      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
            <Headphones className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Revision Hub</h1>
            <p className="text-xs text-muted-foreground">
              {voiceEngine === "neural"
                ? `Neural AI — ${NEURAL_VOICES.find(v => v.id === neuralVoice)?.label ?? neuralVoice}`
                : `Browser voice — ${selectedBrowserVoice || "built-in"}`}
              {" · "}{LANGUAGES.find(l => l.code === selectedLanguage)?.label ?? "English"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => {
            window.speechSynthesis?.cancel();
            if (audioRef.current) audioRef.current.pause();
            setDocumentText("");
            setPodcastScript("");
            setAudioUrl(null);
            setAudioError(null);
            setIsPlaying(false);
          }}
        >
          <Upload className="w-3.5 h-3.5" /> New document
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {(["podcast", "quiz"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors capitalize",
              tab === t ? "text-brand border-b-2 border-brand" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "podcast" ? "Podcast" : "Quiz"}
          </button>
        ))}
      </div>

      {/* Podcast tab */}
      {tab === "podcast" && (
        <div className="flex-1 flex flex-col p-6 gap-4 max-w-2xl mx-auto w-full">
          <div className="bg-gradient-to-br from-brand/10 to-brand/5 rounded-2xl p-6 space-y-5">

            {/* Voice info + waveform */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center flex-shrink-0">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Your Revision Podcast</p>
                <p className="text-xs text-muted-foreground">
                  {voiceEngine === "neural"
                    ? `Neural AI — ${NEURAL_VOICES.find(v => v.id === neuralVoice)?.label ?? neuralVoice}`
                    : `Browser — ${selectedBrowserVoice || "built-in"}`}
                </p>
              </div>
              {isPlaying && (
                <div className="flex gap-0.5 items-end h-5">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="w-1 bg-brand rounded-full animate-pulse"
                      style={{ height: `${[60, 100, 80, 40][i - 1]}%`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Error state */}
            {audioError && voiceEngine === "neural" && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Neural voice failed</p>
                  <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">{audioError}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0 gap-1.5 text-xs border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => generateNeuralAudio(podcastScript, neuralVoice, selectedLanguage)}
                  disabled={audioLoading}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </Button>
              </div>
            )}

            {/* Play button */}
            <div className="flex items-center justify-center gap-4">
              <Button
                size="icon"
                onClick={togglePlay}
                disabled={voiceEngine === "neural" && !audioUrl && !audioError}
                className="w-16 h-16 rounded-full bg-brand hover:bg-brand/90 text-white shadow-lg disabled:opacity-40"
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
              </Button>
            </div>

            {/* Speed controls */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mr-1">Speed:</span>
              {[0.75, 1, 1.25, 1.5, 2].map(r => (
                <button
                  key={r}
                  onClick={() => changeRate(r)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                    speechRate === r ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {r}x
                </button>
              ))}
            </div>

            {/* Voice / Language controls */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={e => setSelectedLanguage(e.target.value)}
                  className="w-full text-xs bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Voice Engine
                </label>
                <select
                  value={voiceEngine}
                  onChange={e => setVoiceEngine(e.target.value as VoiceEngine)}
                  className="w-full text-xs bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground"
                >
                  <option value="neural">Neural AI Voice (Human)</option>
                  <option value="browser">Browser Voice (built-in)</option>
                </select>
              </div>
            </div>

            {/* Neural voice selector */}
            {voiceEngine === "neural" && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Volume2 className="w-3 h-3" /> Neural Voice
                </label>
                <select
                  value={neuralVoice}
                  onChange={e => setNeuralVoice(e.target.value)}
                  className="w-full text-xs bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground"
                >
                  {NEURAL_VOICES.map(v => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Browser voice selector */}
            {voiceEngine === "browser" && browserVoices.length > 1 && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Volume2 className="w-3 h-3" /> Browser Voice
                </label>
                <select
                  value={selectedBrowserVoice}
                  onChange={e => {
                    setSelectedBrowserVoice(e.target.value);
                    if (isPlaying) {
                      window.speechSynthesis.cancel();
                      setIsPlaying(false);
                      setTimeout(() => startBrowserSpeech(speechRate), 100);
                    }
                  }}
                  className="w-full text-xs bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground"
                >
                  {browserVoices.map(v => (
                    <option key={v.name} value={v.name}>
                      {v.name.replace(/Microsoft |Google /, "").replace(/ \(.*\)/, "")} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Re-generate button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              disabled={audioLoading}
              onClick={() => generateAudio(podcastScript, voiceEngine, neuralVoice, selectedLanguage)}
            >
              {audioLoading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating audio...</>
                : <><RefreshCw className="w-3.5 h-3.5" /> Re-generate audio</>}
            </Button>

            {/* Interrupt button */}
            {!interrupted && (
              <Button
                variant="outline"
                className="w-full gap-2 border-brand/30 text-brand hover:bg-brand/10"
                onClick={handleInterrupt}
              >
                <MessageSquare className="w-4 h-4" />
                Interrupt and Ask a Question
              </Button>
            )}
          </div>

          {/* Q&A panel */}
          {interrupted && (
            <div className="bg-background border rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand" /> Ask a Question
                </p>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={resumePodcast}>
                  <Play className="w-3.5 h-3.5" /> Resume
                </Button>
              </div>
              <div className="flex gap-2">
                <input
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && askQuestion()}
                  placeholder="Ask anything about the document..."
                  className="flex-1 text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={toggleVoice}
                  className={cn("flex-shrink-0", isListening && "bg-red-50 border-red-300 text-red-500")}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  size="icon"
                  className="bg-brand hover:bg-brand/90 text-white flex-shrink-0"
                  onClick={askQuestion}
                  disabled={askingQuestion || !question.trim()}
                >
                  {askingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              {answer && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-1">
                  <p className="text-xs font-medium text-brand flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Answer
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{answer}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quiz tab */}
      {tab === "quiz" && (
        <div className="flex-1 flex flex-col p-6 gap-4 max-w-2xl mx-auto w-full">
          {loadingQuiz ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3 max-w-sm">
                <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Generating quiz questions...</p>
                <div className="rounded-xl border border-brand/20 bg-brand/5 p-3 text-left mt-2">
                  <p className="text-[10px] font-semibold text-brand uppercase tracking-wide mb-1">🧠 Did you know?</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{NEURAL_FUN_FACTS[funFactIndex]}</p>
                </div>
              </div>
            </div>
          ) : currentQ ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Question {currentQIndex + 1} of {questions.length}
                </span>
                {score.total > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {score.correct}/{score.total} correct
                  </span>
                )}
              </div>
              <div className="bg-muted/30 rounded-2xl p-5">
                <p className="font-semibold text-foreground leading-relaxed">{currentQ.question}</p>
              </div>
              <div className="space-y-2.5">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correct;
                  const revealed = answerState !== "unanswered";
                  let style = "border-border bg-background hover:bg-muted/50 hover:border-brand/40 cursor-pointer";
                  if (revealed && isCorrect) style = "border-green-500 bg-green-50 dark:bg-green-950/30";
                  else if (revealed && isSelected && !isCorrect) style = "border-red-400 bg-red-50 dark:bg-red-950/30";
                  return (
                    <button
                      key={idx}
                      onClick={() => selectOption(idx)}
                      disabled={revealed}
                      className={cn("w-full text-left flex items-center gap-3 p-4 rounded-xl border-2 transition-all", style)}
                    >
                      <span className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                        revealed && isCorrect ? "bg-green-500 text-white" :
                        revealed && isSelected && !isCorrect ? "bg-red-400 text-white" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {["A", "B", "C", "D"][idx]}
                      </span>
                      <span className="text-sm font-medium flex-1">{opt}</span>
                      {revealed && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
                      {revealed && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {answerState === "unanswered" && (
                <Button
                  variant="outline"
                  className="w-full text-muted-foreground gap-2"
                  onClick={() => { setSelectedOption(null); setAnswerState("wrong"); setScore(prev => ({ ...prev, total: prev.total + 1 })); }}
                >
                  <HelpCircle className="w-4 h-4" /> I don't know — show me the answer
                </Button>
              )}
              {answerState !== "unanswered" && (
                <div className={cn(
                  "rounded-xl p-4 border space-y-1.5",
                  answerState === "correct"
                    ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                    : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                )}>
                  <p className={cn(
                    "text-sm font-semibold",
                    answerState === "correct" ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"
                  )}>
                    {answerState === "correct" ? "Correct! Well done." : `The correct answer is: ${currentQ.options[currentQ.correct]}`}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}
              {answerState !== "unanswered" && (
                <Button
                  className="w-full bg-brand hover:bg-brand/90 text-white gap-2"
                  onClick={nextQuestion}
                  disabled={loadingMore && currentQIndex >= questions.length - 1}
                >
                  {loadingMore && currentQIndex >= questions.length - 1 ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Loading next question...</>
                  ) : (
                    <><ArrowRight className="w-4 h-4" /> Next Question</>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Brain className="w-12 h-12 text-brand mx-auto" />
                <p className="font-semibold">Ready to test yourself?</p>
                <p className="text-sm text-muted-foreground">Generate unlimited questions from your document</p>
                <Button className="bg-brand hover:bg-brand/90 text-white gap-2" onClick={() => loadQuiz()}>
                  <Brain className="w-4 h-4" /> Generate Quiz
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

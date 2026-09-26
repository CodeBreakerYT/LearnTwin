"use client";

import { useSyncExternalStore } from "react";
import type { CharacterId } from "./types";
import { chunkSpeech, toSpeech } from "./spoken";

/**
 * Voice layer.
 *  - Speaking: Groq TTS via /api/tts when the account allows it, otherwise the browser's built-in voices.
 *  - Listening: Whisper via /api/stt (record + silence detection), otherwise the browser's SpeechRecognition.
 * Everything degrades silently, so the experience keeps working without a key or without a microphone.
 */

export const voiceBus = { level: 0, speaking: false };

type Snap = { speaking: boolean; listening: boolean; mic: number };
let snap: Snap = { speaking: false, listening: false, mic: 0 };
const listeners = new Set<() => void>();
const set = (p: Partial<Snap>) => {
  snap = { ...snap, ...p };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const SERVER: Snap = { speaking: false, listening: false, mic: 0 };
export const useVoiceState = () => useSyncExternalStore(subscribe, () => snap, () => SERVER);

const VOICES: Record<CharacterId, { groq: string; pitch: number; rate: number }> = {
  nova: { groq: "diana", pitch: 1.05, rate: 0.95 },
  byte: { groq: "hannah", pitch: 1.3, rate: 1.1 },
  atlas: { groq: "autumn", pitch: 0.9, rate: 1.0 },
};

let ctx: AudioContext | null = null;
const audioCtx = () => {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
};

/* ------------------------------------------------------------- speaking */

let ttsOk: boolean | null = null; // null = unknown, false = fall back to browser voices
let token = 0;
let stopCurrent: (() => void) | null = null;

export function stopSpeaking() {
  token++;
  stopCurrent?.();
  stopCurrent = null;
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  voiceBus.speaking = false;
  voiceBus.level = 0;
  set({ speaking: false });
}

async function fetchClip(text: string, id: CharacterId): Promise<AudioBuffer> {
  const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, characterId: id }) });
  if (!res.ok) throw new Error(`tts ${res.status}`);
  return audioCtx().decodeAudioData(await res.arrayBuffer());
}

function playBuffer(buf: AudioBuffer, my: number): Promise<void> {
  return new Promise((resolve) => {
    const c = audioCtx();
    const src = c.createBufferSource();
    src.buffer = buf;
    const an = c.createAnalyser();
    an.fftSize = 512;
    src.connect(an);
    an.connect(c.destination);
    const data = new Uint8Array(an.fftSize);
    let raf = 0;
    const tick = () => {
      an.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += ((v - 128) / 128) ** 2;
      voiceBus.level = Math.min(1, Math.sqrt(sum / data.length) * 5);
      raf = requestAnimationFrame(tick);
    };
    tick();
    const done = () => {
      cancelAnimationFrame(raf);
      voiceBus.level = 0;
      resolve();
    };
    src.onended = done;
    stopCurrent = () => {
      src.onended = null;
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
      done();
    };
    if (my !== token) return done();
    src.start();
  });
}

let browserVoices: SpeechSynthesisVoice[] = [];
function pickVoice(): SpeechSynthesisVoice | undefined {
  if (!browserVoices.length && typeof speechSynthesis !== "undefined") browserVoices = speechSynthesis.getVoices();
  const en = browserVoices.filter((v) => v.lang.startsWith("en"));
  return en.find((v) => /aria|jenny|zira|samantha|google uk english female|female|natural/i.test(v.name)) ?? en[0];
}

function speakBrowser(chunks: string[], id: CharacterId, my: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof speechSynthesis === "undefined") return resolve();
    const v = VOICES[id];
    const voice = pickVoice();
    let i = 0;
    const wobble = setInterval(() => (voiceBus.level = 0.2 + Math.random() * 0.45), 90);
    const finish = () => {
      clearInterval(wobble);
      voiceBus.level = 0;
      resolve();
    };
    stopCurrent = finish;
    const next = () => {
      if (my !== token || i >= chunks.length) return finish();
      const u = new SpeechSynthesisUtterance(chunks[i++]);
      if (voice) u.voice = voice;
      u.pitch = v.pitch;
      u.rate = v.rate;
      u.onend = next;
      u.onerror = next;
      speechSynthesis.speak(u);
    };
    next();
  });
}

/** Speaks text in a character's voice. Resolves when finished (or interrupted). */
export async function speak(text: string, id: CharacterId): Promise<void> {
  stopSpeaking();
  const my = ++token;
  const chunks = chunkSpeech(toSpeech(text));
  if (!chunks.length) return;
  voiceBus.speaking = true;
  set({ speaking: true });
  try {
    let played = 0;
    if (ttsOk !== false) {
      try {
        let pending = fetchClip(chunks[0], id);
        for (let i = 0; i < chunks.length; i++) {
          const buf = await pending;
          if (my !== token) return;
          if (i + 1 < chunks.length) pending = fetchClip(chunks[i + 1], id);
          ttsOk = true;
          await playBuffer(buf, my);
          played++;
          if (my !== token) return;
        }
        return;
      } catch {
        if (my !== token) return;
        if (played === 0) ttsOk = false;
      }
    }
    await speakBrowser(chunks.slice(played), id, my);
  } finally {
    if (my === token) {
      voiceBus.speaking = false;
      voiceBus.level = 0;
      set({ speaking: false });
    }
  }
}

/* ------------------------------------------------------------ listening */

let cancelListen: (() => void) | null = null;
export const cancelListening = () => cancelListen?.();

type SR = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
};
const SpeechRec = (): (new () => SR) | null =>
  typeof window === "undefined" ? null : ((window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition ?? null);

export const canListen = () => typeof navigator !== "undefined" && (Boolean(navigator.mediaDevices?.getUserMedia) || SpeechRec() !== null);

function listenBrowser(): Promise<string> {
  return new Promise((resolve, reject) => {
    const Rec = SpeechRec();
    if (!Rec) return reject(new Error("unsupported"));
    const r = new Rec();
    r.lang = "en-US";
    r.interimResults = false;
    r.continuous = false;
    let text = "";
    r.onresult = (e) => {
      text = Array.from(e.results).map((x) => x[0].transcript).join(" ");
    };
    r.onerror = () => resolve(text);
    r.onend = () => {
      cancelListen = null;
      set({ listening: false });
      resolve(text.trim());
    };
    cancelListen = () => r.abort();
    set({ listening: true });
    r.start();
    setTimeout(() => r.stop(), 9000);
  });
}

/** Records one utterance (with silence detection) and transcribes it with Whisper on the server. */
async function listenWhisper(): Promise<string> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const c = audioCtx();
  const an = c.createAnalyser();
  an.fftSize = 512;
  c.createMediaStreamSource(stream).connect(an);
  const data = new Uint8Array(an.fftSize);
  const rec = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  return new Promise<string>((resolve, reject) => {
    const started = performance.now();
    let heard = false;
    let lastVoice = started;
    let cancelled = false;
    let raf = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      if (rec.state !== "inactive") rec.stop();
    };
    cancelListen = () => {
      cancelled = true;
      stop();
    };
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      cancelListen = null;
      set({ listening: false, mic: 0 });
      if (cancelled || !heard) return resolve("");
      try {
        const fd = new FormData();
        fd.append("file", new Blob(chunks, { type: rec.mimeType || "audio/webm" }), "answer.webm");
        const res = await fetch("/api/stt", { method: "POST", body: fd });
        if (!res.ok) throw new Error(`stt ${res.status}`);
        resolve(((await res.json()) as { text?: string }).text?.trim() ?? "");
      } catch (e) {
        reject(e);
      }
    };
    const tick = () => {
      an.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += ((v - 128) / 128) ** 2;
      const rms = Math.sqrt(sum / data.length);
      const now = performance.now();
      set({ mic: Math.min(1, rms * 8) });
      if (rms > 0.025) {
        heard = true;
        lastVoice = now;
      }
      if ((heard && now - lastVoice > 1100) || (!heard && now - started > 7000) || now - started > 12000) return stop();
      raf = requestAnimationFrame(tick);
    };
    set({ listening: true });
    rec.start(250);
    tick();
  });
}

let whisperOk: boolean | null = null;

/** Listens for one spoken answer. `server` = a Groq key is configured. Returns "" if nothing was said. */
export async function listen(server: boolean): Promise<string> {
  cancelListening();
  if (server && whisperOk !== false && typeof navigator.mediaDevices?.getUserMedia === "function") {
    try {
      const t = await listenWhisper();
      whisperOk = true;
      return t;
    } catch (e) {
      if (e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "NotFoundError")) throw e;
      whisperOk = false;
      set({ listening: false, mic: 0 });
    }
  }
  return listenBrowser();
}

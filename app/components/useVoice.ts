'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Browser-native voice using the Web Speech API:
//   - SpeechRecognition  -> speech-to-text (listen)
//   - speechSynthesis    -> text-to-speech (speak)
// No external service, no API key. Works in Chrome / Edge; degrades gracefully elsewhere.

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useVoice(lang = 'en-IN') {
  const [supported, setSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [micError, setMicError] = useState<string>('');
  const [interim, setInterim] = useState<string>(''); // live partial transcript
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const hasSTT = !!getRecognitionCtor();
    const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
    setSupported(hasSTT && hasTTS);
    setTtsSupported(hasTTS);
    setSttSupported(hasSTT);

    if (hasTTS) {
      const pickVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices.length) return;
        voiceRef.current =
          voices.find((v) => /en[-_]IN/i.test(v.lang)) || // Indian English first
          voices.find((v) => /en[-_]US/i.test(v.lang) && /female|samantha|zira|aria|jenny|google/i.test(v.name)) ||
          voices.find((v) => /en[-_]US/i.test(v.lang)) ||
          voices.find((v) => /^en/i.test(v.lang)) ||
          voices[0];
      };
      pickVoice();
      window.speechSynthesis.onvoiceschanged = pickVoice;
    }

    return () => {
      try {
        recognitionRef.current?.abort();
        if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, []);

  /**
   * Unlock the speech engine. MUST be called synchronously from a user gesture
   * (e.g. a click handler) before any awaited speak()/listen() calls. Plays a
   * silent utterance so the browser permits subsequent programmatic speech.
   */
  const unlockAudio = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      // Just resume — the first real speak() happens within the same gesture,
      // which is enough to satisfy autoplay rules. A silent utterance here can
      // race with that first speak and cancel it, so we deliberately avoid it.
      window.speechSynthesis.resume();
    } catch {
      /* ignore */
    }
  }, []);

  /** Speak text aloud. Resolves when finished (or immediately if TTS unavailable). */
  const speak = useCallback(
    (text: string): Promise<void> =>
      new Promise((resolve) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) {
          resolve();
          return;
        }
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.02;
        utterance.pitch = 1;
        if (voiceRef.current) utterance.voice = voiceRef.current;
        utterance.onstart = () => setSpeaking(true);
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          setSpeaking(false);
          resolve();
        };
        utterance.onend = done;
        utterance.onerror = done;

        const speakNow = () => {
          try {
            synth.resume(); // works around Chrome/Edge auto-pause
          } catch {
            /* ignore */
          }
          synth.speak(utterance);
        };

        // IMPORTANT: only cancel when something is actually queued. Calling
        // cancel() right before speak() on an idle engine eats the utterance
        // (a well-known Chrome/Edge bug => "nothing is spoken").
        if (synth.speaking || synth.pending) {
          synth.cancel();
          setTimeout(speakNow, 180);
        } else {
          speakNow();
        }

        // Safety net: some browsers never fire onend for short clips.
        setTimeout(done, Math.min(15000, 1800 + text.length * 90));
      }),
    [lang]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  /**
   * Listen continuously and resolve with the recognized transcript.
   * - continuous + interimResults: captures through brief pauses, shows a live
   *   partial transcript, and accumulates the full final phrase.
   * - resolves ~800ms after you stop talking (end-of-speech), or at the timeout.
   * - re-arms only if a session ends having heard nothing, so the mic stays open.
   */
  const listen = useCallback(
    (timeoutMs = 15000): Promise<string> =>
      new Promise((resolve) => {
        const Ctor = getRecognitionCtor();
        if (!Ctor) {
          setMicError('unsupported');
          resolve('');
          return;
        }
        if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
        try {
          recognitionRef.current?.abort();
        } catch {
          /* ignore */
        }

        let settled = false;
        let finalText = '';
        let current: SpeechRecognitionLike | null = null;
        const deadline = Date.now() + timeoutMs;
        let killTimer: ReturnType<typeof setTimeout> | undefined;
        let silenceTimer: ReturnType<typeof setTimeout> | undefined;

        const done = (value: string) => {
          if (settled) return;
          settled = true;
          if (killTimer) clearTimeout(killTimer);
          if (silenceTimer) clearTimeout(silenceTimer);
          try { current?.stop(); } catch { /* ignore */ }
          setListening(false);
          setInterim('');
          recognitionRef.current = null;
          resolve(value.trim());
        };

        const arm = () => {
          if (settled) return;
          const rec = new Ctor();
          current = rec;
          rec.lang = lang;
          rec.interimResults = true;
          rec.continuous = true;
          rec.maxAlternatives = 1;
          recognitionRef.current = rec;

          rec.onresult = (event: any) => {
            let interimStr = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const res = event.results[i];
              const txt = String(res?.[0]?.transcript ?? '');
              if (res.isFinal) finalText = `${finalText} ${txt}`.trim();
              else interimStr += txt;
            }
            setMicError('');
            setInterim(interimStr || finalText);
            // Resolve a beat after the user stops (so multi-part finals join).
            if (silenceTimer) clearTimeout(silenceTimer);
            if (finalText) silenceTimer = setTimeout(() => done(finalText), 800);
          };
          rec.onerror = (event: any) => {
            const err = event?.error;
            if (err && err !== 'no-speech' && err !== 'aborted') {
              setMicError(err);
              done(finalText);
            }
          };
          rec.onend = () => {
            if (settled) return;
            if (finalText) done(finalText);
            else if (Date.now() < deadline) setTimeout(arm, 120); // keep the mic open
            else done('');
          };

          try {
            rec.start();
          } catch {
            setTimeout(() => {
              if (!settled) done(finalText);
            }, 0);
          }
        };

        setListening(true);
        setInterim('');
        arm();
        killTimer = setTimeout(() => done(finalText), timeoutMs);
      }),
    [lang]
  );

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  /**
   * Speak a prompt, wait for it to finish, THEN listen. Sequential = the mic
   * never hears the assistant's own voice, so recognition stays accurate.
   * (Tapping "Answer now" cancels the speech early, which makes this resolve and
   * jump straight to listening — that's the interrupt path.)
   */
  const askAndListen = useCallback(
    async (prompt: string, timeoutMs = 14000): Promise<string> => {
      await speak(prompt);
      await new Promise((r) => setTimeout(r, 250)); // small gap after speech
      return listen(timeoutMs);
    },
    [speak, listen]
  );

  return {
    supported,
    ttsSupported,
    sttSupported,
    listening,
    speaking,
    micError,
    interim,
    clearMicError: () => setMicError(''),
    unlockAudio,
    speak,
    stopSpeaking,
    listen,
    stopListening,
    askAndListen,
  };
}

/** Interpret a spoken phrase as yes / no / unknown — used for voice confirmation. */
export function interpretYesNo(transcript: string): 'yes' | 'no' | 'unknown' {
  const t = transcript.toLowerCase().trim();
  if (!t) return 'unknown';
  if (/\b(yes|yeah|yep|yup|sure|confirm|confirmed|ok|okay|place( the)? order|go ahead|do it|proceed|correct|perfect|sounds good)\b/.test(t))
    return 'yes';
  if (/\b(no|nope|cancel|stop|don't|do not|wait|change|nah)\b/.test(t)) return 'no';
  return 'unknown';
}

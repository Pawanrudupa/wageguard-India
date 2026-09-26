/**
 * Web Speech API utilities for Ask Rights: Voice Input (STT) and Concise Answer Read-Aloud (TTS).
 * Strict TypeScript implementation with graceful fallbacks for unsupported browsers.
 */

// Browser SpeechRecognition interface declaration
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => IWindowSpeechRecognition;
    webkitSpeechRecognition?: new () => IWindowSpeechRecognition;
  }
}

/**
 * Check whether Web Speech Recognition (STT) is available in current browser.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Check whether Speech Synthesis (TTS) is available in current browser.
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean("speechSynthesis" in window && typeof window.SpeechSynthesisUtterance !== "undefined");
}

export interface SpeechRecognitionHandlers {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (errorMessage: string) => void;
  onEnd: () => void;
}

/**
 * Initialize and start Speech Recognition tagged to active locale (hi-IN / en-IN).
 * Returns a cleanup/abort function.
 */
export function startVoiceRecognition(
  lang: "en" | "hi",
  handlers: SpeechRecognitionHandlers
): (() => void) | null {
  if (!isSpeechRecognitionSupported()) {
    handlers.onError("unsupported");
    return null;
  }

  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionClass) {
    handlers.onError("unsupported");
    return null;
  }

  try {
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang === "hi" ? "hi-IN" : "en-IN";

    let hasReceivedFinal = false;

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      if (finalTranscript) {
        hasReceivedFinal = true;
        handlers.onFinal(finalTranscript.trim());
      } else if (interimTranscript) {
        handlers.onInterim(interimTranscript);
      }
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      // Ignore user abort or no-speech when finishing
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }
      handlers.onError(event.error || "Speech recognition error");
    };

    recognition.onend = () => {
      if (!hasReceivedFinal) {
        // Trigger end cleanup
      }
      handlers.onEnd();
    };

    recognition.start();

    return () => {
      try {
        recognition.abort();
      } catch {
        // Ignore abort errors
      }
    };
  } catch (err) {
    handlers.onError(err instanceof Error ? err.message : "Failed to initialize voice recognition");
    return null;
  }
}

/**
 * Extracts a concise 1-2 sentence spoken summary from grounded legal answer.
 * Strips markdown asterisks, citation tags [1], brackets, and bullet symbols
 * to eliminate citation fatigue during audio playback.
 */
export function extractSpokenSummary(answerText: string): string {
  if (!answerText) return "";

  // 1. Strip citation brackets like [1], [2], [Source 1]
  let clean = answerText.replace(/\[\s*(?:source\s*)?\d+\s*\]/gi, "");

  // 2. Strip section symbols § and bracketed citations
  clean = clean.replace(/§\s*/g, "Section ");

  // 3. Strip bold/italic markdown (**text**, *text*, __text__)
  clean = clean.replace(/\*\*(.*?)\*\*/g, "$1");
  clean = clean.replace(/\*(.*?)\*/g, "$1");
  clean = clean.replace(/__(.*?)__/g, "$1");
  clean = clean.replace(/_(.*?)_/g, "$1");

  // 4. Strip markdown headers (## Header)
  clean = clean.replace(/^#+\s+.+$/gm, "");

  // 5. Strip list bullets (- bullet, * bullet)
  clean = clean.replace(/^\s*[-*•]\s+/gm, "");

  // 6. Normalize whitespace and newlines
  clean = clean.replace(/\s+/g, " ").trim();

  // 7. Split into sentences (matching Latin punctuation . ! ? and Devanagari danda ।)
  const sentenceMatches = clean.match(/[^.!?।]+[.!?।]+/g);

  if (sentenceMatches && sentenceMatches.length > 0) {
    // Take first 2 sentences max
    const spokenSlice = sentenceMatches.slice(0, 2).map((s) => s.trim()).join(" ");
    if (spokenSlice.length > 20) {
      return spokenSlice;
    }
  }

  // Fallback: first 180 characters trimmed cleanly at word boundary
  if (clean.length <= 180) return clean;
  const truncated = clean.slice(0, 180);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

/**
 * Play a spoken summary using browser SpeechSynthesis tagged to active locale.
 * Returns a cancel function.
 */
export function speakSpokenSummary(
  text: string,
  lang: "en" | "hi",
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: string) => void
): () => void {
  if (!isSpeechSynthesisSupported()) {
    onError?.("Speech synthesis is not supported on this browser.");
    return () => {};
  }

  // Stop any active speech before starting new utterance
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
  utterance.rate = 0.95; // Slightly slower pace for maximum clarity

  // Match available voice if present
  const voices = window.speechSynthesis.getVoices();
  const targetPrefix = lang === "hi" ? "hi" : "en";
  const matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    // 'canceled' error occurs on intentional stop
    if (e.error !== "canceled" && e.error !== "interrupted") {
      onError?.(e.error || "Audio playback error");
    }
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);

  return () => {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore cancel errors
    }
  };
}

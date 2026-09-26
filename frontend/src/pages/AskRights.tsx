/**
 * Grounded labour rights RAG assistant page wired to POST /api/rights with SSE streaming, expandable citations, and permanent disclaimer.
 */
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { streamRights, RightsResponse, CitationSchema } from "../lib/api";
import { Combobox } from "../components/Combobox";
import { ScrollReveal } from "../components/ScrollReveal";
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  startVoiceRecognition,
  extractSpokenSummary,
  speakSpokenSummary,
} from "../lib/speech";

const STATES = [
  "Delhi",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Kerala",
  "Telangana",
  "West Bengal",
  "Central Sphere",
  "Gujarat",
  "Rajasthan",
  "Uttar Pradesh",
  "Haryana",
  "Punjab",
  "Bihar",
];

export const AskRights: React.FC = () => {
  const { lang, t } = useI18n();
  const [searchParams] = useSearchParams();

  const sampleQueries = [
    t.rights.sample1,
    t.rights.sample2,
    t.rights.sample3,
    t.rights.sample4,
  ];

  const [query, setQuery] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingAnswer, setStreamingAnswer] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RightsResponse | null>(null);
  const [expandedCitationIndex, setExpandedCitationIndex] = useState<number | null>(null);
  const [tickerIndex, setTickerIndex] = useState<number>(0);
  const [scannerStep, setScannerStep] = useState<number>(0);

  // Voice Input (STT) and Audio Synthesis (TTS) State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [spokenSummary, setSpokenSummary] = useState<string>("");
  const [ttsError, setTtsError] = useState<string | null>(null);

  const stopVoiceRef = React.useRef<(() => void) | null>(null);
  const stopTtsRef = React.useRef<(() => void) | null>(null);

  // Dynamic query ticker interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % sampleQueries.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [sampleQueries.length]);

  // Read optional initial state and query from URL params
  useEffect(() => {
    const initialState = searchParams.get("state");
    if (initialState) {
      setState(initialState);
    }
    const initialQuery = searchParams.get("query");
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [searchParams]);

  // Cleanup speech recognition and audio playback on unmount
  useEffect(() => {
    return () => {
      if (stopVoiceRef.current) {
        stopVoiceRef.current();
      }
      if (stopTtsRef.current) {
        stopTtsRef.current();
      }
    };
  }, []);

  const handleAsk = async (queryText?: string) => {
    const textToSubmit = queryText !== undefined ? queryText : query;
    if (!textToSubmit.trim() || textToSubmit.trim().length < 3) return;

    // Stop active audio or mic when new question begins
    if (stopVoiceRef.current) {
      stopVoiceRef.current();
      stopVoiceRef.current = null;
      setIsListening(false);
    }
    if (stopTtsRef.current) {
      stopTtsRef.current();
      stopTtsRef.current = null;
      setIsSpeaking(false);
    }

    setLoading(true);
    setIsStreaming(true);
    setStreamingAnswer("");
    setError(null);
    setResult(null);
    setSpokenSummary("");
    setExpandedCitationIndex(null);
    setScannerStep(0);

    setTimeout(() => setScannerStep(1), 350);
    setTimeout(() => setScannerStep(2), 700);
    setTimeout(() => setScannerStep(3), 1100);

    try {
      await streamRights(
        textToSubmit.trim(),
        state || undefined,
        lang,
        (token) => {
          setStreamingAnswer((prev) => prev + token);
        },
        (finalResult) => {
          setResult(finalResult);
          setStreamingAnswer("");
          setIsStreaming(false);
          setLoading(false);
        },
        (err) => {
          setError(err.message || "Failed to retrieve legal guidance");
          setIsStreaming(false);
          setLoading(false);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retrieve legal guidance");
      setIsStreaming(false);
      setLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    setVoiceNotice(null);

    if (isListening) {
      if (stopVoiceRef.current) {
        stopVoiceRef.current();
        stopVoiceRef.current = null;
      }
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setVoiceNotice(t.rights.voiceUnsupportedNotice);
      return;
    }

    setIsListening(true);
    const stopFn = startVoiceRecognition(lang, {
      onInterim: (interimText) => {
        setQuery(interimText);
      },
      onFinal: (finalText) => {
        setQuery(finalText);
      },
      onError: (errMsg) => {
        if (errMsg === "unsupported") {
          setVoiceNotice(t.rights.voiceUnsupportedNotice);
        } else if (errMsg === "not-allowed") {
          setVoiceNotice("Microphone permission was denied. Please allow microphone access in your browser settings.");
        } else {
          setVoiceNotice(`Voice input notice: ${errMsg}`);
        }
        setIsListening(false);
        stopVoiceRef.current = null;
      },
      onEnd: () => {
        setIsListening(false);
        stopVoiceRef.current = null;
      },
    });

    stopVoiceRef.current = stopFn;
  };

  const handleTtsToggle = () => {
    setTtsError(null);

    if (isSpeaking) {
      if (stopTtsRef.current) {
        stopTtsRef.current();
        stopTtsRef.current = null;
      }
      setIsSpeaking(false);
      return;
    }

    if (!result?.answer) return;

    if (!isSpeechSynthesisSupported()) {
      setTtsError(t.rights.ttsUnsupportedNotice);
      return;
    }

    const summary = extractSpokenSummary(result.answer);
    setSpokenSummary(summary);
    setIsSpeaking(true);

    const stopFn = speakSpokenSummary(
      summary,
      lang,
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false);
        stopTtsRef.current = null;
      },
      (err) => {
        setTtsError(err);
        setIsSpeaking(false);
        stopTtsRef.current = null;
      }
    );

    stopTtsRef.current = stopFn;
  };

  const handleSampleClick = (sampleText: string) => {
    setQuery(sampleText);
    handleAsk(sampleText);
  };

  const toggleCitation = (index: number) => {
    setExpandedCitationIndex(expandedCitationIndex === index ? null : index);
  };

  const stateOptions = [
    { value: "", label: t.rights.allIndiaLabel },
    ...STATES.map((s) => ({ value: s, label: s })),
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <section className="border-3 border-ink bg-surface p-6 shadow-brutal space-y-2">
        <h1 className="font-heading font-black text-2xl sm:text-4xl text-ink">
          {t.rights.title}
        </h1>
        <p className="font-body text-base text-ink/85 leading-relaxed">
          {t.rights.subtitle}
        </p>
      </section>

      {/* Query Form */}
      <section className="border-3 border-ink bg-surface p-6 shadow-brutal space-y-4">
        {/* Sample queries for rapid tap + Dynamic Inspiration Ticker */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="font-bold text-ink/75 uppercase">
              {t.rights.sampleQueriesLabel}
            </span>
            <button
              type="button"
              onClick={() => handleSampleClick(sampleQueries[tickerIndex])}
              className="text-trust hover:underline font-bold flex items-center gap-1.5 cursor-pointer max-w-full sm:max-w-md truncate"
              title="Click to insert into query"
            >
              <span>💡 Try:</span>
              <span className="italic truncate">"{sampleQueries[tickerIndex]}"</span>
              <span className="ticker-cursor" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSampleClick(sample)}
                className="btn-press-sm text-left min-h-[44px] px-3 py-1.5 bg-bg hover:bg-accent/40 border-2 border-ink text-xs font-body font-medium text-ink cursor-pointer"
              >
                💬 {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Text input area */}
        <div className="space-y-2 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="rights-query"
              className="block font-heading font-bold text-sm text-ink"
            >
              {t.rights.inputLabel}
            </label>
            <button
              type="button"
              onClick={handleVoiceToggle}
              aria-label={isListening ? t.rights.voiceInputStop : t.rights.voiceInputStart}
              title={isListening ? t.rights.voiceInputStop : t.rights.voiceInputStart}
              className={`min-h-[44px] px-3.5 py-1.5 border-2 border-ink font-heading font-bold text-xs flex items-center gap-2 shadow-brutal-sm cursor-pointer transition-colors ${
                isListening
                  ? "bg-risk-high text-surface animate-pulse"
                  : "bg-surface hover:bg-accent/30 text-ink"
              }`}
            >
              <span>{isListening ? "🔴" : "🎤"}</span>
              <span>{isListening ? t.rights.voiceInputListening : t.rights.voiceInputStart}</span>
            </button>
          </div>

          <textarea
            id="rights-query"
            rows={3}
            maxLength={500}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.rights.inputPlaceholder}
            className="w-full min-h-[96px] p-3 bg-bg border-3 border-ink font-body text-base text-ink placeholder:text-ink/50 focus:outline-none focus:ring-2 focus:ring-accent leading-relaxed"
          />

          {/* Voice Fallback / Permission Notice */}
          {voiceNotice && (
            <div className="border-2 border-risk-high bg-risk-high/10 p-3 shadow-brutal-sm flex items-start justify-between gap-2 text-xs font-mono text-ink">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{voiceNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setVoiceNotice(null)}
                className="font-bold text-ink hover:underline p-1 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Dismiss notice"
              >
                ✕
              </button>
            </div>
          )}

          <div className="text-[11px] font-mono text-ink/60 text-right">
            {query.length} / 500 {t.rights.charCountSuffix}
          </div>
        </div>

        {/* State optional dropdown & Ask button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-1">
          <div className="flex-1">
            <Combobox
              id="rights-state-combobox"
              label={t.rights.stateOptionalLabel}
              value={state}
              onChange={setState}
              options={stateOptions}
              placeholder={t.rights.allIndiaLabel}
            />
          </div>

          <button
            type="button"
            onClick={() => handleAsk()}
            disabled={loading || query.trim().length < 3}
            className="btn-press min-h-[44px] sm:min-h-[48px] px-6 py-2.5 border-3 border-ink bg-accent text-ink font-heading font-black text-base shadow-brutal disabled:opacity-40 cursor-pointer"
          >
            {loading ? t.rights.asking : t.rights.askButton}
          </button>
        </div>
      </section>

      {/* Error Notice */}
      {error && (
        <div className="border-3 border-risk-high bg-surface p-4 shadow-brutal text-risk-high font-mono text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Live Statute Scanner & SSE Streaming Output */}
      {(loading || isStreaming) && (
        <section className="border-3 border-ink bg-surface p-5 sm:p-6 shadow-brutal space-y-4">
          <div className="border-b-2 border-ink/20 pb-3 flex items-center justify-between">
            <h2 className="font-heading font-black text-lg sm:text-xl text-ink flex items-center gap-2">
              <span className="w-3 h-3 bg-accent border border-ink animate-pulse" />
              {isStreaming && streamingAnswer ? t.rights.streamingStatus : "Corpus Retrieval in Progress"}
            </h2>
            <div className="text-xs font-mono px-2 py-0.5 border border-trust bg-trust text-surface font-bold">
              {isStreaming && streamingAnswer ? "SSE STREAMING" : "SCANNING RAG"}
            </div>
          </div>

          {/* 3-Step Live Statute Scanner Checklist */}
          <div className="border-2 border-ink bg-bg p-4 shadow-brutal-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-ink/20 pb-1.5">
              <span className="font-mono text-xs font-black uppercase text-trust flex items-center gap-2">
                <span className="w-2 h-2 bg-accent border border-ink animate-ping" />
                Live Statute Scanner
              </span>
              <span className="font-mono text-[11px] font-bold text-ink/70">
                {scannerStep < 3 ? `Step ${scannerStep + 1} of 3` : "Corpus Verified"}
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <div
                className={`flex items-center gap-2 transition-colors ${
                  scannerStep >= 0 ? "text-ink font-bold" : "text-ink/40"
                }`}
              >
                <span className="font-mono text-sm">{scannerStep > 0 ? "☑" : "⏳"}</span>
                <span>{t.rights.scannerStep1}</span>
              </div>
              <div
                className={`flex items-center gap-2 transition-colors ${
                  scannerStep >= 1 ? "text-ink font-bold" : "text-ink/40"
                }`}
              >
                <span className="font-mono text-sm">
                  {scannerStep > 1 ? "☑" : scannerStep === 1 ? "⏳" : "☐"}
                </span>
                <span>{t.rights.scannerStep2}</span>
              </div>
              <div
                className={`flex items-center gap-2 transition-colors ${
                  scannerStep >= 2 ? "text-ink font-bold" : "text-ink/40"
                }`}
              >
                <span className="font-mono text-sm">
                  {scannerStep >= 3 ? "☑" : scannerStep === 2 ? "⏳" : "☐"}
                </span>
                <span>{t.rights.scannerStep3}</span>
              </div>
            </div>
          </div>

          {/* Streaming Text Output */}
          {isStreaming && streamingAnswer && (
            <div className="font-body text-base text-ink leading-relaxed space-y-3 whitespace-pre-line min-h-[60px] pt-1">
              {streamingAnswer}
              <span className="inline-block w-2.5 h-4 bg-trust ml-1 animate-pulse" />
            </div>
          )}
        </section>
      )}

      {/* Grounded Completed Answer Output */}
      {result && !isStreaming && (
        <ScrollReveal>
          <section className="border-3 border-ink bg-surface p-6 shadow-brutal space-y-6">
            {/* Answer Header with Deep Indigo Trust Identity and TTS Audio Listen */}
            <div className="border-b-2 border-ink/20 pb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading font-black text-xl text-ink">
                {t.rights.answerTitle}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTtsToggle}
                  className={`btn-press-sm min-h-[44px] px-3.5 py-1.5 border-2 border-ink font-heading font-bold text-xs flex items-center gap-2 shadow-brutal-sm cursor-pointer transition-colors ${
                    isSpeaking
                      ? "bg-accent text-ink animate-pulse"
                      : "bg-surface hover:bg-bg text-ink"
                  }`}
                  aria-label={isSpeaking ? t.rights.stopListeningBtn : t.rights.listenAnswerBtn}
                  title={isSpeaking ? t.rights.stopListeningBtn : t.rights.listenAnswerBtn}
                >
                  <span>{isSpeaking ? "⏹" : "🔊"}</span>
                  <span>{isSpeaking ? t.rights.stopListeningBtn : t.rights.listenAnswerBtn}</span>
                </button>
                <div className="text-xs font-mono px-2.5 py-1 border-2 border-ink bg-trust text-surface font-bold shadow-brutal-sm">
                  {result.grounded ? t.rights.groundedBadge : t.rights.ungroundedBadge}
                </div>
              </div>
            </div>

            {/* Concise Spoken Summary Callout (concise 1-2 sentence audio summary) */}
            {spokenSummary && (isSpeaking || !ttsError) && (
              <div className="border-2 border-trust bg-trust/10 p-3.5 shadow-brutal-sm space-y-1">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-trust flex items-center gap-2">
                  {isSpeaking && <span className="w-2 h-2 bg-trust rounded-none animate-ping" />}
                  <span>{t.rights.spokenSummaryHeader}</span>
                </div>
                <p className="font-body text-sm font-semibold text-ink leading-relaxed">
                  "{spokenSummary}"
                </p>
              </div>
            )}

            {/* TTS Error notice if unsupported */}
            {ttsError && (
              <div className="border-2 border-risk-high bg-risk-high/10 p-2.5 text-xs font-mono text-ink flex items-center justify-between">
                <span>⚠️ {ttsError}</span>
                <button
                  type="button"
                  onClick={() => setTtsError(null)}
                  className="font-bold text-ink p-1 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Answer Body: High legibility typography, clean spacing */}
            <div className="font-body text-base text-ink leading-relaxed space-y-3 whitespace-pre-line">
              {result.answer}
            </div>

            {/* MANDATORY LEGAL DISCLAIMER: Always visible, never in a tooltip */}
            <div className="border-3 border-ink bg-accent/30 p-4 shadow-brutal-sm space-y-1">
              <div className="font-heading font-black text-xs uppercase tracking-wider text-ink">
                ⚖️ {t.rights.disclaimerLabel}
              </div>
              <p className="font-body text-sm font-semibold text-ink leading-snug">
                {result.disclaimer}
              </p>
            </div>

            {/* Citations List: Expandable plain bordered list items with Deep Indigo accents */}
            {result.citations && result.citations.length > 0 && (
              <div className="space-y-3 pt-2 border-t-2 border-ink/20">
                <div className="font-heading font-bold text-sm text-ink flex items-center gap-1.5">
                  <span>📚</span>
                  <span>{t.rights.citationsTitle} ({result.citations.length})</span>
                </div>

                <div className="space-y-2">
                  {result.citations.map((c: CitationSchema, idx: number) => {
                    const isExpanded = expandedCitationIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="border-2 border-ink bg-bg shadow-brutal-sm transition-colors border-l-4 border-l-trust"
                      >
                        <button
                          type="button"
                          onClick={() => toggleCitation(idx)}
                          className="w-full min-h-[44px] p-3 text-left flex items-start justify-between gap-2 hover:bg-surface focus:outline-none cursor-pointer"
                          aria-expanded={isExpanded}
                        >
                          <div>
                            <div className="font-heading font-bold text-sm text-ink">
                              {c.act_name}
                            </div>
                            <div className="text-xs font-mono text-ink/80">
                              {c.section_or_clause}
                              {c.state ? ` • ${c.state}` : ""}
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-ink/70 px-2 py-1 bg-surface border border-ink">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        </button>

                        {/* Expandable Excerpt / Details with Highlighter Tape Effect */}
                        {isExpanded && (
                          <div className="p-3.5 border-t-2 border-ink/20 bg-surface text-xs font-mono space-y-2.5 text-ink/90">
                            <div className="p-2 border border-ink bg-accent/20">
                              <span className="font-bold text-ink uppercase text-[10px] block text-ink/70 mb-1">
                                Key Verified Statutory Authority
                              </span>
                              <div className="font-body text-sm font-semibold text-ink leading-snug">
                                <span className="highlighter-tape">
                                  {c.act_name} — {c.section_or_clause}
                                </span>
                                {c.section_title && ` (${c.section_title})`}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="font-bold text-ink">{t.rights.section}: </span>
                                <span className="font-mono text-ink/80">{c.section_title || c.section_or_clause}</span>
                              </div>
                              <div>
                                <span className="font-bold text-ink">{t.rights.source}: </span>
                                <span className="font-mono text-ink/80">{c.source_file}</span>
                              </div>
                              {c.valid_as_of_date && (
                                <div className="sm:col-span-2">
                                  <span className="font-bold text-ink">{t.rights.validAsOf}: </span>
                                  <span className="font-mono text-ink/80">{c.valid_as_of_date}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommended Next Steps */}
            {result.next_steps && (
              <div className="border-2 border-ink bg-bg p-4 shadow-brutal-sm space-y-2">
                <div className="font-heading font-bold text-sm text-ink">
                  🚀 {t.rights.nextStepsTitle}
                </div>
                <div className="font-body text-sm text-ink/90 whitespace-pre-line leading-relaxed">
                  {result.next_steps}
                </div>
                <div className="pt-2 flex flex-wrap gap-2">
                  <a
                    href="tel:15100"
                    className="btn-press-sm min-h-[44px] inline-flex items-center px-3.5 py-2 border-2 border-ink bg-accent text-ink font-heading font-bold text-xs shadow-brutal-sm"
                  >
                    {t.rights.callNalsaCta}
                  </a>
                  <a
                    href="https://shramsuvidha.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-press-sm min-h-[44px] inline-flex items-center px-3.5 py-2 border-2 border-ink bg-surface text-ink font-heading font-bold text-xs shadow-brutal-sm"
                  >
                    {t.rights.shramSuvidhaCta}
                  </a>
                </div>
              </div>
            )}
          </section>
        </ScrollReveal>
      )}
    </div>
  );
};

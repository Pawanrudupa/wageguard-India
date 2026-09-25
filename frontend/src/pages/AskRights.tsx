/**
 * Grounded labour rights RAG assistant page wired to POST /api/rights with SSE streaming, expandable citations, and permanent disclaimer.
 */
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { streamRights, RightsResponse, CitationSchema } from "../lib/api";
import { Combobox } from "../components/Combobox";
import { ScrollReveal } from "../components/ScrollReveal";

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

  const [query, setQuery] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingAnswer, setStreamingAnswer] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RightsResponse | null>(null);
  const [expandedCitationIndex, setExpandedCitationIndex] = useState<number | null>(null);

  // Read optional initial state from URL params
  useEffect(() => {
    const initialState = searchParams.get("state");
    if (initialState) {
      setState(initialState);
    }
  }, [searchParams]);

  const handleAsk = async (queryText?: string) => {
    const textToSubmit = queryText !== undefined ? queryText : query;
    if (!textToSubmit.trim() || textToSubmit.trim().length < 3) return;

    setLoading(true);
    setIsStreaming(true);
    setStreamingAnswer("");
    setError(null);
    setResult(null);
    setExpandedCitationIndex(null);

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
        {/* Sample queries for rapid tap */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono font-bold text-ink/75 uppercase">
            {t.rights.sampleQueriesLabel}
          </div>
          <div className="flex flex-wrap gap-2">
            {[t.rights.sample1, t.rights.sample2, t.rights.sample3].map((sample, idx) => (
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
          <label
            htmlFor="rights-query"
            className="block font-heading font-bold text-sm text-ink"
          >
            {t.rights.inputLabel}
          </label>
          <textarea
            id="rights-query"
            rows={3}
            maxLength={500}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.rights.inputPlaceholder}
            className="w-full min-h-[96px] p-3 bg-bg border-3 border-ink font-body text-base text-ink placeholder:text-ink/50 focus:outline-none focus:ring-2 focus:ring-accent leading-relaxed"
          />
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

      {/* Live SSE Streaming Output (Typing Effect) */}
      {isStreaming && (
        <section className="border-3 border-ink bg-surface p-6 shadow-brutal space-y-4">
          <div className="border-b-2 border-ink/20 pb-3 flex items-center justify-between">
            <h2 className="font-heading font-black text-xl text-ink flex items-center gap-2">
              <span className="w-3 h-3 bg-accent border border-ink animate-pulse" />
              {t.rights.streamingStatus}
            </h2>
            <div className="text-xs font-mono px-2 py-0.5 border border-trust bg-trust text-surface font-bold">
              SSE LIVE
            </div>
          </div>

          <div className="font-body text-base text-ink leading-relaxed space-y-3 whitespace-pre-line min-h-[60px]">
            {streamingAnswer}
            <span className="inline-block w-2.5 h-4 bg-trust ml-1 animate-pulse" />
          </div>
        </section>
      )}

      {/* Grounded Completed Answer Output */}
      {result && !isStreaming && (
        <ScrollReveal>
          <section className="border-3 border-ink bg-surface p-6 shadow-brutal space-y-6">
            {/* Answer Header with Deep Indigo Trust Identity */}
            <div className="border-b-2 border-ink/20 pb-3 flex items-center justify-between">
              <h2 className="font-heading font-black text-xl text-ink">
                {t.rights.answerTitle}
              </h2>
              <div className="text-xs font-mono px-2.5 py-1 border-2 border-ink bg-trust text-surface font-bold shadow-brutal-sm">
                {result.grounded ? t.rights.groundedBadge : t.rights.ungroundedBadge}
              </div>
            </div>

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

                        {/* Expandable Excerpt / Details */}
                        {isExpanded && (
                          <div className="p-3 border-t-2 border-ink/20 bg-surface text-xs font-mono space-y-1.5 text-ink/90">
                            {c.section_title && (
                              <div>
                                <span className="font-bold text-ink">{t.rights.section}: </span>
                                {c.section_title}
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-ink">{t.rights.source}: </span>
                              {c.source_file}
                            </div>
                            {c.valid_as_of_date && (
                              <div>
                                <span className="font-bold text-ink">{t.rights.validAsOf}: </span>
                                {c.valid_as_of_date}
                              </div>
                            )}
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

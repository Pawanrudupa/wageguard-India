/**
 * TypewriterText component.
 * Sequentially reveals characters one after another with mechanical timing.
 * Uses Intl.Segmenter to ensure Indian language ligatures/matras (Hindi) do not break during animation.
 * Pre-lays out words so lines never jump mid-word and removes clunky trailing block cursors.
 */
import React, { useMemo } from "react";

interface TypewriterTextProps {
  text: string;
  lang?: string;
  speedMs?: number;
  delayMs?: number;
  className?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  lang = "en",
  speedMs = 30,
  delayMs = 0,
  className = "",
}) => {
  // Split words by space, then graphemes within each word to preserve word boundaries and prevent line-wrap jitter
  const wordsWithGraphemes = useMemo(() => {
    let globalIndex = 0;
    const words = text.split(" ");

    return words.map((word, wordIdx) => {
      let graphemes: string[] = [];
      try {
        const intlAny = Intl as unknown as {
          Segmenter?: new (
            locales?: string,
            options?: { granularity?: string }
          ) => {
            segment: (input: string) => Iterable<{ segment: string }>;
          };
        };
        if (typeof intlAny !== "undefined" && typeof intlAny.Segmenter === "function") {
          const segmenter = new intlAny.Segmenter(lang, { granularity: "grapheme" });
          graphemes = Array.from(segmenter.segment(word), (s: { segment: string }) => s.segment);
        } else {
          graphemes = Array.from(word);
        }
      } catch {
        graphemes = Array.from(word);
      }

      const graphemeItems = graphemes.map((char) => {
        const item = {
          char,
          index: globalIndex,
        };
        globalIndex++;
        return item;
      });

      // Count a tick for the space between words
      if (wordIdx < words.length - 1) {
        globalIndex++;
      }

      return {
        word,
        graphemes: graphemeItems,
      };
    });
  }, [text, lang]);

  return (
    <span className={className} aria-label={text} key={text}>
      <span aria-hidden="true">
        {wordsWithGraphemes.map((w, wIdx) => (
          <React.Fragment key={wIdx}>
            <span className="inline-block whitespace-nowrap">
              {w.graphemes.map((g) => (
                <span
                  key={g.index}
                  className="inline-block opacity-0 animate-letter-emerge"
                  style={{
                    animationDelay: `${delayMs + g.index * speedMs}ms`,
                  }}
                >
                  {g.char}
                </span>
              ))}
            </span>
            {wIdx < wordsWithGraphemes.length - 1 && <span> </span>}
          </React.Fragment>
        ))}
      </span>
    </span>
  );
};

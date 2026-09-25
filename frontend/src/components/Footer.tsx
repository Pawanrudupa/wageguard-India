/**
 * Universal footer presenting NALSA 15100 helpline banner, legal disclaimer, and privacy pledge.
 */
import React from "react";
import { useI18n } from "../lib/i18n";

export const Footer: React.FC = () => {
  const { t } = useI18n();

  return (
    <footer className="border-t-3 border-ink bg-surface mt-12 py-8 px-4">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* NALSA Emergency Helpline Banner */}
        <div className="border-3 border-ink bg-accent p-4 shadow-brutal flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="font-heading font-black text-ink text-base">
              {t.footer.nalsaTitle}
            </div>
            <div className="text-xs text-ink/90 font-body">
              {t.footer.helplineText}
            </div>
          </div>
          <a
            href="tel:15100"
            className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 border-2 border-ink bg-surface text-ink font-heading font-bold text-sm shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
          >
            {t.footer.callNalsa}
          </a>
        </div>

        {/* Legal Disclaimer & Privacy Pledge */}
        <div className="text-xs text-ink/80 flex flex-col gap-2 font-body leading-relaxed">
          <p className="border-l-3 border-ink pl-3 font-semibold text-ink">
            {t.footer.disclaimer}
          </p>
          <p className="border-l-3 border-ink/40 pl-3">
            {t.footer.privacyPledge}
          </p>
        </div>

        <div className="border-t-2 border-ink/20 pt-4 flex flex-wrap items-center justify-between text-[11px] font-mono text-ink/70">
          <div>{t.footer.versionNote}</div>
          <div>{t.footer.statutoryBasis}</div>
        </div>
      </div>
    </footer>
  );
};

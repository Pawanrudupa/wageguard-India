/**
 * Government grievance channels, state labour commissioner contacts, and NALSA legal aid contacts.
 */
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { fetchResources, ResourcesResponse } from "../lib/api";
import { Combobox } from "../components/Combobox";
import { ScrollReveal } from "../components/ScrollReveal";

const LAUNCH_STATES = [
  "Delhi",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Kerala",
  "Telangana",
  "West Bengal",
];

export const Resources: React.FC = () => {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedState, setSelectedState] = useState<string>(
    searchParams.get("state") || ""
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResourcesResponse | null>(null);

  const loadResources = async (stateFilter: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchResources(stateFilter);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load grievance resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources(selectedState);
  }, [selectedState]);

  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    if (newState) {
      setSearchParams({ state: newState });
    } else {
      setSearchParams({});
    }
  };

  const stateOptions = [
    { value: "", label: t.resources.allStates },
    ...LAUNCH_STATES.map((s) => ({ value: s, label: s })),
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <section className="border-3 border-ink bg-surface p-6 shadow-brutal space-y-2">
        <h1 className="font-heading font-black text-2xl sm:text-4xl text-ink">
          {t.resources.title}
        </h1>
        <p className="font-body text-base text-ink/85 leading-relaxed">
          {t.resources.subtitle}
        </p>
      </section>

      {/* State Filter Controls using Custom Neo-Brutalist Combobox */}
      <section className="border-3 border-ink bg-surface p-4 shadow-brutal flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="font-heading font-bold text-sm text-ink whitespace-nowrap">
          {t.resources.filterLabel}
        </div>
        <div className="flex-1 max-w-xs">
          <Combobox
            id="resource-state-combobox"
            value={selectedState}
            onChange={handleStateChange}
            options={stateOptions}
            placeholder={t.resources.allStates}
          />
        </div>
      </section>

      {/* Error Notice */}
      {error && (
        <div className="border-3 border-risk-high bg-surface p-4 shadow-brutal text-risk-high font-mono text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="border-3 border-ink bg-surface p-8 shadow-brutal text-center font-mono text-sm">
          {t.resources.loading}
        </div>
      )}

      {/* Data display */}
      {!loading && data && (
        <div className="space-y-8">
          {/* State Specific Channel (if matched) */}
          {data.state_channel && (
            <ScrollReveal>
              <section className="border-3 border-ink bg-surface p-6 shadow-brutal space-y-4">
                <div className="border-b-2 border-ink/20 pb-2 flex items-center justify-between">
                  <div className="inline-block bg-accent border-2 border-ink px-2.5 py-0.5 font-mono text-xs font-bold uppercase shadow-brutal-sm">
                    {data.state_channel.state} {t.resources.statePortalBadge}
                  </div>
                  <h2 className="font-heading font-black text-xl text-ink">
                    {t.resources.stateChannelTitle}
                  </h2>
                </div>

                <div className="space-y-3 font-body text-sm">
                  <div>
                    <div className="font-bold text-xs font-mono text-ink/70 uppercase">
                      {t.resources.departmentLabel}
                    </div>
                    <div className="text-base font-semibold text-ink">
                      {data.state_channel.department}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="border-2 border-ink bg-bg p-3 shadow-brutal-sm">
                      <div className="font-bold text-xs font-mono text-ink/70 uppercase">
                        {t.resources.helplineLabel}
                      </div>
                      <div className="font-mono font-bold text-base text-ink pt-0.5">
                        {data.state_channel.helpline}
                      </div>
                    </div>

                    <div className="border-2 border-ink bg-bg p-3 shadow-brutal-sm flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs font-mono text-ink/70 uppercase">
                          {t.resources.portalLabel}
                        </div>
                        <div className="font-mono text-xs text-ink/80 truncate max-w-[200px]">
                          {data.state_channel.portal}
                        </div>
                      </div>
                      <a
                        href={data.state_channel.portal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-press-sm min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3 py-1 border-2 border-ink bg-accent text-ink font-heading font-bold text-xs shadow-brutal-sm"
                      >
                        {t.resources.visitPortal} ↗
                      </a>
                    </div>
                  </div>

                  <div>
                    <div className="font-bold text-xs font-mono text-ink/70 uppercase">
                      {t.resources.headOfficeLabel}
                    </div>
                    <div className="text-ink/90 text-sm">
                      {data.state_channel.head_office}
                    </div>
                  </div>

                  <div className="border-l-3 border-ink pl-3 bg-bg p-2.5">
                    <div className="font-bold text-xs font-mono text-ink/70 uppercase">
                      {t.resources.procedureLabel}
                    </div>
                    <div className="text-ink text-sm leading-relaxed pt-0.5">
                      {data.state_channel.procedure}
                    </div>
                  </div>
                </div>
              </section>
            </ScrollReveal>
          )}

          {/* Central Redressal Portals (Universal) */}
          <ScrollReveal delayMs={50}>
            <section className="space-y-4">
              <h2 className="font-heading font-black text-xl sm:text-2xl text-ink">
                {t.resources.centralPortalsTitle}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.central_portals.map((portal, idx) => (
                  <div
                    key={idx}
                    className="border-3 border-ink bg-surface p-5 shadow-brutal space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <h3 className="font-heading font-bold text-base text-ink leading-snug">
                        {portal.name}
                      </h3>

                      <div className="text-xs text-ink/85 leading-relaxed">
                        <span className="font-bold font-mono">{t.resources.scopeLabel}: </span>
                        {portal.scope}
                      </div>

                      <div className="text-xs text-ink/85 leading-relaxed">
                        <span className="font-bold font-mono">{t.resources.processLabel}: </span>
                        {portal.process}
                      </div>
                    </div>

                    <div className="pt-2 border-t-2 border-ink/20 flex flex-wrap items-center justify-between gap-2">
                      {/* Helpline tap target */}
                      {portal.helpline && (
                        <a
                          href={`tel:${portal.helpline.replace(/[^0-9]/g, "")}`}
                          className="btn-press-sm min-h-[44px] inline-flex items-center px-3.5 py-1.5 border-2 border-ink bg-bg hover:bg-accent/40 text-ink font-mono font-bold text-xs shadow-brutal-sm"
                        >
                          📞 {portal.helpline}
                        </a>
                      )}

                      {/* Portal link tap target */}
                      <a
                        href={portal.portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-press-sm min-h-[44px] inline-flex items-center px-3.5 py-1.5 border-2 border-ink bg-accent text-ink font-heading font-bold text-xs shadow-brutal-sm ml-auto"
                      >
                        {t.resources.visitPortal} ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* Statutory Free Legal Aid Callout */}
          <ScrollReveal delayMs={100}>
            <section className="border-3 border-ink bg-accent p-6 shadow-brutal space-y-3">
              <h3 className="font-heading font-black text-xl text-ink">
                ⚖️ {t.resources.freeLegalAidTitle}
              </h3>
              <p className="font-body text-sm text-ink leading-relaxed">
                {t.resources.freeLegalAidDesc}
              </p>
              <div className="pt-2">
                <a
                  href="tel:15100"
                  className="btn-press min-h-[48px] inline-flex items-center px-6 py-2.5 border-3 border-ink bg-surface text-ink font-heading font-black text-base shadow-brutal"
                >
                  {t.resources.dialNalsaCta}
                </a>
              </div>
            </section>
          </ScrollReveal>
        </div>
      )}
    </div>
  );
};

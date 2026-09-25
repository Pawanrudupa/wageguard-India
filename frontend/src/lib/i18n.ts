/**
 * Minimal i18n scaffold — English/Hindi from day one.
 * See AGENTS.md: never hardcode user-facing strings directly in JSX.
 */

export type Language = "en" | "hi";

export const strings = {
  en: {
    appName: "WageGuard India",
    tagline: "Know your risk. Know your rights.",
    // TODO: add strings as pages are built
  },
  hi: {
    appName: "वेतन रक्षक",
    tagline: "अपना जोखिम जानें। अपने अधिकार जानें।",
    // TODO: add strings as pages are built
  },
} as const;

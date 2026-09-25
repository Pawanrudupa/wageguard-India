/**
 * Comprehensive bilingual i18n layer (English / Hindi) for WageGuard India.
 * Follows AGENTS.md: all user-facing strings must pass through here.
 */

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "hi";

export interface TranslationStrings {
  appName: string;
  tagline: string;
  nav: {
    home: string;
    risk: string;
    rights: string;
    resources: string;
  };
  home: {
    badge: string;
    heroTitle: string;
    heroSubtitle: string;
    checkRiskCta: string;
    askRightsCta: string;
    viewResourcesCta: string;
    howItWorksTitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    dataTransparencyBadge: string;
    trustTitle: string;
    trustDesc: string;
    privacyNotice: string;
  };
  risk: {
    title: string;
    subtitle: string;
    stateLabel: string;
    sectorLabel: string;
    checkButton: string;
    checking: string;
    resultTitle: string;
    riskLevel: string;
    confidenceLevel: string;
    highRisk: string;
    mediumRisk: string;
    lowRisk: string;
    highConfidence: string;
    mediumConfidence: string;
    lowConfidence: string;
    lowConfidenceWarning: string;
    irregularityRate: string;
    irregularityRateUnit: string;
    minWageRate: string;
    dayUnit: string;
    explanationLabel: string;
    askRightsAboutState: string;
    viewStateResources: string;
    selectStatePrompt: string;
    selectSectorPrompt: string;
  };
  rights: {
    title: string;
    subtitle: string;
    inputLabel: string;
    inputPlaceholder: string;
    charCountSuffix: string;
    stateOptionalLabel: string;
    allIndiaLabel: string;
    askButton: string;
    asking: string;
    sampleQueriesLabel: string;
    sample1: string;
    sample2: string;
    sample3: string;
    answerTitle: string;
    groundedBadge: string;
    ungroundedBadge: string;
    citationsTitle: string;
    showCitationDetails: string;
    hideCitationDetails: string;
    validAsOf: string;
    statute: string;
    section: string;
    source: string;
    disclaimerLabel: string;
    nextStepsTitle: string;
    fallbackNotice: string;
    nalsaContact: string;
    shramSuvidhaContact: string;
    callNalsaCta: string;
    shramSuvidhaCta: string;
  };
  resources: {
    title: string;
    subtitle: string;
    filterLabel: string;
    allStates: string;
    loading: string;
    statePortalBadge: string;
    departmentLabel: string;
    centralPortalsTitle: string;
    stateChannelTitle: string;
    helplineLabel: string;
    portalLabel: string;
    headOfficeLabel: string;
    procedureLabel: string;
    scopeLabel: string;
    processLabel: string;
    callNow: string;
    visitPortal: string;
    freeLegalAidTitle: string;
    freeLegalAidDesc: string;
    dialNalsaCta: string;
  };
  footer: {
    nalsaTitle: string;
    callNalsa: string;
    disclaimer: string;
    privacyPledge: string;
    helplineText: string;
    versionNote: string;
    statutoryBasis: string;
  };
}

export const translations: Record<Language, TranslationStrings> = {
  en: {
    appName: "WageGuard India",
    tagline: "Know your risk. Know your rights.",
    nav: {
      home: "Home",
      risk: "Check Risk",
      rights: "Ask Rights",
      resources: "Grievance Channels",
    },
    home: {
      badge: "Labour Rights Navigator • India",
      heroTitle: "Protect Your Hard-Earned Wages.",
      heroSubtitle: "Wage theft affects millions of Indian workers. Check your sector's wage irregularity risk, get grounded answers citing Indian labour laws, and find free government legal aid.",
      checkRiskCta: "Check Sector Risk",
      askRightsCta: "Ask a Rights Question",
      viewResourcesCta: "Find Helpline Contacts",
      howItWorksTitle: "How WageGuard India Protects You",
      step1Title: "1. Know Your Risk",
      step1Desc: "Transparent risk context based on Ministry of Labour inspection and prosecution records across states and sectors.",
      step2Title: "2. Know Your Rights",
      step2Desc: "Grounded legal answers citing the Code on Wages 2019, Minimum Wages Act, and notified state wage rates. Zero hallucinations.",
      step3Title: "3. Take Action",
      step3Desc: "Direct helpline numbers and official complaint procedures for state labour offices, EPFO, and NALSA free legal aid.",
      dataTransparencyBadge: "Data Rigor & Transparency",
      trustTitle: "Defensible, Honest Data",
      trustDesc: "India does not maintain central employer-level wage violation records. WageGuard models sector and state risk honestly without inventing data.",
      privacyNotice: "Privacy Guaranteed: We never store your complaint text, name, or employer name on our servers.",
    },
    risk: {
      title: "Wage Irregularity Risk Context",
      subtitle: "Evaluate historical non-compliance rates for your state and sector based on official government enforcement reports.",
      stateLabel: "Select Your State / UT",
      sectorLabel: "Select Your Work Sector",
      checkButton: "Calculate Risk Context",
      checking: "Evaluating Enforcement Data...",
      resultTitle: "Risk Assessment Result",
      riskLevel: "Risk Level",
      confidenceLevel: "Data Reporting Confidence",
      highRisk: "HIGH RISK",
      mediumRisk: "MEDIUM RISK",
      lowRisk: "LOW RISK",
      highConfidence: "HIGH CONFIDENCE",
      mediumConfidence: "MEDIUM CONFIDENCE",
      lowConfidence: "LOW CONFIDENCE",
      lowConfidenceWarning: "Note: State data is sparse or incomplete in annual Ministry enforcement reports. Predictions carry low statistical confidence.",
      irregularityRate: "Historical Irregularity Rate",
      irregularityRateUnit: "violations / inspection",
      minWageRate: "State Notified Daily Minimum Wage",
      dayUnit: "/day",
      explanationLabel: "Empirical Assessment",
      askRightsAboutState: "Ask Rights Question for this State",
      viewStateResources: "View State Grievance Portals",
      selectStatePrompt: "-- Choose State --",
      selectSectorPrompt: "-- Choose Sector --",
    },
    rights: {
      title: "Grounded Labour Rights Navigator",
      subtitle: "Ask questions about unpaid salary, delayed settlements, minimum wages, or unlawful deductions. Answers are strictly grounded in statutory Indian Acts.",
      inputLabel: "Describe your situation or question:",
      inputPlaceholder: "e.g., Can my employer delay my final settlement after I resign? Or: Can my boss deduct pay for broken tools?",
      charCountSuffix: "characters",
      stateOptionalLabel: "State (optional for local rate checks):",
      allIndiaLabel: "Central / All India",
      askButton: "Ask Legal Assistant",
      asking: "Retrieving Verified Statutory Clauses...",
      sampleQueriesLabel: "Try common questions:",
      sample1: "Can employer delay final settlement after resignation?",
      sample2: "Is my employer allowed to deduct 50% of my salary?",
      sample3: "What is the notified daily minimum wage in Delhi?",
      answerTitle: "Grounded Statutory Explanation",
      groundedBadge: "✓ Statutory Grounded",
      ungroundedBadge: "⚠️ Human Counsel Routing",
      citationsTitle: "Verified Statutory References & Citations",
      showCitationDetails: "Show statutory text & date",
      hideCitationDetails: "Hide details",
      validAsOf: "Valid as of",
      statute: "Statute / Schedule",
      section: "Section / Clause",
      source: "Source Document",
      disclaimerLabel: "MANDATORY LEGAL NOTICE",
      nextStepsTitle: "Recommended Official Next Steps",
      fallbackNotice: "No grounded statutory answer was found in the database. Please contact official legal counsel.",
      nalsaContact: "NALSA 24x7 Free Legal Aid Helpline: Call 15100",
      shramSuvidhaContact: "Ministry of Labour Grievance Portal: shramsuvidha.gov.in",
      callNalsaCta: "📞 Call NALSA 15100 (Free)",
      shramSuvidhaCta: "🔗 Shram Suvidha Portal ↗",
    },
    resources: {
      title: "Government Grievance Channels & Legal Aid",
      subtitle: "Verified telephone helplines, online portals, and district office procedures to recover withheld wages and file official complaints.",
      filterLabel: "Filter by State:",
      allStates: "All States & Central Sphere",
      loading: "Loading verified grievance channels...",
      statePortalBadge: "State Portal",
      departmentLabel: "Department",
      centralPortalsTitle: "National Redressal Mechanisms (All India)",
      stateChannelTitle: "State Labour Commissionerate Contacts",
      helplineLabel: "Toll-Free Helpline",
      portalLabel: "Official Portal",
      headOfficeLabel: "Office Address",
      procedureLabel: "Filing Procedure",
      scopeLabel: "Scope",
      processLabel: "Process",
      callNow: "Call Helpline",
      visitPortal: "Open Portal",
      freeLegalAidTitle: "Statutory Free Legal Aid (NALSA)",
      freeLegalAidDesc: "Under Section 12(h) of the Legal Services Authorities Act, 1987, industrial workers, domestic workers, and low-income citizens are entitled to free court-appointed advocates.",
      dialNalsaCta: "📞 Dial 15100 (24x7 Toll-Free)",
    },
    footer: {
      nalsaTitle: "NALSA National Free Legal Aid Helpline",
      callNalsa: "Call 15100",
      disclaimer: "This platform provides educational legal information, not formal legal advice. Route formal disputes to designated labour authorities.",
      privacyPledge: "Zero PII Persistence: Your questions, personal details, and employer names are never logged or stored server-side.",
      helplineText: "Need emergency legal advice? Call NALSA National Helpline at 15100 (24x7 Toll-Free).",
      versionNote: "WageGuard India (वेतन रक्षक) — v0.1.0",
      statutoryBasis: "Grounded in Code on Wages 2019 & State Labour Gazettes",
    },
  },
  hi: {
    appName: "वेतन रक्षक",
    tagline: "अपना जोखिम जानें। अपने अधिकार जानें।",
    nav: {
      home: "मुख्य पृष्ठ",
      risk: "जोखिम जांचें",
      rights: "अधिकार पूछें",
      resources: "शिकायत चैनल",
    },
    home: {
      badge: "श्रम अधिकार मार्गदर्शक • भारत",
      heroTitle: "अपनी गाढ़ी कमाई और मजदूरी की रक्षा करें।",
      heroSubtitle: "वेतन चोरी से लाखों भारतीय श्रमिक प्रभावित होते हैं। अपने राज्य व क्षेत्र में वेतन अनियमितता का जोखिम जांचें, श्रम कानूनों पर आधारित जवाब पाएं, और मुफ्त सरकारी कानूनी सहायता प्राप्त करें।",
      checkRiskCta: "क्षेत्रीय जोखिम जांचें",
      askRightsCta: "अधिकारों पर सवाल पूछें",
      viewResourcesCta: "हेल्पलाइन नंबर देखें",
      howItWorksTitle: "वेतन रक्षक आपकी सुरक्षा कैसे करता है",
      step1Title: "1. अपना जोखिम समझें",
      step1Desc: "श्रम मंत्रालय के निरीक्षण और अभियोजन रिकॉर्ड के आधार पर पारदर्शी जोखिम विश्लेषण।",
      step2Title: "2. अपने अधिकार जानें",
      step2Desc: "वेतन संहिता 2019, न्यूनतम मजदूरी अधिनियम और राज्य अधिसूचनाओं पर आधारित प्रमाणित कानूनी उत्तर।",
      step3Title: "3. आधिकारिक कदम उठाएं",
      step3Desc: "राज्य श्रम आयुक्त, ईपीएफओ (EPFO), और नालसा (NALSA) मुफ्त कानूनी सहायता के सीधे हेल्पलाइन नंबर।",
      dataTransparencyBadge: "डेटा पारदर्शिता एवं सत्यता",
      trustTitle: "तथ्यपरक और ईमानदार डेटा",
      trustDesc: "भारत में व्यक्तिगत नियोक्ताओं का कोई केंद्रीय रिकॉर्ड नहीं है। वेतन रक्षक बिना किसी मनगढ़ंत आंकड़े के राज्य और क्षेत्र स्तर पर सटीक डेटा प्रस्तुत करता है।",
      privacyNotice: "गोपनीयता की गारंटी: हम आपकी शिकायत, नाम या नियोक्ता का नाम अपने सर्वर पर कभी संग्रहीत नहीं करते।",
    },
    risk: {
      title: "वेतन अनियमितता जोखिम संदर्भ",
      subtitle: "सरकारी निरीक्षण रिपोर्टों के आधार पर अपने राज्य और उद्योग क्षेत्र में वेतन-चोरी के ऐतिहासिक जोखिम का आकलन करें।",
      stateLabel: "अपना राज्य चुनें",
      sectorLabel: "अपना कार्य क्षेत्र (उद्योग) चुनें",
      checkButton: "जोखिम की गणना करें",
      checking: "डेटा का विश्लेषण हो रहा है...",
      resultTitle: "जोखिम मूल्यांकन परिणाम",
      riskLevel: "जोखिम स्तर",
      confidenceLevel: "डेटा रिपोर्टिंग विश्वसनीयता",
      highRisk: "उच्च जोखिम",
      mediumRisk: "मध्यम जोखिम",
      lowRisk: "कम जोखिम",
      highConfidence: "उच्च विश्वसनीयता",
      mediumConfidence: "मध्यम विश्वसनीयता",
      lowConfidence: "निम्न विश्वसनीयता",
      lowConfidenceWarning: "चेतावनी: वार्षिक रिपोर्टों में इस राज्य का डेटा सीमित या अनुपलब्ध है। अनुमानों में सांख्यिकीय अनिश्चितता हो सकती है।",
      irregularityRate: "ऐतिहासिक अनियमितता दर",
      irregularityRateUnit: "उल्लंघन / निरीक्षण",
      minWageRate: "अधिसूचित दैनिक न्यूनतम वेतन",
      dayUnit: "/दिन",
      explanationLabel: "तथ्यात्मक विश्लेषण",
      askRightsAboutState: "इस राज्य के कानूनी अधिकार पूछें",
      viewStateResources: "राज्य के शिकायत पोर्टल देखें",
      selectStatePrompt: "-- राज्य चुनें --",
      selectSectorPrompt: "-- उद्योग क्षेत्र चुनें --",
    },
    rights: {
      title: "कानूनी अधिकार मार्गदर्शक",
      subtitle: "बकाया वेतन, अनुचित कटौती या न्यूनतम वेतन संबंधी प्रश्न पूछें। सभी उत्तर भारतीय श्रम कानूनों पर आधारित हैं।",
      inputLabel: "अपनी स्थिति या प्रश्न लिखें:",
      inputPlaceholder: "उदा. क्या इस्तीफा देने के बाद नियोक्ता मेरा वेतन रोक सकता है? या: क्या नुकसान के नाम पर वेतन काटना वैध है?",
      charCountSuffix: "अक्षर",
      stateOptionalLabel: "राज्य (स्थानीय दरों की जांच के लिए वैकल्पिक):",
      allIndiaLabel: "केंद्रीय / संपूर्ण भारत",
      askButton: "कानूनी सहायक से पूछें",
      asking: "प्रमाणित कानूनी धाराओं की खोज हो रही है...",
      sampleQueriesLabel: "अक्सर पूछे जाने वाले प्रश्न:",
      sample1: "क्या इस्तीफे के बाद नियोक्ता अंतिम वेतन रोक सकता है?",
      sample2: "क्या नियोक्ता 50% से अधिक वेतन काट सकता है?",
      sample3: "दिल्ली में दैनिक न्यूनतम मजदूरी क्या है?",
      answerTitle: "प्रमाणित कानूनी उत्तर",
      groundedBadge: "✓ प्रमाणित कानूनी धाराएं",
      ungroundedBadge: "⚠️ कानूनी सहायता हेतु निर्देशित",
      citationsTitle: "सत्यापित कानूनी संदर्भ और धाराएं",
      showCitationDetails: "विस्तृत विवरण देखें",
      hideCitationDetails: "विवरण छिपाएं",
      validAsOf: "मान्य तिथि",
      statute: "कानून / अनुसूची",
      section: "धारा / नियम",
      source: "स्रोत दस्तावेज",
      disclaimerLabel: "अनिवार्य कानूनी सूचना",
      nextStepsTitle: "अनुशंसित आधिकारिक कदम",
      fallbackNotice: "डेटाबेस में कोई सीधा कानूनी उत्तर नहीं मिला। कृपया आधिकारिक कानूनी सहायता से संपर्क करें।",
      nalsaContact: "नालसा (NALSA) 24x7 मुफ्त कानूनी हेल्पलाइन: 15100 पर कॉल करें",
      shramSuvidhaContact: "श्रम मंत्रालय शिकायत पोर्टल: shramsuvidha.gov.in",
      callNalsaCta: "📞 नालसा 15100 पर कॉल करें (निःशुल्क)",
      shramSuvidhaCta: "🔗 श्रम सुविधा पोर्टल ↗",
    },
    resources: {
      title: "सरकारी शिकायत निवारण और कानूनी सहायता",
      subtitle: "बकाया वेतन वसूली और शिकायत दर्ज करने के लिए सत्यापित हेल्पलाइन नंबर, पोर्टल और जिला कार्यालय।",
      filterLabel: "राज्य के अनुसार फ़िल्टर करें:",
      allStates: "सभी राज्य एवं केंद्रीय क्षेत्र",
      loading: "सत्यापित शिकायत पोर्टल्स लोड हो रहे हैं...",
      statePortalBadge: "राज्य पोर्टल",
      departmentLabel: "विभाग",
      centralPortalsTitle: "राष्ट्रीय शिकायत तंत्र (अखिल भारतीय)",
      stateChannelTitle: "राज्य श्रम आयुक्त कार्यालय संपर्क",
      helplineLabel: "टोल-फ्री हेल्पलाइन",
      portalLabel: "आधिकारिक पोर्टल",
      headOfficeLabel: "मुख्यालय पता",
      procedureLabel: "शिकायत दर्ज करने की प्रक्रिया",
      scopeLabel: "कार्यक्षेत्र",
      processLabel: "शिकायत प्रक्रिया",
      callNow: "हेल्पलाइन पर कॉल करें",
      visitPortal: "पोर्टल खोलें",
      freeLegalAidTitle: "मुफ्त कानूनी सहायता (NALSA)",
      freeLegalAidDesc: "विधिक सेवा प्राधिकरण अधिनियम, 1987 की धारा 12(h) के तहत श्रमिक और असंगठित क्षेत्र के मजदूर पूरी तरह से मुफ्त कानूनी वकील पाने के हकदार हैं।",
      dialNalsaCta: "📞 15100 डायल करें (24x7 टोल-फ्री)",
    },
    footer: {
      nalsaTitle: "नालसा राष्ट्रीय निःशुल्क कानूनी सहायता हेल्पलाइन",
      callNalsa: "15100 पर कॉल करें",
      disclaimer: "यह मंच केवल शैक्षणिक जानकारी प्रदान करता है, कानूनी सलाह नहीं। विवाद समाधान हेतु आधिकारिक श्रम अधिकारियों से संपर्क करें।",
      privacyPledge: "शून्य डेटा संचयन: आपके प्रश्न, व्यक्तिगत विवरण और नियोक्ता का नाम हमारे सर्वर पर कभी सुरक्षित नहीं रखा जाता।",
      helplineText: "तत्काल कानूनी परामर्श चाहिए? नालसा राष्ट्रीय हेल्पलाइन 15100 पर 24x7 कॉल करें।",
      versionNote: "वेतन रक्षक (WageGuard India) — v0.1.0",
      statutoryBasis: "वेतन संहिता 2019 एवं राज्य श्रम राजपत्रों पर आधारित",
    },
  },
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationStrings;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("wageguard_lang");
    return saved === "hi" ? "hi" : "en";
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("wageguard_lang", newLang);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return React.createElement(
    I18nContext.Provider,
    { value: { lang, setLang, t: translations[lang] } },
    children
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};

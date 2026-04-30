// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Rally — Community Operations Platform
//
// This is the single source of truth for your community's brand,
// schedule, socials, and page copy. Edit this file to make the
// app yours — no other files need brand-specific changes.
//
// NOTE: After changing theme colors here, also update the matching
// CSS custom properties in src/app/globals.css
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface RallyEvent {
  name: string;
  shortName: string;
  day: string;
  dayShort: string;
  time: string;
  timeSplit: { value: string; period: string };
  timeOfDay: "morning" | "evening";
  location: string;
  locationShort: string;
  mapUrl: string;
  distance: string;
  distanceShort: string;
  description: string;
}

export interface RallyCreator {
  id: string;
  label: string;
  color: string;
}

export interface RallySocial {
  handle: string;
  url: string;
}

export interface RallyHeroImage {
  src: string;
  alt: string;
  position: string;
}

export interface RallyConfig {
  // ─── Identity ───
  name: string;
  fullName: string;
  legalName: string;
  shortName: string;
  tagline: string;
  location: string;
  email: string;
  url: string;

  // ─── Terminology ───
  terms: {
    community: string;
    member: string;
    memberSingular: string;
    greeting: string;
    welcome: string;
    cta: string;
  };

  // ─── Team ───
  founders: { name: string; role: string }[];
  creators: RallyCreator[];

  // ─── Recurring Events ───
  events: RallyEvent[];

  // ─── Social Platforms ───
  socials: {
    instagram: RallySocial;
    tiktok: RallySocial;
    strava: RallySocial;
  };
  scrapeHandles: {
    instagram: string;
    tiktok: string;
  };

  // ─── Design ───
  theme: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    accentLight: string;
    accentMuted: string;
    gold: string;
    background: string;
  };
  heroImages: RallyHeroImage[];

  // ─── Page Copy ───
  joinPage: {
    heroSubtitle: string;
    eventsIntro: string;
    ctaHeading: string;
    ctaBody: string;
    ctaButtonText: string;
    ctaSecondaryText: string;
    emailCaptureLabel: string;
    successMessage: string;
  };
  checkin: {
    welcomeMessage: string;
    privacyNotice: string;
    localStorageKey: string;
  };
  report: {
    defaultLocation: string;
  };
  authErrors: {
    unauthorized: { heading: string; body: string };
    default: { heading: string; body: string };
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Más Millas Run Club 🌵 — Fort Worth, TX
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config: RallyConfig = {
  name: "más millas",
  fullName: "Más Millas Run Club",
  legalName: "Más Millas Run Club",
  shortName: "MMRC",
  tagline: "more smiles",
  location: "Fort Worth, Texas",
  email: "hello@masmillasrunclub.com",
  url: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",

  terms: {
    community: "la comunidad",
    member: "runners",
    memberSingular: "runner",
    greeting: "Welcome back",
    welcome: "everyone's welcome",
    cta: "come run with us",
  },

  founders: [
    { name: "Bri", role: "Co-Founder" },
    { name: "JM", role: "Co-Founder" },
    { name: "Abel", role: "Co-Founder" },
  ],

  creators: [
    { id: "bri", label: "Bri", color: "#e2b808" },
    { id: "jm", label: "JM", color: "#29741d" },
    { id: "abel", label: "Abel", color: "#8cb561" },
  ],

  events: [
    {
      name: "Tuesday Night Run",
      shortName: "Night Run",
      day: "Tuesday",
      dayShort: "Tue",
      time: "7:30 PM",
      timeSplit: { value: "7:30", period: "PM" },
      timeOfDay: "evening",
      location: "501 Oakhurst Scenic Dr, Fort Worth, TX 76111",
      locationShort: "Riverside Park",
      mapUrl: "https://maps.apple.com/?q=Riverside+Park&address=501+Oakhurst+Scenic+Dr,+Fort+Worth,+TX+76111",
      distance: "3 miles",
      distanceShort: "3 mi \u00b7 Riverside Park",
      description: "",
    },
  ],

  socials: {
    instagram: {
      handle: "@masmillasrunclub",
      url: "https://instagram.com/masmillasrunclub",
    },
    tiktok: {
      handle: "@masmillasrunclub",
      url: "https://tiktok.com/@masmillasrunclub",
    },
    strava: {
      handle: "Más Millas Run Club",
      url: "https://strava.app.link/qlm3aZfWk2b",
    },
  },

  scrapeHandles: {
    instagram: "masmillasrunclub",
    tiktok: "masmillasrunclub",
  },

  // ─── Official MMRC palette ───
  // Forest green + gold drawn from the official brand color
  // sheet. Warm cream background keeps the Texas-sun feeling
  // without competing with the mascot's greens.
  theme: {
    primary: "#29741d",        // forest green
    primaryLight: "#8cb561",   // sage green
    primaryDark: "#1d5c14",    // deep forest
    accent: "#e2b808",         // gold
    accentLight: "#f4cd0b",    // bright yellow
    accentMuted: "#fdeb9e",    // cream yellow
    gold: "#f4cd0b",           // vibrant gold
    background: "#FDFBF4",     // warm cream
  },

  heroImages: [],

  joinPage: {
    heroSubtitle: "everyone's welcome \u00b7 come run with us",
    eventsIntro:
      "One run a week at Riverside Park. All paces, all faces.",
    ctaHeading: "come run with us",
    ctaBody: "",
    ctaButtonText: "follow along",
    ctaSecondaryText: "learn more",
    emailCaptureLabel: "Stay in the loop",
    successMessage: "you're in. más millas.",
  },

  checkin: {
    welcomeMessage: "Bienvenidos a la comunidad",
    privacyNotice:
      "Your info is only used by Más Millas Run Club to keep you in the loop.",
    localStorageKey: "masmillas-checkin",
  },

  report: {
    defaultLocation: "Fort Worth, TX",
  },

  authErrors: {
    unauthorized: {
      heading: "not on the team yet",
      body: "this google account isn't part of the team. if you think it should be, reach out to bri or jm.",
    },
    default: {
      heading: "something went wrong",
      body: "we hit an unexpected bump. try signing in again — if it keeps happening, let us know.",
    },
  },
};

export default config;

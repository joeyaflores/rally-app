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
  appleIconLetter: string;
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
// YOUR CONFIG — Edit everything below
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config: RallyConfig = {
  // ─── Identity ───
  // Your community's name as it appears across the app.
  name: "your community",
  fullName: "Your Community Run Club",
  legalName: "Your Community LLC",
  shortName: "YC",
  tagline: "your tagline here",
  location: "Your City, State",
  email: "hello@yourcommunity.com",
  url: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",

  // ─── Terminology ───
  // How you refer to your community and its members.
  // These terms appear in headings, labels, and greetings throughout the app.
  terms: {
    community: "the crew",             // section heading for your platforms
    member: "members",                 // plural: "42 members showed up"
    memberSingular: "member",          // singular: "new member"
    greeting: "welcome",               // post-checkin: "welcome, alex"
    welcome: "all paces welcome",      // hero subtitle
    cta: "just show up",               // CTA heading
  },

  // ─── Team ───
  founders: [
    { name: "Your Name", role: "Founder" },
  ],

  // ─── Content Creators ───
  // People who create content for the calendar. Each gets a color dot.
  creators: [
    { id: "you", label: "You", color: "#3B82F6" },
  ],

  // ─── Recurring Events ───
  // Your regular meetups. These drive the /join page schedule and the
  // weekly runs widget on the dashboard.
  events: [
    {
      name: "Tuesday Group Run",
      shortName: "Group Run",
      day: "Tuesday",
      dayShort: "Tue",
      time: "6:00 PM",
      timeSplit: { value: "6:00", period: "PM" },
      timeOfDay: "evening",
      location: "123 Main Street, Your City, ST",
      locationShort: "123 Main St",
      mapUrl: "https://maps.apple.com/?address=123+Main+St,+Your+City,+ST",
      distance: "3 miles",
      distanceShort: "3 mi",
      description:
        "An easy weeknight run. All paces, all welcome.",
    },
    {
      name: "Saturday Long Run",
      shortName: "Long Run",
      day: "Saturday",
      dayShort: "Sat",
      time: "7:00 AM",
      timeSplit: { value: "7:00", period: "AM" },
      timeOfDay: "morning",
      location: "456 Park Avenue, Your City, ST",
      locationShort: "456 Park Ave",
      mapUrl: "https://maps.apple.com/?address=456+Park+Ave,+Your+City,+ST",
      distance: "5 miles",
      distanceShort: "5 mi",
      description:
        "Start the weekend with some miles. Longer distance, same energy.",
    },
  ],

  // ─── Social Platforms ───
  socials: {
    instagram: {
      handle: "@yourcommunity",
      url: "https://instagram.com/yourcommunity",
    },
    tiktok: {
      handle: "@yourcommunity",
      url: "https://tiktok.com/@yourcommunity",
    },
    strava: {
      handle: "Your Community Run Club",
      url: "https://strava.com/clubs/yourcommunity",
    },
  },

  // Handles used by the Apify scraper (without @)
  scrapeHandles: {
    instagram: "yourcommunity",
    tiktok: "yourcommunity",
  },

  // ─── Design ───
  // Primary color palette. After changing these, also update the matching
  // CSS custom properties in src/app/globals.css (see comments there).
  theme: {
    primary: "#132C83",        // main brand color (navy)
    primaryLight: "#1E3FA0",
    primaryDark: "#0D1F5C",
    accent: "#FF6B35",         // warm accent
    accentLight: "#FF8A5C",
    accentMuted: "#FFF0EA",
    gold: "#FFB347",
    background: "#F6F7FB",     // page background
  },

  // The letter shown in the generated Apple touch icon
  appleIconLetter: "R",

  // Hero slideshow images on the /join page.
  // Replace these files in /public with your own photos.
  heroImages: [
    {
      src: "/hero-big-group.webp",
      alt: "Community group photo",
      position: "center 65%",
    },
    {
      src: "/hero-post-race.webp",
      alt: "Celebrating together",
      position: "center 35%",
    },
    {
      src: "/hero-cheer-zone.webp",
      alt: "Cheering each other on",
      position: "center center",
    },
  ],

  // ─── Page Copy ───
  joinPage: {
    heroSubtitle: "all paces welcome \u00b7 just show up",
    eventsIntro: "We run together every week. Pick a day or show up to both.",
    ctaHeading: "just show up",
    ctaBody: "No sign-up, no membership fee. Find us at the meetup spot and we'll take it from there.",
    ctaButtonText: "follow along",
    ctaSecondaryText: "learn more",
    emailCaptureLabel: "Stay in the loop",
    successMessage: "you're in. welcome.",
  },

  checkin: {
    welcomeMessage: "welcome to the crew",
    privacyNotice: "Your info is only used to keep you in the loop. We'll never share it.",
    localStorageKey: "rally-checkin",
  },

  report: {
    defaultLocation: "Your City, ST",
  },

  authErrors: {
    unauthorized: {
      heading: "not on the team yet",
      body: "this google account isn't part of the team. if you think it should be, reach out to an admin.",
    },
    default: {
      heading: "something went wrong",
      body: "we hit an unexpected bump. try signing in again.",
    },
  },
};

export default config;

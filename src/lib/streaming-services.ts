// This file contains only client-safe data about streaming services

// Default placeholder for streaming service logos
const placeholderLogo = "/images/streaming/placeholder.svg";

export type StreamingService = {
  name: string;
  logo: string;
  url: string;
};

export const streamingServices: Record<string, StreamingService> = {
  // Global streaming services
  netflix: {
    name: "Netflix",
    logo: placeholderLogo,
    url: "https://www.netflix.com/",
  },
  prime: {
    name: "Amazon Prime",
    logo: placeholderLogo,
    url: "https://www.primevideo.com/",
  },
  disney: {
    name: "Disney+ Hotstar",
    logo: placeholderLogo,
    url: "https://www.hotstar.com/",
  },
  apple: {
    name: "Apple TV+",
    logo: placeholderLogo,
    url: "https://tv.apple.com/",
  },

  // Indian streaming services
  hotstar: {
    name: "Hotstar",
    logo: placeholderLogo,
    url: "https://www.hotstar.com/",
  },
  sonyliv: {
    name: "SonyLIV",
    logo: placeholderLogo,
    url: "https://www.sonyliv.com/",
  },
  zee5: {
    name: "ZEE5",
    logo: placeholderLogo,
    url: "https://www.zee5.com/",
  },
  jiocinema: {
    name: "JioCinema",
    logo: placeholderLogo,
    url: "https://www.jiocinema.com/",
  },
  mxplayer: {
    name: "MX Player",
    logo: placeholderLogo,
    url: "https://www.mxplayer.in/",
  },
  voot: {
    name: "Voot",
    logo: placeholderLogo,
    url: "https://www.voot.com/",
  },
  altbalaji: {
    name: "ALTBalaji",
    logo: placeholderLogo,
    url: "https://www.altbalaji.com/",
  },

  // Other international services available in India
  mubi: {
    name: "MUBI",
    logo: placeholderLogo,
    url: "https://mubi.com/",
  },

  // US services (kept for compatibility)
  hbo: {
    name: "HBO Max",
    logo: placeholderLogo,
    url: "https://www.hbomax.com/",
  },
  hulu: {
    name: "Hulu",
    logo: placeholderLogo,
    url: "https://www.hulu.com/",
  },
  paramount: {
    name: "Paramount+",
    logo: placeholderLogo,
    url: "https://www.paramountplus.com/",
  },
  peacock: {
    name: "Peacock",
    logo: placeholderLogo,
    url: "https://www.peacocktv.com/",
  },
};

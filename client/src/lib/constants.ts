export const CATEGORIES = [
  "All",
  "Image",
  "Video",
  "Music",
  "GIF",
  "Anime",
  "Events",
  "Shorts films",
  "Podcasts",
  "Books",
  "Onchain",
];

export const CATEGORY_ICONS = {
  All: "🌐",
  Image: "🖼️",
  Video: "🎥",
  Music: "🎵",
  GIF: "🎞️",
  Anime: "🌸",
  Events: "📅",
  "Shorts films": "🎬",
  Podcasts: "🎧",
  Books: "📚",
  Deployed: "🚀",
} as const;

export const SHORTS_CATEGORIES = [
  "For you",
  "Following",
  "Music",
  "Gaming",
  "Comedy",
  "Sports",
  "Dance",
  "Food",
  "Travel",
  "Art",
  "Fashion",
  "Pop Culture",
  "GenZ",
  "Skits",
  "Pets",
] as const;

export const MOBILE_BREAKPOINT = 768;

export const ROUTES = {
  HOME: "/",
  FEED: "/feed",
  PROFILE: "/profile",
  NOTIFICATIONS: "/notifications",
  ACTIVITIES: "/activities",
  CHANNELS: "/channels",
  CONTENT_COINS: "/content-coins",
  CREATORS: "/creators",
  CREATE_CONTENT_COIN: "/create-content-coin",
  CREATE_PAD: "/create-pad",
  ADMIN: "/admin",
  FAQ: "/faq",
  DOC: "/doc",
  MUSIC: "/music",
  LIBRARY: "/library",
  HISTORY: "/history",
  LIKED_VIDEOS: "/liked-videos",
  WATCH_LATER: "/watch-later",
  SUBSCRIPTIONS: "/subscriptions",
  LEADERBOARD: "/leaderboard",
  CONTENT_IMPORT: "/content-import",
  TOKENIZE: "/tokenize",
  SEARCH: "/search",
} as const;

export const formatViewCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export const formatTimeAgo = (date: Date | string | null): string => {
  if (!date) return "Unknown";

  const now = new Date();
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "Unknown";

  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 2419200) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 29030400) {
    const months = Math.floor(diffInSeconds / 2419200);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  } else {
    const years = Math.floor(diffInSeconds / 29030400);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  }
};
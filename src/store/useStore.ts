import { create } from "zustand";
import type { NativeLang, PracticeAttempt, Profile, ReviewItem, ReviewRating, Settings } from "@/types";
import * as db from "@/db/idb";
import {
  applySM2,
  createReviewItem,
  masteryFromRepetitions,
  todayISO,
  daysBetween,
} from "@/utils/sm2";

const PROFILE_KEY = "hanziflow.profile";
const SETTINGS_KEY = "hanziflow.settings";

const DEFAULT_SETTINGS: Settings = {
  nativeLang: "en",
  speechEnabled: true,
  evalMode: "trace",
  aiProvider: "auto",
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    /* 忽略损坏的本地设置 */
  }
  return DEFAULT_SETTINGS;
}

function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw) as Profile;
  } catch {
    /* 忽略损坏的档案 */
  }
  return null;
}

function saveProfile(p: Profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    /* 忽略写入失败 */
  }
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* 忽略写入失败 */
  }
}

function newProfile(lang: NativeLang): Profile {
  return {
    id: crypto.randomUUID?.() ?? String(Date.now()),
    nativeLang: lang,
    streakDays: 0,
    totalPracticed: 0,
    createdAt: todayISO(),
  };
}

function isDueDate(dueDate: string): boolean {
  return dueDate <= todayISO();
}

interface AppState {
  ready: boolean;
  profile: Profile;
  settings: Settings;
  reviewItems: Record<string, ReviewItem>;
  attempts: PracticeAttempt[];
  /** 首次进入时初始化本机档案与复习数据 */
  init: () => Promise<void>;
  setNativeLang: (lang: NativeLang) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  /** 确保某字已有复习条目（学习新字时调用） */
  ensureItem: (char: string) => ReviewItem;
  /** 用「认识/模糊/忘记」回馈某字，驱动 SM-2 更新 */
  rateChar: (char: string, rating: ReviewRating) => void;
  recordAttempt: (char: string, mode: PracticeAttempt["mode"], score: number) => void;
  dueItems: () => ReviewItem[];
  resetAll: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  ready: false,
  profile: null as unknown as Profile,
  settings: DEFAULT_SETTINGS,
  reviewItems: {},
  attempts: [],

  init: async () => {
    if (get().ready) return;
    const settings = loadSettings();
    const profile = loadProfile() ?? newProfile(settings.nativeLang);
    if (!loadProfile()) saveProfile(profile);

    const [items, attempts] = await Promise.all([db.getAllReviewItems(), db.getAllAttempts()]);
    const map: Record<string, ReviewItem> = {};
    for (const it of items) map[it.char] = it;

    set({ ready: true, settings, profile, reviewItems: map, attempts });
  },

  setNativeLang: (lang) => {
    const settings = { ...get().settings, nativeLang: lang };
    const profile = { ...get().profile, nativeLang: lang };
    saveSettings(settings);
    saveProfile(profile);
    set({ settings, profile });
  },

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    saveSettings(settings);
    set({ settings });
  },

  ensureItem: (char) => {
    const existing = get().reviewItems[char];
    if (existing) return existing;
    const item = createReviewItem(char);
    const next = { ...get().reviewItems, [char]: item };
    set({ reviewItems: next });
    void db.putReviewItem(item);
    return item;
  },

  rateChar: (char, rating) => {
    const current = get().reviewItems[char] ?? createReviewItem(char);
    const next = applySM2(current, rating);
    const item: ReviewItem = {
      ...next,
      char,
      lastRating: rating,
      lastReviewed: todayISO(),
      reviews: current.reviews + 1,
      mastery: masteryFromRepetitions(next.repetitions),
    };
    set({ reviewItems: { ...get().reviewItems, [char]: item } });
    void db.putReviewItem(item);
  },

  recordAttempt: (char, mode, score) => {
    const attempt: PracticeAttempt = {
      id: crypto.randomUUID?.() ?? `${char}-${Date.now()}`,
      char,
      mode,
      score,
      createdAt: new Date().toISOString(),
    };
    set({ attempts: [...get().attempts, attempt] });
    void db.putAttempt(attempt);

    const profile = get().profile;
    const today = todayISO();
    let streakDays = profile.streakDays;
    if (profile.lastPracticeDate !== today) {
      const gap = profile.lastPracticeDate ? daysBetween(profile.lastPracticeDate, today) : Infinity;
      streakDays = gap === 1 ? profile.streakDays + 1 : 1;
    }
    const nextProfile: Profile = {
      ...profile,
      streakDays,
      totalPracticed: profile.totalPracticed + 1,
      lastPracticeDate: today,
    };
    saveProfile(nextProfile);
    set({ profile: nextProfile });
    get().ensureItem(char);
  },

  dueItems: () => Object.values(get().reviewItems).filter((it) => isDueDate(it.dueDate)),

  resetAll: async () => {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    await db.clearAll();
    set({ ready: false, reviewItems: {}, attempts: [] });
    await get().init();
  },
}));

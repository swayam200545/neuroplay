import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LEVELS, ACHIEVEMENTS, GAMES } from "../constants/theme";

const STORAGE_KEY = "neuroplay_data";

const getToday = () => new Date().toISOString().split("T")[0];

const getLevelInfo = (xp) => {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || null;
      break;
    }
  }
  return { currentLevel, nextLevel };
};

const getUnlockedGameIds = (xp) => {
  const { currentLevel } = getLevelInfo(xp);
  return GAMES.filter((g) => g.unlockLevel <= currentLevel.level).map(
    (g) => g.id,
  );
};

const allGameIds = GAMES.map((g) => g.id);

const defaultScores = {};
const defaultBestScores = {};
allGameIds.forEach((id) => {
  defaultScores[id] = [];
  defaultBestScores[id] = null;
});

const defaultState = {
  xp: 0,
  streak: 0,
  lastPlayedDate: null,
  totalGamesPlayed: 0,
  todayGamesPlayed: [],
  unlockedAchievements: [],
  scores: defaultScores,
  bestScores: defaultBestScores,
  dailyHistory: [],
  userName: "",
  // Which games were unlocked at last check — to detect newly unlocked ones
  previouslyUnlockedGameIds: [
    "memory-match",
    "reaction-test",
    "focus-filter",
    "hex-direction",
    "pattern-repeat",
    "number-recall",
    "logic-puzzle",
  ],
  // Games that just unlocked — shown in celebration modal
  newlyUnlockedGames: [],
  weeklyTestHistory: [], // [{ date, overallScore, memory, speed, focus, logic }]
  lastWeeklyTestDate: null,
  hydrated: false,
};

const useGameStore = create((set, get) => ({
  ...defaultState,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        const today = getToday();
        const todayGamesPlayed =
          data.lastPlayedDate === today ? data.todayGamesPlayed || [] : [];
        // Merge scores/bestScores with defaults so new games have empty arrays
        const scores = { ...defaultScores, ...(data.scores || {}) };
        const bestScores = { ...defaultBestScores, ...(data.bestScores || {}) };
        set({
          ...data,
          scores,
          bestScores,
          todayGamesPlayed,
          newlyUnlockedGames: [],
          hydrated: true,
        });
      } else {
        set({ hydrated: true });
      }
    } catch (e) {
      console.error("Failed to hydrate game store:", e);
      set({ hydrated: true });
    }
  },

  persist: async () => {
    try {
      const state = get();
      const toSave = { ...state };
      // Remove non-serialisable keys
      const fnKeys = [
        "hydrated",
        "persist",
        "hydrate",
        "addXP",
        "recordGameResult",
        "checkAchievements",
        "resetProgress",
        "getLevelInfo",
        "getTodayProgress",
        "getSkillScores",
        "getUnlockedGames",
        "dismissUnlockCelebration",
        "canTakeWeeklyTest",
        "recordWeeklyTest",
        "setUserName",
      ];
      fnKeys.forEach((k) => delete toSave[k]);
      // Don't persist transient celebration list
      toSave.newlyUnlockedGames = [];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error("Failed to persist game store:", e);
    }
  },

  recordGameResult: (gameId, score, xpEarned) => {
    const today = getToday();
    set((state) => {
      const newScores = { ...state.scores };
      const gameScores = [...(newScores[gameId] || [])];
      gameScores.push({ score, date: today, xp: xpEarned });
      if (gameScores.length > 50) gameScores.shift();
      newScores[gameId] = gameScores;

      const newBest = { ...state.bestScores };
      const currentBest = newBest[gameId];
      if (gameId === "reaction-test") {
        if (currentBest === null || score < currentBest)
          newBest[gameId] = score;
      } else {
        if (currentBest === null || score > currentBest)
          newBest[gameId] = score;
      }

      const isNewDay = state.lastPlayedDate !== today;
      let newStreak = state.streak;
      if (isNewDay) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        if (state.lastPlayedDate === yesterdayStr) {
          newStreak = state.streak + 1;
        } else {
          newStreak = 1;
        }
      }

      const todayGamesPlayed = isNewDay
        ? [gameId]
        : [...state.todayGamesPlayed, gameId];

      const dailyHistory = [...state.dailyHistory];
      const todayEntry = dailyHistory.find((d) => d.date === today);
      if (todayEntry) {
        todayEntry.xp += xpEarned;
        todayEntry.games += 1;
      } else {
        dailyHistory.push({ date: today, xp: xpEarned, games: 1 });
      }
      if (dailyHistory.length > 30) dailyHistory.shift();

      const newXP = state.xp + xpEarned;

      // Check for newly unlocked games
      const prevUnlocked = state.previouslyUnlockedGameIds || [];
      const nowUnlocked = getUnlockedGameIds(newXP);
      const justUnlocked = nowUnlocked.filter(
        (id) => !prevUnlocked.includes(id),
      );
      const newlyUnlockedGames = justUnlocked
        .map((id) => GAMES.find((g) => g.id === id))
        .filter(Boolean);

      return {
        scores: newScores,
        bestScores: newBest,
        xp: newXP,
        streak: newStreak,
        lastPlayedDate: today,
        totalGamesPlayed: state.totalGamesPlayed + 1,
        todayGamesPlayed,
        dailyHistory,
        previouslyUnlockedGameIds: nowUnlocked,
        newlyUnlockedGames,
      };
    });
    get().checkAchievements();
    get().persist();
  },

  dismissUnlockCelebration: () => {
    set({ newlyUnlockedGames: [] });
  },

  setUserName: (name) => {
    set({ userName: name });
    get().persist();
  },

  checkAchievements: () => {
    const state = get();
    const newUnlocked = [...state.unlockedAchievements];
    let bonusXP = 0;

    const tryUnlock = (id) => {
      if (!newUnlocked.includes(id)) {
        const achievement = ACHIEVEMENTS.find((a) => a.id === id);
        if (achievement) {
          newUnlocked.push(id);
          bonusXP += achievement.xpReward;
        }
      }
    };

    const lv = getLevelInfo(state.xp).currentLevel.level;
    const bs = state.bestScores;

    // ── Tier 1 ──────────────────────────────────────────────────
    if (state.totalGamesPlayed >= 1) tryUnlock("first_game");
    if (state.totalGamesPlayed >= 10) tryUnlock("games_10");
    if (state.totalGamesPlayed >= 50) tryUnlock("games_50");
    if (state.totalGamesPlayed >= 100) tryUnlock("games_100");
    if (state.streak >= 3) tryUnlock("streak_3");
    if (state.streak >= 7) tryUnlock("streak_7");
    if (state.streak >= 30) tryUnlock("streak_30");
    if (lv >= 5) tryUnlock("level_5");
    if (lv >= 10) tryUnlock("level_10");
    if (lv >= 5) tryUnlock("unlock_speed_math");
    if (lv >= 7) tryUnlock("unlock_color_word");
    if (lv >= 10) tryUnlock("unlock_word_flash");
    if (lv >= 15) tryUnlock("unlock_sequence_iq");
    if (bs["pattern-repeat"] !== null && bs["pattern-repeat"] >= 10)
      tryUnlock("pattern_10");
    if (bs["reaction-test"] !== null && bs["reaction-test"] <= 199)
      tryUnlock("fast_reaction");

    // ── Tier 2 ──────────────────────────────────────────────────
    if (state.totalGamesPlayed >= 250) tryUnlock("games_250");
    if (state.streak >= 14) tryUnlock("streak_14");
    if (lv >= 15) tryUnlock("level_15");
    if (state.xp >= 5000) tryUnlock("xp_5000");
    if (bs["reaction-test"] !== null && bs["reaction-test"] <= 149)
      tryUnlock("reaction_150");
    if (bs["pattern-repeat"] !== null && bs["pattern-repeat"] >= 15)
      tryUnlock("pattern_15");
    if (bs["speed-math"] !== null && bs["speed-math"] >= 15)
      tryUnlock("speed_math_15");

    // all_games_played: every game has at least 1 entry
    const allPlayed = GAMES.every((g) => (state.scores[g.id] || []).length > 0);
    if (allPlayed) tryUnlock("all_games_played");

    // ── Tier 3 ──────────────────────────────────────────────────
    if (state.totalGamesPlayed >= 500) tryUnlock("games_500");
    if (state.streak >= 60) tryUnlock("streak_60");
    if (lv >= 20) tryUnlock("level_20");
    if (state.xp >= 25000) tryUnlock("xp_25000");
    if (bs["reaction-test"] !== null && bs["reaction-test"] <= 99)
      tryUnlock("reaction_100");
    if (bs["speed-math"] !== null && bs["speed-math"] >= 25)
      tryUnlock("speed_math_25");
    if (bs["color-word"] !== null && bs["color-word"] >= 20)
      tryUnlock("color_word_20");
    if (bs["word-flash"] !== null && bs["word-flash"] >= 12)
      tryUnlock("word_flash_12");
    if (lv >= 20) tryUnlock("unlock_dual_task");
    if (lv >= 25) tryUnlock("unlock_mental_math");
    if (lv >= 30) tryUnlock("unlock_matrix_iq");

    // ── Tier 4 ──────────────────────────────────────────────────
    if (state.totalGamesPlayed >= 1000) tryUnlock("games_1000");
    if (state.totalGamesPlayed >= 2500) tryUnlock("games_2500");
    if (state.streak >= 100) tryUnlock("streak_100");
    if (lv >= 30) tryUnlock("level_30");
    if (lv >= 40) tryUnlock("level_40");
    if (lv >= 50) tryUnlock("level_50");
    if (state.xp >= 50000) tryUnlock("xp_50000");
    if (bs["reaction-test"] !== null && bs["reaction-test"] <= 79)
      tryUnlock("reaction_80");
    if (bs["speed-math"] !== null && bs["speed-math"] >= 35)
      tryUnlock("speed_math_35");
    if (bs["sequence-iq"] !== null && bs["sequence-iq"] >= 15)
      tryUnlock("sequence_15");
    if (bs["dual-task"] !== null && bs["dual-task"] >= 80)
      tryUnlock("dual_task_80");
    if (bs["matrix-iq"] !== null && bs["matrix-iq"] >= 10)
      tryUnlock("matrix_iq_10");
    if (bs["chaos-math"] !== null && bs["chaos-math"] >= 20)
      tryUnlock("chaos_math_20");
    if (bs["brain-storm"] !== null && bs["brain-storm"] >= 300)
      tryUnlock("brain_storm_300");
    if (bs["neural-nexus"] !== null && bs["neural-nexus"] >= 500)
      tryUnlock("neural_nexus_500");
    if (lv >= 35) tryUnlock("unlock_chaos_math");
    if (lv >= 40) tryUnlock("unlock_speed_mem");
    if (lv >= 45) tryUnlock("unlock_brain_storm");
    if (lv >= 50) tryUnlock("unlock_neural_nexus");

    // all_best_scores: every game has a non-null best score
    const allBest = GAMES.every(
      (g) => bs[g.id] !== null && bs[g.id] !== undefined,
    );
    if (allBest) tryUnlock("all_best_scores");

    if (newUnlocked.length !== state.unlockedAchievements.length) {
      set({ unlockedAchievements: newUnlocked, xp: state.xp + bonusXP });
      get().persist();
    }
  },

  getLevelInfo: () => {
    const { xp } = get();
    return getLevelInfo(xp);
  },

  getUnlockedGames: () => {
    const { xp } = get();
    const unlockedIds = getUnlockedGameIds(xp);
    return GAMES.map((g) => ({ ...g, isUnlocked: unlockedIds.includes(g.id) }));
  },

  getTodayProgress: () => {
    const state = get();
    const today = getToday();
    const isToday = state.lastPlayedDate === today;
    return {
      gamesPlayed: isToday ? state.todayGamesPlayed.length : 0,
      gamesTarget: 5,
      completed: isToday && state.todayGamesPlayed.length >= 5,
    };
  },

  getSkillScores: () => {
    const state = get();
    const getAvg = (gameId, count = 5) => {
      const s = state.scores[gameId] || [];
      if (s.length === 0) return 0;
      const recent = s.slice(-count);
      return Math.round(
        recent.reduce((sum, r) => sum + r.score, 0) / recent.length,
      );
    };
    return {
      memory: getAvg("memory-match"),
      speed: getAvg("reaction-test"),
      focus: getAvg("focus-filter"),
      logic: getAvg("logic-puzzle"),
      pattern: getAvg("pattern-repeat"),
      recall: getAvg("number-recall"),
    };
  },

  canTakeWeeklyTest: () => {
    const { lastWeeklyTestDate } = get();
    if (!lastWeeklyTestDate) return true;
    const last = new Date(lastWeeklyTestDate);
    const now = new Date();
    const diffDays = (now - last) / (1000 * 60 * 60 * 24);
    return diffDays >= 7;
  },

  recordWeeklyTest: (result) => {
    const today = getToday();
    set((state) => {
      const history = [...state.weeklyTestHistory, { ...result, date: today }];
      if (history.length > 12) history.shift();
      return { weeklyTestHistory: history, lastWeeklyTestDate: today };
    });
    get().persist();
  },

  resetProgress: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ ...defaultState, hydrated: true });
  },
}));

export default useGameStore;
export { getLevelInfo };

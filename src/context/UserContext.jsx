import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, localToday, computeStats, invalidateUsersCache } from '../utils';
import { BINGO } from '../constants';

const UserContext = createContext(null);

/* ── URL ↔ screen mapping ── */
const SCREEN_PATHS = {
  home: "/", log: "/log", profile: "/profile", bingo: "/bingo",
  team: "/team", challenges: "/challenges", history: "/history",
};
const PATH_SCREENS = Object.fromEntries(
  Object.entries(SCREEN_PATHS).map(([s, p]) => [p, s])
);
function screenFromPath() {
  return PATH_SCREENS[window.location.pathname] || "home";
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [screen, setScreenState] = useState(screenFromPath);
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(true);
  const [seasonStart, setSeasonStart] = useState(null);

  /* ── Auto-login from localStorage ── */
  useEffect(() => {
    const saved = localStorage.getItem("hogalid_session");
    if (saved) {
      try {
        const { alias, password } = JSON.parse(saved);
        apiPost("/users?action=login", { alias, password })
          .then(u => setUser(u))
          .catch(() => localStorage.removeItem("hogalid_session"))
          .finally(() => setAutoLoading(false));
      } catch {
        localStorage.removeItem("hogalid_session");
        setAutoLoading(false);
      }
    } else {
      setAutoLoading(false);
    }
  }, []);

  useEffect(() => {
    apiGet("/users?action=config")
      .then(data => setSeasonStart(data.seasonStart))
      .catch(() => {});
  }, []);

  /* ── Screen ↔ URL sync ── */
  const setScreen = useCallback((newScreen) => {
    setScreenState(newScreen);
    const path = SCREEN_PATHS[newScreen] || "/";
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
  }, []);

  useEffect(() => {
    function onPopState() { setScreenState(screenFromPath()); }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const stats = useMemo(() => {
    if (!user || user.isAdmin) return null;
    return computeStats(user);
  }, [user]);

  function handleLogin(u, credentials) {
    if (credentials) {
      localStorage.setItem("hogalid_session", JSON.stringify(credentials));
    }
    setUser(u);
    setScreen("home");
  }

  function handleLogout() {
    localStorage.removeItem("hogalid_session");
    setUser(null);
    setScreen("home");
  }

  async function handleSaveLog(log, newHighscores) {
    setLoading(true);
    try {
      await apiPost("/users?action=addlog", { alias: user.alias, log });
      await apiPut("/users?action=update", { alias: user.alias, highscores: newHighscores, unlockedItems: user.unlockedItems, avatarConfig: user.avatarConfig });
      invalidateUsersCache();
      const updated = await apiGet(`/users?alias=${user.alias}`);
      setUser(updated);
      setScreen("home");
    } catch (e) {
      alert("Kunde inte spara: " + e.message);
    }
    setLoading(false);
  }

  async function handleUnlock(itemId, cost) {
    const currentStats = computeStats(user);
    if (currentStats.totalPoints < cost) return;
    const newItems = [...(user.unlockedItems || []), itemId];
    try {
      await apiPut("/users?action=update", { alias: user.alias, unlockedItems: newItems, highscores: user.highscores, avatarConfig: user.avatarConfig });
      const updated = await apiGet(`/users?alias=${user.alias}`);
      setUser(updated);
    } catch (e) {
      alert("Kunde inte låsa upp: " + e.message);
    }
  }

  async function handleAvatarUpdate(newConfig) {
    try {
      await apiPut("/users?action=update", { alias: user.alias, avatarConfig: newConfig, highscores: user.highscores, unlockedItems: user.unlockedItems });
      setUser({ ...user, avatarConfig: newConfig });
    } catch (e) {
      alert("Kunde inte spara avatar: " + e.message);
    }
  }

  async function handleBingoDone(challengeId, bonusPoints) {
    if ((user.bingo || []).includes(challengeId)) return;
    try {
      await apiPost("/users?action=bingo", { alias: user.alias, challengeId });
      const challenge = BINGO.find(b => b.id === challengeId);
      const isFootball = challenge?.cat === "⚽";
      await apiPost("/users?action=addlog", {
        alias: user.alias,
        log: { date: localToday(), exercises: [], points: bonusPoints, minutes: 0, bingo: true, bingoFootball: isFootball }
      });
      invalidateUsersCache();
      const updated = await apiGet(`/users?alias=${user.alias}`);
      setUser(updated);
    } catch (e) {
      alert("Kunde inte markera bingo: " + e.message);
    }
  }

  async function handleCompleteDaily(challengeId, points) {
    if (loading) return;
    const today = localToday();
    // Guard against double submission
    const alreadyDone = (user.completedDaily || {})[today] === challengeId;
    if (alreadyDone) return;
    setLoading(true);
    try {
      await apiPost("/users?action=daily", { alias: user.alias, date: today, challengeId });
      await apiPost("/users?action=addlog", {
        alias: user.alias,
        log: { date: today, exercises: [], points, minutes: 0, dailyChallenge: true }
      });
      invalidateUsersCache();
      const updated = await apiGet(`/users?alias=${user.alias}`);
      setUser(updated);
    } catch (e) {
      alert("Kunde inte markera utmaning: " + e.message);
    }
    setLoading(false);
  }

  async function handleUpdateLog(action, logId, updatedLog) {
    try {
      if (action === "delete") {
        await apiPut("/users?action=deletelog", { logId });
      } else if (action === "edit") {
        await apiPut("/users?action=editlog", { logId, log: updatedLog });
      }
      const updated = await apiGet(`/users?alias=${user.alias}`);
      setUser(updated);
    } catch (e) {
      alert("Kunde inte uppdatera träning: " + e.message);
    }
  }

  const value = {
    user,
    stats,
    loading,
    screen,
    setScreen,
    seasonStart,
    setSeasonStart,
    autoLoading,
    handleLogin,
    handleLogout,
    handleSaveLog,
    handleUnlock,
    handleAvatarUpdate,
    handleBingoDone,
    handleCompleteDaily,
    handleUpdateLog,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

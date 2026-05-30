import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { apiGet, apiPost, apiPut, localToday, computeStats, invalidateUsersCache, getLevel } from '../utils';
import { BINGO, BONUS_BINGO, BINGO_TWO } from '../constants';
import { DEMO_USER } from '../demo/demoData';

const DEMO_ALIAS = 'demo';
const DEMO_PASSWORD = 'sommar2026';

const UserContext = createContext(null);

/* ── URL ↔ screen mapping ── */
const SCREEN_PATHS = {
  home: "/", log: "/log", profile: "/profile", bingo: "/bingo",
  team: "/team", challenges: "/challenges", cards: "/cards", album: "/team/photos",
};
const PATH_SCREENS = {
  ...Object.fromEntries(Object.entries(SCREEN_PATHS).map(([s, p]) => [p, s])),
  "/history": "log",  // history is now a tab inside log
};
function screenFromPath() {
  return PATH_SCREENS[window.location.pathname] || "home";
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [screen, setScreenState] = useState(screenFromPath);
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(true);
  const [seasonStart, setSeasonStart] = useState(null);
  const [countdownDate, setCountdownDate] = useState(null);
  const [teamFeedOpen, setTeamFeedOpen] = useState(false);
  const [buddyChallenges, setBuddyChallenges] = useState([]);
  const [challengeScrollTarget, setChallengeScrollTarget] = useState(null);
  const [newlyCompletedChallenge, setNewlyCompletedChallenge] = useState(null);
  const [levelUpData, setLevelUpData] = useState(null);
  const [pendingCheers, setPendingCheers] = useState([]);
  const seenCompletedIds = useRef(null);
  const prevLevelName = useRef(null);

  // Demo mode — role:'demo' user, everything is client-side only
  const isDemo = user?.role === DEMO_USER.role && user?.role === 'demo';

  // Detect newly completed buddy challenges (don't fire on first load)
  useEffect(() => {
    if (!buddyChallenges.length) return;
    if (seenCompletedIds.current === null) {
      seenCompletedIds.current = new Set(
        buddyChallenges.filter(c => c.status === 'completed').map(c => c.id)
      );
      return;
    }
    for (const c of buddyChallenges) {
      if (c.status === 'completed' && !seenCompletedIds.current.has(c.id)) {
        seenCompletedIds.current.add(c.id);
        setNewlyCompletedChallenge(c);
        break;
      }
    }
  }, [buddyChallenges]);

  /* ── Auto-login from localStorage ── */
  useEffect(() => {
    const saved = localStorage.getItem("hogalid_session");
    if (saved) {
      try {
        const { alias, password } = JSON.parse(saved);
        apiPost("/users?action=login", { alias, password })
          .then(u => { setUser(u); fetchBuddyChallenges(u.alias); fetchCheers(u.alias); })
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
      .then(data => { setSeasonStart(data.seasonStart); if (data.countdownDate) setCountdownDate(data.countdownDate); })
      .catch(() => {});
  }, []);

  /* ── Screen ↔ URL sync ── */
  const setScreen = useCallback((newScreen) => {
    setScreenState(newScreen);
    window.scrollTo(0, 0);
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

  // Detect level-up (skip first load)
  useEffect(() => {
    if (!stats) return;
    const currentLevel = getLevel(stats.totalPoints);
    if (prevLevelName.current === null) {
      prevLevelName.current = currentLevel.name;
      return;
    }
    if (currentLevel.name !== prevLevelName.current) {
      setLevelUpData(currentLevel);
      prevLevelName.current = currentLevel.name;
    }
  }, [stats]);

  async function fetchCheers(alias) {
    if (isDemo) return; // demo mode — no API calls
    try {
      const data = await apiGet(`/users?action=cheers&alias=${encodeURIComponent(alias)}`);
      setPendingCheers(data);
    } catch (e) {
      // ignore — non-critical
    }
  }

  async function sendCheer(toAlias) {
    if (isDemo) return { ok: false, error: 'demo_mode' };
    try {
      await apiPost('/users?action=cheer', { fromAlias: user.alias, toAlias });
      return { ok: true };
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('already_cheered_today') || msg.includes('429')) {
        return { ok: false, error: 'already_today' };
      }
      return { ok: false, error: e.message };
    }
  }

  async function markCheersSeen(ids) {
    if (isDemo) return;
    try {
      await apiPut('/users?action=cheerseen', { ids });
      setPendingCheers(prev => prev.filter(c => !ids.includes(c.id)));
    } catch (e) {
      // ignore
    }
  }

  async function fetchBuddyChallenges(alias) {
    if (isDemo) return; // demo mode — no API calls
    try {
      const data = await apiGet(`/buddy-challenges?alias=${encodeURIComponent(alias)}`);
      setBuddyChallenges(data);
    } catch (e) {
      // ignore — non-critical
    }
  }

  async function refreshCurrentUser(alias = user?.alias) {
    if (!alias) return null;
    if (isDemo) return user; // demo mode — return current state, no API call
    invalidateUsersCache();
    const updated = await apiGet(`/users?alias=${alias}`);
    setUser(updated);
    fetchBuddyChallenges(alias);
    return updated;
  }

  function handleLogin(u, credentials) {
    // Never persist demo session — it resets on page reload by design
    if (u?.role !== 'demo' && credentials) {
      localStorage.setItem("hogalid_session", JSON.stringify(credentials));
    }
    setUser(u);
    if (u?.role !== 'demo') {
      fetchBuddyChallenges(u.alias);
      fetchCheers(u.alias);
    }
    setScreen("home");
  }

  function handleLogout() {
    localStorage.removeItem("hogalid_session");
    invalidateUsersCache();
    setUser(null);
    setScreen("home");
  }

  async function handleSaveLog(log, newHighscores) {
    if (isDemo) return false; // demo mode — UI disables save button, this is a safety net
    setLoading(true);
    try {
      await apiPost("/users?action=addlog", { alias: user.alias, log });
      await apiPut("/users?action=update", {
        alias: user.alias,
        highscores: newHighscores,
        unlockedItems: user.unlockedItems,
        avatarConfig: user.avatarConfig,
      });
      await refreshCurrentUser(user.alias);
      setLoading(false);
      return true;
    } catch (e) {
      alert("Kunde inte spara: " + e.message);
      setLoading(false);
      return false;
    }
  }

  async function handleCreateBuddyChallenge(toAlias, exerciseId, amount) {
    if (isDemo) return { ok: false, error: 'demo_mode' };
    try {
      await apiPost('/buddy-challenges?action=create', {
        fromAlias: user.alias, toAlias, exerciseId, amount,
      });
      await fetchBuddyChallenges(user.alias);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  async function handleRespondBuddyChallenge(challengeId, response) {
    if (isDemo) return;
    try {
      await apiPost('/buddy-challenges?action=respond', { challengeId, response });
      await fetchBuddyChallenges(user.alias);
    } catch (e) {
      alert('Kunde inte svara på utmaning: ' + e.message);
    }
  }

  async function handleCancelBuddyChallenge(challengeId) {
    if (isDemo) return;
    try {
      await apiPost('/buddy-challenges?action=cancel', { challengeId });
      await fetchBuddyChallenges(user.alias);
    } catch (e) {
      alert('Kunde inte avbryta utmaning: ' + e.message);
    }
  }

  async function handleUnlock(itemId, cost) {
    const currentStats = computeStats(user);
    if (currentStats.totalPoints < cost) return;
    const newItems = [...(user.unlockedItems || []), itemId];
    if (isDemo) { setUser(u => ({ ...u, unlockedItems: newItems })); return; }
    try {
      await apiPut("/users?action=update", { alias: user.alias, unlockedItems: newItems, highscores: user.highscores, avatarConfig: user.avatarConfig });
      await refreshCurrentUser(user.alias);
    } catch (e) {
      alert("Kunde inte låsa upp: " + e.message);
    }
  }

  async function handleAvatarUpdate(newConfig) {
    if (isDemo) { setUser(u => ({ ...u, avatarConfig: newConfig })); return; }
    try {
      await apiPut("/users?action=update", { alias: user.alias, avatarConfig: newConfig, highscores: user.highscores, unlockedItems: user.unlockedItems });
      await refreshCurrentUser(user.alias);
    } catch (e) {
      alert("Kunde inte spara avatar: " + e.message);
    }
  }

  async function handleUpdateDisplayName(displayName) {
    if (isDemo) { setUser(u => ({ ...u, displayName })); return; }
    try {
      await apiPut("/users?action=updatedisplayname", { alias: user.alias, displayName });
      setUser({ ...user, displayName });
    } catch (e) {
      alert("Kunde inte spara namn: " + e.message);
    }
  }

  async function handleBingoDone(challengeId, bonusPoints) {
    if ((user.bingo || []).includes(challengeId)) return;
    if (isDemo) { setUser(u => ({ ...u, bingo: [...(u.bingo || []), challengeId] })); return; }
    try {
      await apiPost("/users?action=bingo", { alias: user.alias, challengeId });
      const challenge = BINGO.find(b => b.id === challengeId);
      const isFootball = challenge?.cat === "⚽";
      await apiPost("/users?action=addlog", {
        alias: user.alias,
        log: { date: localToday(), exercises: [], points: bonusPoints, minutes: 0, bingo: true, bingoFootball: isFootball }
      });
      await refreshCurrentUser(user.alias);
    } catch (e) {
      alert("Kunde inte markera bingo: " + e.message);
    }
  }

  async function handleAdultBingoDone(challengeId) {
    if ((user.adultBingo || []).includes(challengeId)) return;
    if (isDemo) { setUser(u => ({ ...u, adultBingo: [...(u.adultBingo || []), challengeId] })); return; }
    try {
      await apiPost('/users?action=adultbingo', { alias: user.alias, challengeId });
      await refreshCurrentUser(user.alias);
    } catch (e) {
      alert('Kunde inte markera vuxenbingo: ' + e.message);
    }
  }

  async function handleBonusBingoDone(challengeId, bonusPoints) {
    if ((user.bonusBingo || []).includes(challengeId)) return;
    if (isDemo) { setUser(u => ({ ...u, bonusBingo: [...(u.bonusBingo || []), challengeId] })); return; }
    try {
      await apiPost('/users?action=bonusbingo', { alias: user.alias, challengeId });
      const challenge = BONUS_BINGO.find((b) => b.id === challengeId);
      const isFootball = challenge?.cat === '⚽';
      await apiPost('/users?action=addlog', {
        alias: user.alias,
        log: { date: localToday(), exercises: [], points: bonusPoints, minutes: 0, bingo: true, bingoFootball: isFootball, title: `bonus-bingo:${challengeId}` },
      });
      await refreshCurrentUser(user.alias);
    } catch (e) {
      alert('Kunde inte markera bonusbingo: ' + e.message);
    }
  }

  async function handleBingoTwoDone(challengeId, bonusPoints) {
    if ((user.bingoTwo || []).includes(challengeId)) return;
    if (isDemo) { setUser(u => ({ ...u, bingoTwo: [...(u.bingoTwo || []), challengeId] })); return; }
    try {
      await apiPost('/users?action=bingotwo', { alias: user.alias, challengeId });
      const challenge = BINGO_TWO.find((b) => b.id === challengeId);
      const isFootball = challenge?.cat === '⚽';
      await apiPost('/users?action=addlog', {
        alias: user.alias,
        log: { date: localToday(), exercises: [], points: bonusPoints, minutes: 0, bingo: true, bingoFootball: isFootball, title: `bricka2-bingo:${challengeId}` },
      });
      await refreshCurrentUser(user.alias);
    } catch (e) {
      alert('Kunde inte markera Bricka 2: ' + e.message);
    }
  }

  async function handleRecordSecretProgress(patch) {
    if (isDemo) return;
    try {
      await apiPost('/users?action=secretprogress', { alias: user.alias, patch });
      await refreshCurrentUser(user.alias);
    } catch (e) {
      // non-critical
    }
  }

  async function handleCompleteDaily(challengeId, points) {
    if (isDemo) return;
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
      await refreshCurrentUser(user.alias);
    } catch (e) {
      alert("Kunde inte markera utmaning: " + e.message);
    }
    setLoading(false);
  }

  async function handleUpdateLog(action, logId, updatedLog) {
    if (isDemo) return;
    try {
      if (action === "delete") {
        await apiPut("/users?action=deletelog", { logId });
      } else if (action === "edit") {
        await apiPut("/users?action=editlog", { logId, log: updatedLog });
      }
      await refreshCurrentUser(user.alias);
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
    countdownDate,
    setCountdownDate,
    autoLoading,
    handleLogin,
    handleLogout,
    handleSaveLog,
    handleUnlock,
    handleAvatarUpdate,
    handleBingoDone,
    handleBonusBingoDone,
    handleBingoTwoDone,
    handleAdultBingoDone,
    handleCompleteDaily,
    handleRecordSecretProgress,
    handleUpdateLog,
    handleUpdateDisplayName,
    teamFeedOpen,
    setTeamFeedOpen,
    buddyChallenges,
    fetchBuddyChallenges,
    handleCreateBuddyChallenge,
    handleRespondBuddyChallenge,
    handleCancelBuddyChallenge,
    challengeScrollTarget,
    setChallengeScrollTarget,
    newlyCompletedChallenge,
    clearNewlyCompletedChallenge: () => setNewlyCompletedChallenge(null),
    levelUpData,
    clearLevelUp: () => setLevelUpData(null),
    pendingCheers,
    sendCheer,
    markCheersSeen,
    isLeader: user?.role === 'leader',
    isDemo,
    DEMO_ALIAS,
    DEMO_PASSWORD,
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

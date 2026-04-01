import { createContext, useContext, useState, useMemo } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, localToday, computeStats } from '../utils';
import { BINGO } from '../constants';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    if (!user || user.isAdmin) return null;
    return computeStats(user);
  }, [user]);

  function handleLogin(u) {
    setUser(u);
    setScreen("home");
  }

  function handleLogout() {
    setUser(null);
    setScreen("home");
  }

  async function handleSaveLog(log, newHighscores) {
    setLoading(true);
    try {
      await apiPost("/logs", { alias: user.alias, log });
      const updated = await apiPut("/users", { alias: user.alias, highscores: newHighscores });
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
      const updated = await apiPut("/users", { alias: user.alias, unlockedItems: newItems });
      setUser(updated);
    } catch (e) {
      alert("Kunde inte låsa upp: " + e.message);
    }
  }

  async function handleBingoDone(challengeId, bonusPoints) {
    if ((user.bingo || []).includes(challengeId)) return;
    try {
      await apiPost("/bingo", { alias: user.alias, challengeId });
      const challenge = BINGO.find(b => b.id === challengeId);
      const isFootball = challenge?.cat === "⚽";
      await apiPost("/logs", {
        alias: user.alias,
        log: { date: localToday(), exercises: [], points: bonusPoints, minutes: 0, bingo: true, bingoFootball: isFootball }
      });
      const updated = await apiGet(`/users?alias=${user.alias.toLowerCase()}`);
      setUser(updated);
    } catch (e) {
      alert("Kunde inte markera bingo: " + e.message);
    }
  }

  async function handleCompleteDaily(challengeId, points) {
    const today = localToday();
    const newCompleted = { ...(user.completedDaily || {}), [today]: challengeId };
    try {
      await apiPost("/logs", {
        alias: user.alias,
        log: { date: today, exercises: [], points, minutes: 0, dailyChallenge: true }
      });
      const updated = await apiPut("/users", { alias: user.alias, completedDaily: newCompleted });
      setUser(updated);
    } catch (e) {
      alert("Kunde inte markera utmaning: " + e.message);
    }
  }

  async function handleUpdateLog(action, logId, updatedLog) {
    try {
      if (action === "delete") {
        await apiDelete("/logs", { id: logId });
      } else if (action === "edit") {
        await apiPut("/logs", { id: logId, log: updatedLog });
      }
      const updated = await apiGet(`/users?alias=${user.alias.toLowerCase()}`);
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
    handleLogin,
    handleLogout,
    handleSaveLog,
    handleUnlock,
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

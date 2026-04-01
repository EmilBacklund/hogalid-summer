import { COLORS } from './constants';
import { UserProvider, useUser } from './context/UserContext';
import { TopBar } from './components/common';
import {
  LoginScreen,
  HomeScreen,
  LogScreen,
  AvatarScreen,
  BingoScreen,
  TeamScreen,
  ChallengesScreen,
  LogHistoryScreen,
  AdminScreen,
} from './screens';

function AppContent() {
  const { user, loading, screen, handleLogout } = useUser();

  const bgStyle = {
    minHeight: "100vh",
    background: `linear-gradient(160deg, ${COLORS.dark} 0%, #001e6e 50%, ${COLORS.red} 100%)`,
    fontFamily: "'Nunito', sans-serif",
    color: "#fff",
    maxWidth: 480,
    margin: "0 auto",
    position: "relative",
  };

  if (!user) {
    return (
      <div style={bgStyle}>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { background: ${COLORS.dark}; } input[type=number]::-webkit-inner-spin-button { opacity: 1; }`}</style>
        <LoginScreen />
      </div>
    );
  }

  if (user.isAdmin) {
    return <AdminScreen />;
  }

  return (
    <div style={bgStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fredoka+One&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${COLORS.dark}; }
        input:focus { outline: none; box-shadow: 0 0 0 3px ${COLORS.lime}66; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1); }
      `}</style>

      {loading && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999, height: 3, background: COLORS.lime, animation: "none" }} />
      )}

      <TopBar onLogout={handleLogout} />

      {screen === "home"       && <HomeScreen />}
      {screen === "log"        && <LogScreen />}
      {screen === "challenges" && <ChallengesScreen />}
      {screen === "history"    && <LogHistoryScreen />}
      {screen === "avatar"     && <AvatarScreen />}
      {screen === "team"       && <TeamScreen />}
      {screen === "bingo"      && <BingoScreen />}
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

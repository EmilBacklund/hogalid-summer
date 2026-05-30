import { useState } from 'react';
import { COLORS } from './constants';
import { UserProvider, useUser } from './context/UserContext';
import { TopBar, LoadingSpinner, TopLoadingBar, BuddyCelebration, LevelUpModal, DemoBanner } from './components/common';
import {
  LoginScreen,
  HomeScreen,
  LogScreen,
  ProfileScreen,
  BingoScreen,
  TeamScreen,
  PhotoAlbumScreen,
  ChallengesScreen,
  AdminScreen,
  CardsScreen,
} from './screens';

function AppContent() {
  const { user, loading, autoLoading, screen, setScreen, handleLogout,
          newlyCompletedChallenge, clearNewlyCompletedChallenge,
          levelUpData, clearLevelUp, isDemo } = useUser();
  const [adminSpectator, setAdminSpectator] = useState(false);

  const bgStyle = {
    minHeight: "100vh",
    background: `linear-gradient(160deg, ${COLORS.dark} 0%, #001e6e 50%, ${COLORS.red} 100%)`,
    fontFamily: "'Nunito', sans-serif",
    color: "#fff",
    maxWidth: 480,
    margin: "0 auto",
    position: "relative",
  };

  if (autoLoading) {
    return (
      <div style={bgStyle}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fredoka+One&display=swap');
          body { background: ${COLORS.dark}; }
        `}</style>
        <LoadingSpinner size="splash" text="Laddar din profil..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={bgStyle}>
        <style>{`body { background: ${COLORS.dark}; } input[type=number]::-webkit-inner-spin-button { opacity: 1; }`}</style>
        <LoginScreen />
      </div>
    );
  }

  if (user.isAdmin) {
    if (adminSpectator) {
      return (
        <div style={bgStyle}>
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fredoka+One&display=swap'); body { background: ${COLORS.dark}; }`}</style>
          <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, maxWidth: 480, width: '100%', padding: '0 16px', boxSizing: 'border-box', pointerEvents: 'none' }}>
            <button
              onClick={() => setAdminSpectator(false)}
              style={{ pointerEvents: 'all', background: 'rgba(0,21,64,0.95)', border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 99, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
            >
              ← Tillbaka till admin
            </button>
          </div>
          <TeamScreen />
        </div>
      );
    }
    return <AdminScreen onViewTeam={() => setAdminSpectator(true)} />;
  }

  return (
    <div style={bgStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fredoka+One&display=swap');
        body { background: ${COLORS.dark}; }
        input:focus { outline: none; box-shadow: 0 0 0 3px ${COLORS.lime}66; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1); }
      `}</style>

      {loading && <TopLoadingBar />}

      {newlyCompletedChallenge && user && (
        <BuddyCelebration
          challenge={newlyCompletedChallenge}
          user={user}
          onClose={clearNewlyCompletedChallenge}
        />
      )}

      {levelUpData && (
        <LevelUpModal level={levelUpData} onClose={clearLevelUp} />
      )}

      <TopBar onLogout={handleLogout} onHome={() => setScreen('home')} />

      {screen === "home"       && <HomeScreen />}
      {screen === "log"        && <LogScreen />}
      {screen === "challenges" && <ChallengesScreen />}
      {screen === "profile"    && <ProfileScreen />}
      {screen === "team"       && <TeamScreen />}
      {screen === "album"      && <PhotoAlbumScreen />}
      {screen === "bingo"      && <BingoScreen />}
      {screen === "cards"      && <CardsScreen />}

      {isDemo && <DemoBanner />}
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

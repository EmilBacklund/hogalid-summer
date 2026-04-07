import { COLORS, EXERCISES } from './constants';
import { UserProvider, useUser } from './context/UserContext';
import { TopBar, LoadingSpinner, TopLoadingBar, Confetti } from './components/common';
import {
  LoginScreen,
  HomeScreen,
  LogScreen,
  ProfileScreen,
  BingoScreen,
  TeamScreen,
  ChallengesScreen,
  AdminScreen,
} from './screens';

function BuddyCelebration({ challenge, user, onClose }) {
  const partner = challenge.fromAlias === user.alias ? challenge.toAlias : challenge.fromAlias;
  const ex = EXERCISES.find(e => e.id === challenge.exerciseId);
  return (
    <>
      <Confetti active />
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(145deg, #0a1628, #001e6e)',
            border: `2px solid ${COLORS.lime}`,
            borderRadius: 24,
            padding: '36px 28px 28px',
            textAlign: 'center',
            maxWidth: 340,
            width: '100%',
            boxShadow: `0 0 60px ${COLORS.lime}44`,
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 12 }}>🤝</div>
          <div style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 28,
            color: COLORS.lime,
            marginBottom: 8,
            lineHeight: 1.2,
          }}>
            Grattis!
          </div>
          <div style={{
            color: '#fff',
            fontSize: 17,
            fontWeight: 700,
            lineHeight: 1.4,
            marginBottom: 20,
          }}>
            Du och{' '}
            <span style={{ color: COLORS.yellow }}>{partner}</span>
            {' '}klarade utmaningen:
            <br />
            <span style={{ color: COLORS.lime }}>
              {challenge.amount} {ex?.label || challenge.exerciseId}!
            </span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 24 }}>
            Ni får dubbla poäng för träningen 🎉
          </div>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 14,
              border: 'none',
              background: COLORS.lime,
              color: COLORS.dark,
              fontFamily: "'Fredoka One', cursive",
              fontSize: 20,
              cursor: 'pointer',
              letterSpacing: 0.5,
            }}
          >
            🙌 Awesome!
          </button>
        </div>
      </div>
    </>
  );
}

function AppContent() {
  const { user, loading, autoLoading, screen, setScreen, handleLogout,
          newlyCompletedChallenge, clearNewlyCompletedChallenge } = useUser();

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
    return <AdminScreen />;
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

      <TopBar onLogout={handleLogout} onHome={() => setScreen('home')} />

      {screen === "home"       && <HomeScreen />}
      {screen === "log"        && <LogScreen />}
      {screen === "challenges" && <ChallengesScreen />}
      {screen === "profile"    && <ProfileScreen />}
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

import { useEffect, useMemo, useRef, useState } from 'react';
import { COLORS, BINGO, BONUS_BINGO, BINGO_TWO, ADULT_BINGO, BADGES } from '../constants';
import { localToday } from '../utils';
import { Card, ProgressBar, Confetti, ButtonLoader } from '../components/common';
import { useUser } from '../context/UserContext';
import { ArrowLeft, Lock } from 'lucide-react';

const BOARD_TWO_UNLOCK_TARGET = 45;
const MAIN_ROW_BONUS = 30;
const MAIN_COL_BONUS = 50;
const BONUS_ROW_BONUS = 20;
const BONUS_COL_BONUS = 25;
const BOARD_TWO_ROW_BONUS = 30;
const BOARD_TWO_COL_BONUS = 50;

function shuffleOpenFirst(items, doneIds) {
  const undone = items.filter((item) => !doneIds.includes(item.id));
  const doneItems = items.filter((item) => doneIds.includes(item.id));
  for (let i = undone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [undone[i], undone[j]] = [undone[j], undone[i]];
  }
  return [...undone, ...doneItems];
}

function getBoardLineState(items, doneIds, cols) {
  const doneSet = new Set(doneIds);
  const rows = [];
  const completedCols = [];
  const rowCount = Math.ceil(items.length / cols);

  for (let row = 0; row < rowCount; row++) {
    const rowItems = items.slice(row * cols, row * cols + cols);
    if (rowItems.length === cols && rowItems.every((item) => doneSet.has(item.id))) {
      rows.push(row);
    }
  }

  for (let col = 0; col < cols; col++) {
    const colItems = [];
    for (let row = 0; row < rowCount; row++) {
      const item = items[row * cols + col];
      if (item) colItems.push(item);
    }
    if (colItems.length === rowCount && colItems.every((item) => doneSet.has(item.id))) {
      completedCols.push(col);
    }
  }

  return { rows, cols: completedCols };
}

function getBoardCounts(items, doneIds) {
  return {
    football: doneIds.filter((id) => items.find((item) => item.id === id)?.cat === '⚽').length,
    summer: doneIds.filter((id) => items.find((item) => item.id === id)?.cat === '☀️').length,
    totalPoints: doneIds.reduce((sum, id) => sum + (items.find((item) => item.id === id)?.points || 0), 0),
  };
}

function computeLineBonus(items, doneIds, nextId, cols, rowBonus, colBonus, previousLineState) {
  const nextDoneSet = new Set([...doneIds, nextId]);
  const index = items.findIndex((item) => item.id === nextId);
  if (index < 0) return { bonus: 0, labels: [] };

  const rowCount = Math.ceil(items.length / cols);
  const row = Math.floor(index / cols);
  const col = index % cols;
  let bonus = 0;
  const labels = [];

  const rowItems = items.slice(row * cols, row * cols + cols);
  const rowComplete = rowItems.length === cols && rowItems.every((item) => nextDoneSet.has(item.id));
  if (rowComplete && !previousLineState.rows.includes(row)) {
    bonus += rowBonus;
    labels.push(`Rad ${row + 1}`);
  }

  const colItems = [];
  for (let r = 0; r < rowCount; r++) {
    const item = items[r * cols + col];
    if (item) colItems.push(item);
  }
  const colComplete = colItems.length === rowCount && colItems.every((item) => nextDoneSet.has(item.id));
  if (colComplete && !previousLineState.cols.includes(col)) {
    bonus += colBonus;
    labels.push(`Kolumn ${col + 1}`);
  }

  return { bonus, labels };
}

function BoardGrid({ items, doneIds, justDoneId, cols, lineState }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: cols === 10 ? 3 : 8,
        marginBottom: 6,
        padding: cols === 10 ? '0 2px' : 0,
      }}
    >
      {items.map((item, index) => {
        const isDone = doneIds.includes(item.id);
        const isJust = justDoneId === item.id;
        const row = Math.floor(index / cols);
        const col = index % cols;
        const inCompletedLine = lineState.rows.includes(row) || lineState.cols.includes(col);
        return (
          <div
            key={item.id}
            title={item.label}
            style={{
              aspectRatio: cols === 10 ? '1' : '1 / 1.05',
              borderRadius: cols === 10 ? 4 : 12,
              background: isDone
                ? (item.cat === '⚽' ? COLORS.lime : '#fbbf24')
                : 'rgba(255,255,255,0.06)',
              border: isDone ? 'none' : '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.25s',
              transform: isJust ? 'scale(1.08)' : 'scale(1)',
              boxShadow: isJust
                ? `0 0 8px ${item.cat === '⚽' ? COLORS.lime : '#fbbf24'}`
                : inCompletedLine && isDone
                  ? '0 0 6px rgba(255,255,255,0.28)'
                  : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: cols === 10 ? 7 : 10,
              color: isDone ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.2)',
              fontWeight: 800,
              textAlign: 'center',
              padding: cols === 10 ? 0 : '4px',
            }}
          >
            {cols === 10 ? index + 1 : item.cat}
          </div>
        );
      })}
    </div>
  );
}

function LineIndicators({ lineState, rowBonus, colBonus, rowColor = COLORS.lime, colColor = '#fbbf24' }) {
  if (lineState.rows.length === 0 && lineState.cols.length === 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
        justifyContent: 'center',
      }}
    >
      {lineState.rows.map((row) => (
        <span
          key={`row-${row}`}
          style={{
            background: `${rowColor}20`,
            border: `1px solid ${rowColor}66`,
            borderRadius: 999,
            padding: '4px 9px',
            fontSize: 11,
            fontWeight: 800,
            color: rowColor,
          }}
        >
          Rad {row + 1} ✓ +{rowBonus}p
        </span>
      ))}
      {lineState.cols.map((col) => (
        <span
          key={`col-${col}`}
          style={{
            background: `${colColor}20`,
            border: `1px solid ${colColor}66`,
            borderRadius: 999,
            padding: '4px 9px',
            fontSize: 11,
            fontWeight: 800,
            color: colColor,
          }}
        >
          Kolumn {col + 1} ✓ +{colBonus}p
        </span>
      ))}
    </div>
  );
}

function FilterTabs({ filter, setFilter, count }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
      {[['all', `Alla ${count}`], ['⚽', 'Fotboll & idrott'], ['☀️', 'Sommar']].map(([value, label]) => (
        <button
          key={value}
          onClick={() => setFilter(value)}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            transition: 'all 0.15s',
            background: filter === value ? COLORS.lime : 'rgba(255,255,255,0.1)',
            color: filter === value ? COLORS.dark : 'rgba(255,255,255,0.72)',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ChallengeList({ items, doneIds, selectedChallenge, setSelectedChallenge, justDoneId, busy, onMarkDone }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((challenge) => {
        const isDone = doneIds.includes(challenge.id);
        const isJust = justDoneId === challenge.id;
        return (
          <div key={challenge.id}>
            <div
              onClick={() => !isDone && setSelectedChallenge(selectedChallenge?.id === challenge.id ? null : challenge)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: isDone ? 'rgba(168,230,61,0.1)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isDone ? `${COLORS.lime}55` : selectedChallenge?.id === challenge.id ? COLORS.lime : 'rgba(255,255,255,0.08)'}`,
                borderRadius: selectedChallenge?.id === challenge.id ? '14px 14px 0 0' : 14,
                padding: '12px 14px',
                cursor: isDone ? 'default' : 'pointer',
                opacity: isDone ? 0.72 : 1,
                transition: 'all 0.2s',
                transform: isJust ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  flexShrink: 0,
                  border: `2px solid ${isDone ? COLORS.lime : 'rgba(255,255,255,0.2)'}`,
                  background: isDone ? COLORS.lime : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
              >
                {isDone ? '✓' : challenge.cat}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: isDone ? 'rgba(255,255,255,0.5)' : '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}
                >
                  {challenge.label}
                </div>
              </div>
              <div style={{ color: isDone ? COLORS.lime : COLORS.accent, fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                {isDone ? '✅' : `+${challenge.points}p`}
              </div>
            </div>
            {selectedChallenge?.id === challenge.id && !isDone && (
              <div
                style={{
                  background: 'rgba(168,230,61,0.08)',
                  border: `1px solid ${COLORS.lime}`,
                  borderTop: 'none',
                  borderRadius: '0 0 14px 14px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => onMarkDone(challenge.id)}
                    disabled={busy}
                    style={{
                      flex: 1,
                      padding: '12px 0',
                      borderRadius: 12,
                      border: 'none',
                      background: busy ? 'rgba(240,220,0,0.5)' : COLORS.lime,
                      color: COLORS.dark,
                      fontFamily: "'Fredoka One', cursive",
                      fontSize: 16,
                      cursor: busy ? 'not-allowed' : 'pointer',
                      opacity: busy ? 0.7 : 1,
                    }}
                  >
                    {busy ? <><ButtonLoader color={COLORS.dark} /> Sparar...</> : '✅ Klart!'}
                  </button>
                  <button
                    onClick={() => setSelectedChallenge(null)}
                    disabled={busy}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AdultBingoLines(doneIds = []) {
  const doneSet = new Set(doneIds);
  const rows = [];
  const cols = [];

  for (let row = 0; row < 4; row++) {
    const rowItems = ADULT_BINGO.slice(row * 4, row * 4 + 4);
    if (rowItems.every((item) => doneSet.has(item.id))) rows.push(row);
  }

  for (let col = 0; col < 4; col++) {
    const colItems = Array.from({ length: 4 }, (_, row) => ADULT_BINGO[row * 4 + col]);
    if (colItems.every((item) => item && doneSet.has(item.id))) cols.push(col);
  }

  return { rows, cols };
}

export function BingoScreen() {
  const {
    user,
    setScreen,
    handleBingoDone,
    handleBonusBingoDone,
    handleBingoTwoDone,
    handleAdultBingoDone,
    handleSaveLog,
    handleRecordSecretProgress,
  } = useUser();

  const done = user.bingo || [];
  const bonusDone = user.bonusBingo || [];
  const boardTwoDone = user.bingoTwo || [];
  const adultDone = user.adultBingo || [];
  const adultDiscovered = !!user.secretFlags?.foundAdultBingo;

  const [activeBoard, setActiveBoard] = useState('one');
  const [mainFilter, setMainFilter] = useState('all');
  const [boardTwoFilter, setBoardTwoFilter] = useState('all');
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedBoardTwo, setSelectedBoardTwo] = useState(null);
  const [selectedBonus, setSelectedBonus] = useState(null);
  const [busyMain, setBusyMain] = useState(false);
  const [busyBoardTwo, setBusyBoardTwo] = useState(false);
  const [busyBonus, setBusyBonus] = useState(false);
  const [justDoneMain, setJustDoneMain] = useState(null);
  const [justDoneBoardTwo, setJustDoneBoardTwo] = useState(null);
  const [justDoneBonus, setJustDoneBonus] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBonusBingo, setShowBonusBingo] = useState(false);
  const [showAdultIntro, setShowAdultIntro] = useState(false);
  const [showAdultBingo, setShowAdultBingo] = useState(false);
  const [selectedAdultChallenge, setSelectedAdultChallenge] = useState(null);
  const [adultBusy, setAdultBusy] = useState(false);
  const [adultJustDone, setAdultJustDone] = useState(null);
  const [sunTapCount, setSunTapCount] = useState(0);
  const [randomPick, setRandomPick] = useState(null);
  const [wheelNum, setWheelNum] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const spinTimerRef = useRef(null);

  useEffect(() => () => {
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
  }, []);

  const mainLineState = getBoardLineState(BINGO, done, 10);
  const bonusLineState = getBoardLineState(BONUS_BINGO, bonusDone, 4);
  const boardTwoLineState = getBoardLineState(BINGO_TWO, boardTwoDone, 10);
  const adultLineState = AdultBingoLines(adultDone);

  const totalBeforeBoardTwo = done.length + bonusDone.length;
  const boardTwoUnlocked = totalBeforeBoardTwo >= BOARD_TWO_UNLOCK_TARGET || boardTwoDone.length > 0;

  const mainCounts = getBoardCounts(BINGO, done);
  const bonusCounts = getBoardCounts(BONUS_BINGO, bonusDone);
  const boardTwoCounts = getBoardCounts(BINGO_TWO, boardTwoDone);

  const shuffledMain = useMemo(() => shuffleOpenFirst(BINGO, done), []);
  const shuffledBoardTwo = useMemo(() => shuffleOpenFirst(BINGO_TWO, boardTwoDone), []);

  const boardConfig = activeBoard === 'one'
    ? {
        key: 'one',
        title: 'Bricka 1',
        items: BINGO,
        done,
        lineState: mainLineState,
        counts: mainCounts,
        cols: 10,
        rowBonus: MAIN_ROW_BONUS,
        colBonus: MAIN_COL_BONUS,
        filter: mainFilter,
        setFilter: setMainFilter,
        selected: selectedMain,
        setSelected: setSelectedMain,
        busy: busyMain,
        setBusy: setBusyMain,
        justDone: justDoneMain,
        setJustDone: setJustDoneMain,
        shuffled: shuffledMain,
        action: handleBingoDone,
        bonusTitle: '🎯 Bingobonus',
      }
    : {
        key: 'two',
        title: 'Bricka 2',
        items: BINGO_TWO,
        done: boardTwoDone,
        lineState: boardTwoLineState,
        counts: boardTwoCounts,
        cols: 10,
        rowBonus: BOARD_TWO_ROW_BONUS,
        colBonus: BOARD_TWO_COL_BONUS,
        filter: boardTwoFilter,
        setFilter: setBoardTwoFilter,
        selected: selectedBoardTwo,
        setSelected: setSelectedBoardTwo,
        busy: busyBoardTwo,
        setBusy: setBusyBoardTwo,
        justDone: justDoneBoardTwo,
        setJustDone: setJustDoneBoardTwo,
        shuffled: shuffledBoardTwo,
        action: handleBingoTwoDone,
        bonusTitle: '🎯 Bricka 2-bonus',
      };

  const boardDisplayList = boardConfig.shuffled.filter((item) => boardConfig.filter === 'all' || item.cat === boardConfig.filter);
  const boardRemaining = boardConfig.items.filter((item) => !boardConfig.done.includes(item.id) && (boardConfig.filter === 'all' || item.cat === boardConfig.filter));
  const currentRandomPick = randomPick?.board === activeBoard ? randomPick.challenge : null;

  async function markBoardDone(config, id, closeAfter = true) {
    if (config.busy) return;
    config.setBusy(true);
    const challenge = config.items.find((item) => item.id === id);
    await config.action(id, challenge?.points || 0);

    const { bonus, labels } = computeLineBonus(
      config.items,
      config.done,
      id,
      config.cols,
      config.rowBonus,
      config.colBonus,
      config.lineState,
    );

    if (bonus > 0) {
      await handleSaveLog(
        {
          date: localToday(),
          exercises: [],
          points: bonus,
          minutes: 0,
          bingo: true,
          bingoFootball: challenge?.cat === '⚽',
          title: `${config.bonusTitle}: ${labels.join(' + ')}`,
        },
        user.highscores || {},
      );
    }

    config.setJustDone(id);
    config.setSelected(null);
    if (closeAfter) setRandomPick(null);
    setShowConfetti(true);
    config.setBusy(false);
    setTimeout(() => {
      config.setJustDone(null);
      setShowConfetti(false);
    }, 2300);
  }

  async function markBonusDone(id) {
    if (busyBonus) return;
    setBusyBonus(true);
    const challenge = BONUS_BINGO.find((item) => item.id === id);
    await handleBonusBingoDone(id, challenge?.points || 0);

    const { bonus, labels } = computeLineBonus(BONUS_BINGO, bonusDone, id, 4, BONUS_ROW_BONUS, BONUS_COL_BONUS, bonusLineState);
    if (bonus > 0) {
      await handleSaveLog(
        {
          date: localToday(),
          exercises: [],
          points: bonus,
          minutes: 0,
          bingo: true,
          bingoFootball: challenge?.cat === '⚽',
          title: `🎯 Bonusbingo: ${labels.join(' + ')}`,
        },
        user.highscores || {},
      );
    }

    setJustDoneBonus(id);
    setSelectedBonus(null);
    setShowConfetti(true);
    setBusyBonus(false);
    setTimeout(() => {
      setJustDoneBonus(null);
      setShowConfetti(false);
    }, 2200);
  }

  function startSpin() {
    if (spinning || boardRemaining.length === 0) return;
    const target = boardRemaining[Math.floor(Math.random() * boardRemaining.length)];
    const targetNum = boardConfig.items.findIndex((item) => item.id === target.id) + 1;

    setSpinning(true);
    setRandomPick(null);

    const totalSteps = 28;
    const startNum = ((targetNum - totalSteps - 1 + boardConfig.items.length * 2) % boardConfig.items.length) + 1;
    let current = startNum;
    let step = 0;

    function tick() {
      step++;
      current = (current % boardConfig.items.length) + 1;
      setWheelNum(current);

      if (step < totalSteps) {
        const progress = step / totalSteps;
        const delay = 30 + progress * progress * 220;
        spinTimerRef.current = setTimeout(tick, delay);
      } else {
        setSpinning(false);
        spinTimerRef.current = setTimeout(() => {
          setRandomPick({ board: activeBoard, challenge: target });
        }, 450);
      }
    }

    spinTimerRef.current = setTimeout(tick, 50);
  }

  async function revealAdultBingo() {
    if (!adultDiscovered) {
      await handleRecordSecretProgress({ foundAdultBingo: true });
    }
    setShowAdultIntro(true);
  }

  async function handleSunTap() {
    const next = sunTapCount + 1;
    if (next < 5) {
      setSunTapCount(next);
      return;
    }
    setSunTapCount(0);
    if (adultDiscovered) {
      setShowAdultBingo(true);
      return;
    }
    await revealAdultBingo();
  }

  async function markAdultDone(id) {
    if (adultBusy) return;
    setAdultBusy(true);
    await handleAdultBingoDone(id);
    setAdultJustDone(id);
    setShowConfetti(true);
    setAdultBusy(false);
    setTimeout(() => {
      setAdultJustDone(null);
      setShowConfetti(false);
    }, 2200);
  }

  return (
    <div style={{ padding: '20px 16px 32px', fontFamily: "'Nunito', sans-serif" }}>
      <Confetti active={showConfetti} />

      <button
        onClick={() => setScreen('home')}
        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: COLORS.lime, cursor: 'pointer', fontSize: 15, fontWeight: 700, marginBottom: 16, padding: 0 }}
      >
        <ArrowLeft size={16} />Tillbaka
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: '#fff' }}>Sommarlovsbingo</div>
        <button
          onClick={handleSunTap}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 26, lineHeight: 1 }}
          aria-label="Solen"
          title={adultDiscovered ? 'Tryck fem gånger för att öppna Hemligt vuxenbingo' : undefined}
        >
          🌞
        </button>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 18 }}>
        Fyll brickor, jaga rader och lås upp ännu mer.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <Card
          onClick={() => {
            setActiveBoard('one');
            setRandomPick(null);
          }}
          style={{
            padding: '14px 16px',
            border: activeBoard === 'one' ? `2px solid ${COLORS.lime}` : '1px solid rgba(255,255,255,0.15)',
            background: activeBoard === 'one' ? 'rgba(168,230,61,0.12)' : undefined,
          }}
        >
          <div style={{ color: activeBoard === 'one' ? COLORS.lime : 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>
            Aktiv bricka
          </div>
          <div style={{ color: '#fff', fontFamily: "'Fredoka One', cursive", fontSize: 24, marginBottom: 4 }}>Bricka 1</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{done.length}/50 klara</div>
        </Card>

        <Card
          onClick={() => {
            if (!boardTwoUnlocked) return;
            setActiveBoard('two');
            setRandomPick(null);
          }}
          style={{
            padding: '14px 16px',
            cursor: boardTwoUnlocked ? 'pointer' : 'default',
            border: activeBoard === 'two' ? `2px solid ${COLORS.yellow}` : '1px solid rgba(255,255,255,0.15)',
            background: boardTwoUnlocked
              ? (activeBoard === 'two' ? 'rgba(251,191,36,0.12)' : undefined)
              : 'rgba(255,255,255,0.04)',
            opacity: boardTwoUnlocked ? 1 : 0.82,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            {!boardTwoUnlocked && <Lock size={13} color="rgba(255,255,255,0.5)" />}
            <div style={{ color: boardTwoUnlocked ? COLORS.yellow : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              {boardTwoUnlocked ? 'Upplåst' : 'Låst'}
            </div>
          </div>
          <div style={{ color: '#fff', fontFamily: "'Fredoka One', cursive", fontSize: 24, marginBottom: 6 }}>Bricka 2</div>
          {boardTwoUnlocked ? (
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{boardTwoDone.length}/50 klara</div>
          ) : (
            <>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 6 }}>
                {totalBeforeBoardTwo}/{BOARD_TWO_UNLOCK_TARGET} uppdrag till upplåsning
              </div>
              <ProgressBar value={Math.min(100, Math.round((totalBeforeBoardTwo / BOARD_TWO_UNLOCK_TARGET) * 100))} color={COLORS.yellow} height={8} />
            </>
          )}
        </Card>
      </div>

      <Card
        onClick={() => setShowBonusBingo(true)}
        style={{
          marginBottom: 16,
          padding: '16px 18px',
          background: 'linear-gradient(135deg, rgba(10,32,74,0.96) 0%, rgba(22,73,170,0.96) 58%, rgba(255,215,92,0.18) 100%)',
          border: '1px solid rgba(255,215,92,0.24)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div>
            <div style={{ color: COLORS.yellow, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Extra uppdrag
            </div>
            <div style={{ color: '#fff', fontFamily: "'Fredoka One', cursive", fontSize: 22, marginBottom: 6 }}>
              Bonusbingo
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.35 }}>
              {bonusDone.length}/12 klara. Räknas in när du låser upp Bricka 2.
            </div>
          </div>
          <div
            style={{
              minWidth: 68,
              height: 68,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.yellow,
              fontFamily: "'Fredoka One', cursive",
              fontSize: 22,
            }}
          >
            {bonusDone.length}/12
          </div>
        </div>
      </Card>

      {adultDiscovered && (
        <Card
          onClick={() => setShowAdultBingo(true)}
          style={{
            marginBottom: 16,
            padding: '16px 18px',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(47,72,140,0.95) 60%, rgba(245,205,72,0.16) 100%)',
            border: '1px solid rgba(255,241,140,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ color: COLORS.yellow, fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                Hemligt hittat
              </div>
              <div style={{ color: '#fff', fontFamily: "'Fredoka One', cursive", fontSize: 20, lineHeight: 1.15, marginBottom: 6 }}>
                Hemligt vuxenbingo
              </div>
              <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 13, lineHeight: 1.35 }}>
                Nu är det de vuxnas tur. {adultDone.length}/16 rutor klara{adultLineState.rows.length || adultLineState.cols.length ? ' · bingo fixat!' : ''}
              </div>
            </div>
            <div
              style={{
                minWidth: 64,
                height: 64,
                borderRadius: 18,
                background: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: COLORS.yellow,
                fontFamily: "'Fredoka One', cursive",
                fontSize: 22,
              }}
            >
              {adultDone.length}/16
            </div>
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: COLORS.lime }}>{boardConfig.done.length}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>av {boardConfig.items.length} klara</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: '#60a5fa' }}>{boardConfig.counts.football}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>⚽ idrott</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: '#fbbf24' }}>{boardConfig.counts.summer}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>☀️ sommar</div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <ProgressBar value={Math.round((boardConfig.done.length / boardConfig.items.length) * 100)} color={activeBoard === 'one' ? COLORS.lime : COLORS.yellow} height={10} />
        </div>
        <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: 12, marginTop: 5 }}>
          +{boardConfig.counts.totalPoints} poäng från {boardConfig.title.toLowerCase()}
        </div>
      </Card>

      <BoardGrid
        items={boardConfig.items}
        doneIds={boardConfig.done}
        justDoneId={boardConfig.justDone}
        cols={boardConfig.cols}
        lineState={boardConfig.lineState}
      />

      <LineIndicators
        lineState={boardConfig.lineState}
        rowBonus={boardConfig.rowBonus}
        colBonus={boardConfig.colBonus}
        rowColor={activeBoard === 'one' ? COLORS.lime : COLORS.yellow}
        colColor={activeBoard === 'one' ? '#fbbf24' : '#60a5fa'}
      />

      {activeBoard === 'one' && [10, 20, 35, 50].map((milestone) => {
        const reached = done.length >= milestone;
        const badge = BADGES.find((b) => b.id === `bingo${milestone}`);
        return (
          <div
            key={milestone}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: reached ? 'rgba(168,230,61,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${reached ? COLORS.lime : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10,
              padding: '4px 10px',
              marginRight: 6,
              marginBottom: 12,
              opacity: reached ? 1 : 0.45,
            }}
          >
            <span style={{ fontSize: 14 }}>{badge?.icon}</span>
            <span style={{ color: reached ? COLORS.lime : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700 }}>{milestone} klara</span>
          </div>
        );
      })}

      {(() => {
        const canSpin = !spinning && boardRemaining.length > 0;
        const isYellow = wheelNum !== null && wheelNum % 2 === 1;
        const prevNum = wheelNum !== null ? ((wheelNum - 2 + boardConfig.items.length) % boardConfig.items.length) + 1 : null;
        const nextNum = wheelNum !== null ? (wheelNum % boardConfig.items.length) + 1 : null;

        return (
          <div
            onClick={canSpin ? startSpin : undefined}
            style={{
              marginBottom: 14,
              borderRadius: 16,
              overflow: 'hidden',
              cursor: canSpin ? 'pointer' : 'default',
              position: 'relative',
              height: 126,
              boxShadow: spinning
                ? `0 0 32px ${isYellow ? COLORS.yellow : COLORS.red}88`
                : wheelNum !== null
                  ? `0 0 20px ${isYellow ? COLORS.yellow : COLORS.red}55`
                  : '0 4px 20px rgba(220,40,40,0.35)',
              transition: 'box-shadow 0.15s',
              userSelect: 'none',
            }}
          >
            {wheelNum === null ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.navy})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 26 }}>🎰</span>
                <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: '#fff', letterSpacing: 0.5 }}>
                  Slumpa ett uppdrag
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 28, background: prevNum % 2 === 1 ? COLORS.yellow : COLORS.red, opacity: 0.22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: prevNum % 2 === 1 ? COLORS.dark : '#fff' }}>{prevNum}</span>
                </div>
                <div style={{ height: 70, background: isYellow ? COLORS.yellow : COLORS.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 52, lineHeight: 1, color: isYellow ? COLORS.dark : '#fff' }}>{wheelNum}</span>
                </div>
                <div style={{ height: 28, background: nextNum % 2 === 1 ? COLORS.yellow : COLORS.red, opacity: 0.22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: nextNum % 2 === 1 ? COLORS.dark : '#fff' }}>{nextNum}</span>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {currentRandomPick && (
        <Card style={{ marginBottom: 16, border: `2px solid ${COLORS.red}`, background: 'rgba(220,40,40,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ fontSize: 28 }}>{currentRandomPick.cat}</div>
            <div style={{ background: COLORS.accent, color: COLORS.dark, borderRadius: 8, padding: '3px 10px', fontWeight: 700, fontSize: 13 }}>+{currentRandomPick.points} p</div>
          </div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, marginBottom: 14, lineHeight: 1.3 }}>{currentRandomPick.label}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => markBoardDone(boardConfig, currentRandomPick.id)}
              disabled={boardConfig.busy}
              style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: boardConfig.busy ? 'rgba(240,220,0,0.5)' : COLORS.lime, color: COLORS.dark, fontFamily: "'Fredoka One', cursive", fontSize: 16, cursor: boardConfig.busy ? 'not-allowed' : 'pointer', opacity: boardConfig.busy ? 0.7 : 1 }}
            >
              {boardConfig.busy ? <><ButtonLoader color={COLORS.dark} /> Sparar...</> : '✅ Klart!'}
            </button>
            <button
              onClick={() => setRandomPick(null)}
              disabled={boardConfig.busy}
              style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        </Card>
      )}

      <FilterTabs filter={boardConfig.filter} setFilter={boardConfig.setFilter} count={boardConfig.items.length} />

      <ChallengeList
        items={boardDisplayList}
        doneIds={boardConfig.done}
        selectedChallenge={boardConfig.selected}
        setSelectedChallenge={boardConfig.setSelected}
        justDoneId={boardConfig.justDone}
        busy={boardConfig.busy}
        onMarkDone={(id) => markBoardDone(boardConfig, id)}
      />

      {showBonusBingo && (
        <div
          onClick={() => setShowBonusBingo(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 430,
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 28,
              padding: selectedBonus && !bonusDone.includes(selectedBonus.id) ? '20px 16px 110px' : '20px 16px 18px',
              background: 'linear-gradient(180deg, rgba(10,32,74,0.99) 0%, rgba(20,55,120,0.98) 100%)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
              border: '6px solid rgba(255,255,255,0.18)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ color: COLORS.yellow, fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                  Extra innehåll
                </div>
                <div style={{ color: '#fff', fontFamily: "'Fredoka One', cursive", fontSize: 28, lineHeight: 1.08 }}>
                  Bonusbingo
                </div>
                <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 1.4, marginTop: 6 }}>
                  12 extra rutor som räknas in när du låser upp Bricka 2.
                </div>
              </div>
              <button
                onClick={() => setShowBonusBingo(false)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: 999, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>{bonusDone.length}/12 klara</div>
                <ProgressBar value={Math.round((bonusDone.length / BONUS_BINGO.length) * 100)} color={COLORS.yellow} height={10} />
              </div>
              <div style={{ color: 'rgba(255,255,255,0.72)', fontWeight: 800, fontSize: 12, textAlign: 'right' }}>
                {totalBeforeBoardTwo}/{BOARD_TWO_UNLOCK_TARGET} till Bricka 2
              </div>
            </div>

            <BoardGrid items={BONUS_BINGO} doneIds={bonusDone} justDoneId={justDoneBonus} cols={4} lineState={bonusLineState} />
            <LineIndicators lineState={bonusLineState} rowBonus={BONUS_ROW_BONUS} colBonus={BONUS_COL_BONUS} rowColor={COLORS.yellow} colColor="#60a5fa" />

            <ChallengeList
              items={BONUS_BINGO}
              doneIds={bonusDone}
              selectedChallenge={selectedBonus}
              setSelectedChallenge={setSelectedBonus}
              justDoneId={justDoneBonus}
              busy={busyBonus}
              onMarkDone={markBonusDone}
            />
          </div>
        </div>
      )}

      {showAdultIntro && (
        <div
          onClick={() => setShowAdultIntro(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.76)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 360, borderRadius: 24, padding: '22px 20px', background: 'linear-gradient(160deg, rgba(14,22,50,0.98) 0%, rgba(29,78,216,0.95) 58%, rgba(250,204,21,0.18) 100%)', border: '1px solid rgba(250,204,21,0.28)', boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🕵️</div>
            <div style={{ color: '#fff', fontFamily: "'Fredoka One', cursive", fontSize: 28, lineHeight: 1.1, marginBottom: 10 }}>
              Du hittade Hemligt vuxenbingo!
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 1.5, marginBottom: 18 }}>
              Här finns roliga vuxenuppdrag för sommaren.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  setShowAdultIntro(false);
                  setShowAdultBingo(true);
                }}
                style={{ flex: 1, border: 'none', borderRadius: 14, padding: '14px 16px', background: COLORS.lime, color: COLORS.dark, fontFamily: "'Fredoka One', cursive", fontSize: 17, cursor: 'pointer' }}
              >
                Öppna bingot
              </button>
              <button
                onClick={() => setShowAdultIntro(false)}
                style={{ border: '1px solid rgba(255,255,255,0.18)', borderRadius: 14, padding: '14px 16px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', fontWeight: 700, cursor: 'pointer' }}
              >
                Inte nu
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdultBingo && (
        <div
          onClick={() => setShowAdultBingo(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 430,
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 28,
              padding: selectedAdultChallenge && !adultDone.includes(selectedAdultChallenge.id) ? '20px 16px 110px' : '20px 16px 18px',
              background: 'linear-gradient(180deg, #f3ead6 0%, #f7f0dd 100%)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
              border: '6px solid rgba(255,255,255,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ color: '#48608d', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                  Bonusbingo
                </div>
                <div style={{ color: '#1d3557', fontFamily: "'Fredoka One', cursive", fontSize: 28, lineHeight: 1.08 }}>
                  Hemligt vuxenbingo
                </div>
                <div style={{ color: 'rgba(29,53,87,0.72)', fontSize: 13, lineHeight: 1.4, marginTop: 6 }}>
                  16 rutor bara för kul. Perfekt för att sätta lite skojig press på de vuxna.
                </div>
              </div>
              <button
                onClick={() => setShowAdultBingo(false)}
                style={{ background: 'rgba(29,53,87,0.08)', border: 'none', color: '#1d3557', width: 36, height: 36, borderRadius: 999, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ color: '#1d3557', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>{adultDone.length}/16 klara</div>
                <ProgressBar value={Math.round((adultDone.length / ADULT_BINGO.length) * 100)} color="#f4b400" height={10} />
              </div>
              <div style={{ color: adultLineState.rows.length || adultLineState.cols.length ? '#15803d' : '#1d3557', fontWeight: 800, fontSize: 12, textAlign: 'right' }}>
                {adultLineState.rows.length || adultLineState.cols.length ? 'Bingo fixat!' : 'Jaga en rad eller kolumn'}
              </div>
            </div>

            <BoardGrid items={ADULT_BINGO} doneIds={adultDone} justDoneId={adultJustDone} cols={4} lineState={adultLineState} />

            {(adultLineState.rows.length > 0 || adultLineState.cols.length > 0) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {adultLineState.rows.map((row) => (
                  <span key={`adult-row-${row}`} style={{ background: 'rgba(34,197,94,0.12)', color: '#166534', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 800 }}>
                    Rad {row + 1} ✓
                  </span>
                ))}
                {adultLineState.cols.map((col) => (
                  <span key={`adult-col-${col}`} style={{ background: 'rgba(59,130,246,0.12)', color: '#1d4ed8', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 800 }}>
                    Kolumn {col + 1} ✓
                  </span>
                ))}
              </div>
            )}

            <ChallengeList
              items={ADULT_BINGO.map((item) => ({ ...item, cat: '⭐', points: 0 }))}
              doneIds={adultDone}
              selectedChallenge={selectedAdultChallenge}
              setSelectedChallenge={setSelectedAdultChallenge}
              justDoneId={adultJustDone}
              busy={adultBusy}
              onMarkDone={async (id) => {
                if (adultBusy) return;
                setAdultBusy(true);
                await handleAdultBingoDone(id);
                setAdultJustDone(id);
                setSelectedAdultChallenge(null);
                setShowConfetti(true);
                setAdultBusy(false);
                setTimeout(() => {
                  setAdultJustDone(null);
                  setShowConfetti(false);
                }, 2200);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

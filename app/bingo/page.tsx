'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { COLORS, BINGO, BONUS_BINGO, BINGO_TWO, ADULT_BINGO, BADGES } from '@/constants';
import {
  getBoardLineState,
  getBoardCounts,
  computeLineBonus,
  shuffleOpenFirst,
  type LineState,
  type BoardCounts,
} from '@/utils';
import {
  Card,
  ProgressBar,
  Confetti,
  TopBar,
  LoadingSpinner,
  ButtonLoader,
} from '@/components/common';
import {
  BoardGrid,
  LineIndicators,
  FilterTabs,
  ChallengeList,
  SlotMachine,
  BonusBingoModal,
  AdultIntroModal,
  AdultBingoModal,
  type BingoFilter,
} from '@/components/bingo';
import { useUser } from '@/providers/UserProvider';
import { useBingoMutations } from '@/hooks/useBingoMutations';
import { cn } from '@/lib/cn';
import type { BingoTile, User } from '@/types';

const BOARD_TWO_UNLOCK_TARGET = 45;
const MAIN_ROW_BONUS = 30;
const MAIN_COL_BONUS = 50;
const BONUS_ROW_BONUS = 20;
const BONUS_COL_BONUS = 25;
const BOARD_TWO_ROW_BONUS = 30;
const BOARD_TWO_COL_BONUS = 50;

interface BoardConfig {
  key: 'one' | 'two';
  serverBoard: 'classic' | 'bingoTwo';
  title: string;
  items: BingoTile[];
  done: string[];
  lineState: LineState;
  counts: BoardCounts;
  cols: number;
  rowBonus: number;
  colBonus: number;
  filter: BingoFilter;
  setFilter: (f: BingoFilter) => void;
  selected: BingoTile | null;
  setSelected: (c: BingoTile | null) => void;
  busy: boolean;
  setBusy: (b: boolean) => void;
  justDone: string | null;
  setJustDone: (id: string | null) => void;
  shuffled: BingoTile[];
  bonusTitle: string;
}

export default function BingoPage() {
  const { user, isLoading } = useUser();
  if (isLoading || !user) {
    return (
      <main className="mx-auto min-h-screen max-w-md">
        <TopBar />
        <LoadingSpinner size="splash" text="Laddar..." />
      </main>
    );
  }
  return <BingoContent user={user} />;
}

function BingoContent({ user }: { user: User }) {
  const router = useRouter();
  const { markTile, recordSecretProgress } = useBingoMutations();

  const done = user.bingo || [];
  const bonusDone = user.bonusBingo || [];
  const boardTwoDone = user.bingoTwo || [];
  const adultDone = user.adultBingo || [];
  const adultDiscovered = !!user.secretFlags?.foundAdultBingo;

  const [activeBoard, setActiveBoard] = useState<'one' | 'two'>('one');
  const [mainFilter, setMainFilter] = useState<BingoFilter>('all');
  const [boardTwoFilter, setBoardTwoFilter] = useState<BingoFilter>('all');
  const [selectedMain, setSelectedMain] = useState<BingoTile | null>(null);
  const [selectedBoardTwo, setSelectedBoardTwo] = useState<BingoTile | null>(null);
  const [selectedBonus, setSelectedBonus] = useState<BingoTile | null>(null);
  const [busyMain, setBusyMain] = useState(false);
  const [busyBoardTwo, setBusyBoardTwo] = useState(false);
  const [busyBonus, setBusyBonus] = useState(false);
  const [justDoneMain, setJustDoneMain] = useState<string | null>(null);
  const [justDoneBoardTwo, setJustDoneBoardTwo] = useState<string | null>(null);
  const [justDoneBonus, setJustDoneBonus] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBonusBingo, setShowBonusBingo] = useState(false);
  const [showAdultIntro, setShowAdultIntro] = useState(false);
  const [showAdultBingo, setShowAdultBingo] = useState(false);
  const [selectedAdultChallenge, setSelectedAdultChallenge] = useState<BingoTile | null>(null);
  const [adultBusy, setAdultBusy] = useState(false);
  const [adultJustDone, setAdultJustDone] = useState<string | null>(null);
  const [sunTapCount, setSunTapCount] = useState(0);
  const [randomPick, setRandomPick] = useState<{
    board: 'one' | 'two';
    challenge: BingoTile;
  } | null>(null);
  const [wheelNum, setWheelNum] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    },
    [],
  );

  const mainLineState = getBoardLineState(BINGO, done, 10);
  const bonusLineState = getBoardLineState(BONUS_BINGO, bonusDone, 4);
  const boardTwoLineState = getBoardLineState(BINGO_TWO, boardTwoDone, 10);
  const adultLineState = getBoardLineState(ADULT_BINGO, adultDone, 4);

  const bonusUnlocked =
    bonusDone.length > 0 ||
    done.length >= 10 ||
    mainLineState.rows.length > 0 ||
    mainLineState.cols.length > 0;
  const totalBeforeBoardTwo = done.length + bonusDone.length;
  const boardTwoUnlocked =
    totalBeforeBoardTwo >= BOARD_TWO_UNLOCK_TARGET || boardTwoDone.length > 0;

  const mainCounts = getBoardCounts(BINGO, done);
  const boardTwoCounts = getBoardCounts(BINGO_TWO, boardTwoDone);

  // Shuffle once per mount (open tiles first); deps intentionally empty.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffledMain = useMemo(() => shuffleOpenFirst(BINGO, done), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffledBoardTwo = useMemo(() => shuffleOpenFirst(BINGO_TWO, boardTwoDone), []);

  const boardConfig: BoardConfig =
    activeBoard === 'one'
      ? {
          key: 'one',
          serverBoard: 'classic',
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
          bonusTitle: '🎯 Bingobonus',
        }
      : {
          key: 'two',
          serverBoard: 'bingoTwo',
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
          bonusTitle: '🎯 Bricka 2-bonus',
        };

  const boardDisplayList = boardConfig.shuffled.filter(
    (item) => boardConfig.filter === 'all' || item.cat === boardConfig.filter,
  );
  const boardRemaining = boardConfig.items.filter(
    (item) =>
      !boardConfig.done.includes(item.id) &&
      (boardConfig.filter === 'all' || item.cat === boardConfig.filter),
  );
  const currentRandomPick = randomPick?.board === activeBoard ? randomPick.challenge : null;

  // Mark a tile done. The base bonus is server-authoritative (SEC H1); we send
  // the client-computed line bonus, which the server clamps.
  async function markBoardDone(config: BoardConfig, id: string, closeAfter = true) {
    if (config.busy) return;
    config.setBusy(true);
    const { bonus, labels } = computeLineBonus(
      config.items,
      config.done,
      id,
      config.cols,
      config.rowBonus,
      config.colBonus,
      config.lineState,
    );
    try {
      await markTile.mutateAsync({
        board: config.serverBoard,
        challengeId: id,
        ...(bonus > 0
          ? { lineBonus: bonus, lineTitle: `${config.bonusTitle}: ${labels.join(' + ')}` }
          : {}),
      });
    } catch {
      // Surfaced via the mutation; reset local UI regardless.
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

  async function markBonusDone(id: string) {
    if (busyBonus) return;
    setBusyBonus(true);
    const { bonus, labels } = computeLineBonus(
      BONUS_BINGO,
      bonusDone,
      id,
      4,
      BONUS_ROW_BONUS,
      BONUS_COL_BONUS,
      bonusLineState,
    );
    try {
      await markTile.mutateAsync({
        board: 'bonus',
        challengeId: id,
        ...(bonus > 0
          ? { lineBonus: bonus, lineTitle: `🎯 Bonusbingo: ${labels.join(' + ')}` }
          : {}),
      });
    } catch {
      // ignore — reset UI below
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
    const target = boardRemaining[Math.floor(Math.random() * boardRemaining.length)]!;
    const targetNum = boardConfig.items.findIndex((item) => item.id === target.id) + 1;

    setSpinning(true);
    setRandomPick(null);

    const totalSteps = 28;
    const startNum =
      ((targetNum - totalSteps - 1 + boardConfig.items.length * 2) % boardConfig.items.length) + 1;
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
      await recordSecretProgress.mutateAsync({ foundAdultBingo: true });
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

  async function markAdultDone(id: string) {
    if (adultBusy) return;
    setAdultBusy(true);
    try {
      await markTile.mutateAsync({ board: 'adult', challengeId: id });
    } catch {
      // ignore — reset UI below
    }
    setAdultJustDone(id);
    setSelectedAdultChallenge(null);
    setShowConfetti(true);
    setAdultBusy(false);
    setTimeout(() => {
      setAdultJustDone(null);
      setShowConfetti(false);
    }, 2200);
  }

  const canSpin = !spinning && boardRemaining.length > 0;

  return (
    <main className="mx-auto min-h-screen max-w-md">
      <TopBar />
      <div className="px-4 pt-5 pb-8">
        <Confetti active={showConfetti} />

        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-hogalid-yellow mb-4 flex items-center gap-1 text-[15px] font-bold"
        >
          <ArrowLeft size={16} />
          Tillbaka
        </button>

        <div className="mb-0.5 flex items-center gap-1.5">
          <div className="font-display text-[26px] text-white">Sommarlovsbingo</div>
          <button
            type="button"
            onClick={() => void handleSunTap()}
            className="text-[26px] leading-none"
            aria-label="Solen"
            title={
              adultDiscovered ? 'Tryck fem gånger för att öppna Hemligt vuxenbingo' : undefined
            }
          >
            🌞
          </button>
        </div>
        <div className="mb-[18px] text-[13px] text-white/50">
          Fyll brickor, jaga rader och lås upp ännu mer.
        </div>

        {/* Board selector */}
        <div className="mb-3 grid grid-cols-2 gap-2.5">
          <Card
            onClick={() => {
              setActiveBoard('one');
              setRandomPick(null);
            }}
            style={{
              padding: '14px 16px',
              border:
                activeBoard === 'one'
                  ? `2px solid ${COLORS.lime}`
                  : '1px solid rgba(255,255,255,0.15)',
              background: activeBoard === 'one' ? 'rgba(168,230,61,0.12)' : undefined,
            }}
          >
            <div className="text-hogalid-yellow mb-[5px] text-xs font-extrabold tracking-[1px] uppercase">
              Aktiv bricka
            </div>
            <div className="font-display mb-1 text-2xl text-white">Bricka 1</div>
            <div className="text-xs text-white/55">{done.length}/50 klara</div>
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
              border:
                activeBoard === 'two'
                  ? `2px solid ${COLORS.yellow}`
                  : '1px solid rgba(255,255,255,0.15)',
              background: boardTwoUnlocked
                ? activeBoard === 'two'
                  ? 'rgba(251,191,36,0.12)'
                  : undefined
                : 'rgba(255,255,255,0.04)',
              opacity: boardTwoUnlocked ? 1 : 0.82,
            }}
          >
            <div className="mb-[5px] flex items-center gap-1.5">
              {!boardTwoUnlocked && <Lock size={13} color="rgba(255,255,255,0.5)" />}
              <div
                className="text-xs font-extrabold tracking-[1px] uppercase"
                style={{ color: boardTwoUnlocked ? COLORS.yellow : 'rgba(255,255,255,0.5)' }}
              >
                {boardTwoUnlocked ? 'Upplåst' : 'Låst'}
              </div>
            </div>
            <div className="font-display mb-1.5 text-2xl text-white">Bricka 2</div>
            {boardTwoUnlocked ? (
              <div className="text-xs text-white/55">{boardTwoDone.length}/50 klara</div>
            ) : (
              <>
                <div className="mb-1.5 text-xs text-white/55">
                  {totalBeforeBoardTwo}/{BOARD_TWO_UNLOCK_TARGET} uppdrag till upplåsning
                </div>
                <ProgressBar
                  value={Math.min(
                    100,
                    Math.round((totalBeforeBoardTwo / BOARD_TWO_UNLOCK_TARGET) * 100),
                  )}
                  color={COLORS.yellow}
                  height={8}
                />
              </>
            )}
          </Card>
        </div>

        {/* Bonus bingo card */}
        <Card
          onClick={() => {
            if (!bonusUnlocked) return;
            setShowBonusBingo(true);
          }}
          className="mb-4"
          style={{
            padding: '16px 18px',
            background:
              'linear-gradient(135deg, rgba(10,32,74,0.96) 0%, rgba(22,73,170,0.96) 58%, rgba(255,215,92,0.18) 100%)',
            border: '1px solid rgba(255,215,92,0.24)',
            cursor: bonusUnlocked ? 'pointer' : 'default',
            opacity: bonusUnlocked ? 1 : 0.82,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="mb-1 flex items-center gap-1.5">
                {!bonusUnlocked && <Lock size={13} color="rgba(255,255,255,0.5)" />}
                <div className="text-hogalid-yellow text-xs font-extrabold tracking-[1px] uppercase">
                  {bonusUnlocked ? 'Extra uppdrag' : 'Låst bonus'}
                </div>
              </div>
              <div className="font-display mb-1.5 text-[22px] text-white">Bonusbingo</div>
              {bonusUnlocked ? (
                <div className="text-[13px] leading-snug text-white/70">
                  {bonusDone.length}/12 klara. Räknas in när du låser upp Bricka 2.
                </div>
              ) : (
                <>
                  <div className="mb-2 text-[13px] leading-snug text-white/70">
                    Lås upp genom att klara en bingorad eller 10 uppdrag på Bricka 1.
                  </div>
                  <ProgressBar
                    value={Math.min(100, Math.round((done.length / 10) * 100))}
                    color={COLORS.yellow}
                    height={8}
                  />
                </>
              )}
            </div>
            <div
              className="font-display flex h-[68px] min-w-[68px] items-center justify-center rounded-[18px] bg-white/[0.08] text-[22px]"
              style={{ color: COLORS.yellow }}
            >
              {bonusUnlocked ? `${bonusDone.length}/12` : `${Math.min(done.length, 10)}/10`}
            </div>
          </div>
        </Card>

        {/* Secret adult bingo (once discovered) */}
        {adultDiscovered && (
          <Card
            onClick={() => setShowAdultBingo(true)}
            className="mb-4"
            style={{
              padding: '16px 18px',
              background:
                'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(47,72,140,0.95) 60%, rgba(245,205,72,0.16) 100%)',
              border: '1px solid rgba(255,241,140,0.3)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-hogalid-yellow mb-1 text-xs font-extrabold tracking-[1px] uppercase">
                  Hemligt hittat
                </div>
                <div className="font-display mb-1.5 text-xl leading-[1.15] text-white">
                  Hemligt vuxenbingo
                </div>
                <div className="text-[13px] leading-snug text-white/[0.68]">
                  Nu är det de vuxnas tur. {adultDone.length}/16 rutor klara
                  {adultLineState.rows.length || adultLineState.cols.length
                    ? ' · bingo fixat!'
                    : ''}
                </div>
              </div>
              <div
                className="font-display flex h-16 min-w-16 items-center justify-center rounded-[18px] bg-white/[0.08] text-[22px]"
                style={{ color: COLORS.yellow }}
              >
                {adultDone.length}/16
              </div>
            </div>
          </Card>
        )}

        {/* Stats */}
        <Card className="mb-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-hogalid-yellow font-display text-[26px]">
                {boardConfig.done.length}
              </div>
              <div className="text-[11px] text-white/50">av {boardConfig.items.length} klara</div>
            </div>
            <div>
              <div className="font-display text-[26px] text-[#60a5fa]">
                {boardConfig.counts.football}
              </div>
              <div className="text-[11px] text-white/50">⚽ idrott</div>
            </div>
            <div>
              <div className="font-display text-[26px] text-[#fbbf24]">
                {boardConfig.counts.summer}
              </div>
              <div className="text-[11px] text-white/50">☀️ sommar</div>
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar
              value={Math.round((boardConfig.done.length / boardConfig.items.length) * 100)}
              color={activeBoard === 'one' ? COLORS.lime : COLORS.yellow}
              height={10}
            />
          </div>
          <div className="mt-[5px] text-xs text-white/[0.42]">
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

        {activeBoard === 'one' &&
          [10, 20, 35, 50].map((milestone) => {
            const reached = done.length >= milestone;
            const badge = BADGES.find((b) => b.id === `bingo${milestone}`);
            return (
              <div
                key={milestone}
                className={cn(
                  'mr-1.5 mb-3 inline-flex items-center gap-[5px] rounded-[10px] border px-2.5 py-1',
                  reached
                    ? 'border-hogalid-yellow bg-[rgba(168,230,61,0.15)] opacity-100'
                    : 'border-white/10 bg-white/5 opacity-45',
                )}
              >
                <span className="text-sm">{badge?.icon}</span>
                <span
                  className={cn(
                    'text-[11px] font-bold',
                    reached ? 'text-hogalid-yellow' : 'text-white/50',
                  )}
                >
                  {milestone} klara
                </span>
              </div>
            );
          })}

        <SlotMachine
          wheelNum={wheelNum}
          spinning={spinning}
          canSpin={canSpin}
          itemCount={boardConfig.items.length}
          onSpin={startSpin}
        />

        {currentRandomPick && (
          <Card
            className="mb-4"
            style={{ border: `2px solid ${COLORS.red}`, background: 'rgba(220,40,40,0.1)' }}
          >
            <div className="mb-2.5 flex items-start justify-between">
              <div className="text-[28px]">{currentRandomPick.cat}</div>
              <div
                className="rounded-lg px-2.5 py-[3px] text-[13px] font-bold"
                style={{ background: COLORS.accent, color: COLORS.dark }}
              >
                +{currentRandomPick.points} p
              </div>
            </div>
            <div className="mb-3.5 text-[17px] leading-snug font-bold text-white">
              {currentRandomPick.label}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => markBoardDone(boardConfig, currentRandomPick.id)}
                disabled={boardConfig.busy}
                className="font-display flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-base"
                style={{
                  background: boardConfig.busy ? 'rgba(240,220,0,0.5)' : COLORS.lime,
                  color: COLORS.dark,
                  cursor: boardConfig.busy ? 'not-allowed' : 'pointer',
                  opacity: boardConfig.busy ? 0.7 : 1,
                }}
              >
                {boardConfig.busy ? (
                  <>
                    <ButtonLoader color={COLORS.dark} /> Sparar...
                  </>
                ) : (
                  '✅ Klart!'
                )}
              </button>
              <button
                type="button"
                onClick={() => setRandomPick(null)}
                disabled={boardConfig.busy}
                className="rounded-xl border border-white/20 px-4 py-3 text-sm text-white/60"
              >
                ✕
              </button>
            </div>
          </Card>
        )}

        <FilterTabs
          filter={boardConfig.filter}
          setFilter={boardConfig.setFilter}
          count={boardConfig.items.length}
        />

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
          <BonusBingoModal
            bonusDone={bonusDone}
            justDoneId={justDoneBonus}
            selected={selectedBonus}
            setSelected={setSelectedBonus}
            busy={busyBonus}
            onMarkDone={markBonusDone}
            lineState={bonusLineState}
            rowBonus={BONUS_ROW_BONUS}
            colBonus={BONUS_COL_BONUS}
            totalBeforeBoardTwo={totalBeforeBoardTwo}
            unlockTarget={BOARD_TWO_UNLOCK_TARGET}
            onClose={() => setShowBonusBingo(false)}
          />
        )}

        {showAdultIntro && (
          <AdultIntroModal
            onOpen={() => {
              setShowAdultIntro(false);
              setShowAdultBingo(true);
            }}
            onClose={() => setShowAdultIntro(false)}
          />
        )}

        {showAdultBingo && (
          <AdultBingoModal
            adultDone={adultDone}
            justDoneId={adultJustDone}
            selected={selectedAdultChallenge}
            setSelected={setSelectedAdultChallenge}
            busy={adultBusy}
            onMarkDone={markAdultDone}
            lineState={adultLineState}
            onClose={() => setShowAdultBingo(false)}
          />
        )}
      </div>
    </main>
  );
}

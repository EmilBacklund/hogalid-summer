'use client';

import { useEffect, useState } from 'react';
import { useConfig } from '@/hooks/useConfig';
import { Card } from './Card';

const FALLBACK_DATE = '2026-08-17T00:00:00';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calc(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

const UNITS: [keyof TimeLeft, string][] = [
  ['days', 'd'],
  ['hours', 'h'],
  ['minutes', 'm'],
  ['seconds', 's'],
];

/** Countdown to the first training session. Target comes from `/api/config`. */
export function Countdown() {
  const { data: config } = useConfig();
  const countdownDate = config?.countdownDate;
  const target = countdownDate ? new Date(`${countdownDate}T00:00:00`) : new Date(FALLBACK_DATE);

  const [t, setT] = useState<TimeLeft | null>(() => calc(target));

  useEffect(() => {
    setT(calc(target));
    const id = setInterval(() => setT(calc(target)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdownDate]);

  if (!t) {
    return (
      <Card className="border-hogalid-yellow/80 mb-4 border-[1.5px] bg-[rgba(168,230,61,0.12)] text-center">
        <div className="text-[28px]">🎉</div>
        <div className="text-hogalid-yellow font-display text-xl">Dags för träning igen!</div>
      </Card>
    );
  }

  return (
    <div className="mb-3.5 flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-[rgba(240,220,0,0.3)] bg-[rgba(240,220,0,0.07)] px-3.5 py-2">
      <span className="text-base">⚽</span>
      <div className="flex-1 text-xs font-semibold text-white/50">Första träningen</div>
      <div className="flex items-baseline gap-1.5">
        {UNITS.map(([key, lbl]) => (
          <span key={key}>
            <span className="text-hogalid-yellow font-display text-base">
              {String(t[key]).padStart(2, '0')}
            </span>
            <span className="text-[11px] text-white/40">{lbl} </span>
          </span>
        ))}
      </div>
    </div>
  );
}

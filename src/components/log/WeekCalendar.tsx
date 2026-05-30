'use client';

import { useState } from 'react';
import { getWeekStart } from '@/utils';
import { Card } from '@/components/common';
import { cn } from '@/lib/cn';

const DAY_LABELS = ['Må', 'Ti', 'On', 'To', 'Fr', 'Lö', 'Sö'];

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

function getISOWeekNumber(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

interface WeekCalendarProps {
  selectedDate: string;
  today: string;
  /** Dates (YYYY-MM-DD) that already have a training log. */
  logDates: Set<string>;
  onSelect: (date: string) => void;
}

/** Week-strip date picker for the Dagbok screen; can page back through history. */
export function WeekCalendar({ selectedDate, today, logDates, onSelect }: WeekCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const calWeekStart = addDaysStr(getWeekStart(today), weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysStr(calWeekStart, i));
  const weekNumber = getISOWeekNumber(calWeekStart);
  const atCurrentWeek = weekOffset >= 0;

  return (
    <Card className="mb-5 px-3 py-3.5">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setWeekOffset((v) => v - 1)}
          aria-label="Föregående vecka"
          className="px-1.5 text-xl leading-none text-white/70"
        >
          ←
        </button>
        <span className="text-[13px] font-bold text-white/55">Vecka {weekNumber}</span>
        <button
          type="button"
          onClick={() => setWeekOffset((v) => v + 1)}
          disabled={atCurrentWeek}
          aria-label="Nästa vecka"
          className={cn(
            'px-1.5 text-xl leading-none',
            atCurrentWeek ? 'text-white/15' : 'text-white/70',
          )}
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((dayDate, i) => {
          const isFuture = dayDate > today;
          const isSelected = dayDate === selectedDate;
          const isToday = dayDate === today;
          const hasLog = logDates.has(dayDate);
          const dayNum = dayDate.slice(-2).replace(/^0/, '');
          return (
            <button
              type="button"
              key={dayDate}
              disabled={isFuture}
              onClick={() => onSelect(dayDate)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-[10px] py-2 transition-colors',
                isSelected ? 'bg-hogalid-yellow' : 'bg-white/5',
                isFuture && 'opacity-30',
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-bold tracking-[0.5px]',
                  isSelected ? 'text-hogalid-dark' : 'text-white/45',
                )}
              >
                {DAY_LABELS[i]}
              </span>
              <span
                className={cn(
                  'text-[15px] font-bold',
                  isSelected
                    ? 'text-hogalid-dark'
                    : isToday
                      ? 'text-hogalid-yellow underline underline-offset-[3px]'
                      : 'text-white',
                )}
              >
                {dayNum}
              </span>
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  hasLog
                    ? isSelected
                      ? 'bg-hogalid-dark'
                      : 'bg-hogalid-yellow'
                    : 'bg-transparent',
                )}
              />
            </button>
          );
        })}
      </div>
    </Card>
  );
}

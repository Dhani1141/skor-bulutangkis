'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Timer, SkipForward } from 'lucide-react';

interface RestTimerProps {
  restEndTime: number; // timestamp ms
  onSkip: () => void;
}

function formatTime(ms: number) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function RestTimer({ restEndTime, onSkip }: RestTimerProps) {
  const [remaining, setRemaining] = useState(restEndTime - Date.now());

  const tick = useCallback(() => {
    const diff = restEndTime - Date.now();
    setRemaining(diff);
    if (diff <= 0) {
      onSkip();
    }
  }, [restEndTime, onSkip]);

  useEffect(() => {
    const id = setInterval(tick, 250);
    tick(); // immediate first tick
    return () => clearInterval(id);
  }, [tick]);

  const pct = Math.min(100, Math.max(0, (remaining / (5 * 60 * 1000)) * 100));
  const timeStr = formatTime(remaining);
  const isUrgent = remaining < 30_000;

  return (
    // Overlay backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-3xl overflow-hidden text-center py-10 px-8"
        style={{
          background: 'rgba(15,15,15,0.95)',
          border: `1px solid ${isUrgent ? 'rgba(255,49,49,0.4)' : 'rgba(255,184,0,0.25)'}`,
          boxShadow: `0 0 60px ${isUrgent ? 'rgba(255,49,49,0.15)' : 'rgba(255,184,0,0.1)'}`,
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute inset-x-0 top-0 h-0.5"
          style={{
            background: isUrgent
              ? 'linear-gradient(90deg, transparent, #FF3131, transparent)'
              : 'linear-gradient(90deg, transparent, #FFB800, transparent)',
          }}
        />

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: isUrgent ? 'rgba(255,49,49,0.1)' : 'rgba(255,184,0,0.08)',
              border: `1px solid ${isUrgent ? 'rgba(255,49,49,0.3)' : 'rgba(255,184,0,0.2)'}`,
            }}
          >
            <Timer
              className="w-8 h-8"
              style={{ color: isUrgent ? '#FF3131' : '#FFB800' }}
            />
          </div>
        </div>

        {/* Label */}
        <div
          className="text-[10px] font-black uppercase tracking-[0.3em] mb-3"
          style={{ color: isUrgent ? '#FF3131' : '#FFB800' }}
        >
          Waktu Istirahat
        </div>

        {/* Big timer */}
        <div
          className="text-7xl font-black font-mono mb-6 tabular-nums"
          style={{
            color: isUrgent ? '#FF3131' : '#F0F0F0',
            textShadow: isUrgent ? '0 0 30px rgba(255,49,49,0.5)' : 'none',
            letterSpacing: '-0.02em',
          }}
        >
          {timeStr}
        </div>

        {/* Progress ring/bar */}
        <div
          className="w-full h-1.5 rounded-full overflow-hidden mb-8 mx-auto"
          style={{ background: 'rgba(255,255,255,0.06)', maxWidth: '200px' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              background: isUrgent
                ? 'linear-gradient(90deg, #FF3131, #FF6B6B)'
                : 'linear-gradient(90deg, #FFB800, #FFD700)',
              boxShadow: `0 0 8px ${isUrgent ? '#FF313180' : '#FFB80080'}`,
            }}
          />
        </div>

        {/* Skip button */}
        <button
          onClick={onSkip}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#888',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.1)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,212,255,0.3)';
            (e.currentTarget as HTMLButtonElement).style.color = '#00D4FF';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
            (e.currentTarget as HTMLButtonElement).style.color = '#888';
          }}
        >
          <SkipForward className="w-4 h-4" />
          Lewati Istirahat
        </button>
      </div>
    </div>
  );
}

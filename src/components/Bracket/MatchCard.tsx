'use client';

import React from 'react';
import type { Match } from '@/types/tournament';
import { CheckCircle2, Clock4, Lock } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  onClick: () => void;
}

export default function MatchCard({ match, onClick }: MatchCardProps) {
  const { teamA, teamB, scoreA, scoreB, status, winner, id } = match;

  const isClickable = status !== 'finished' && teamA !== null && teamB !== null;
  const isFinished  = status === 'finished';
  const isOngoing   = status === 'ongoing';

  const winnerIsA = isFinished && winner?.id === teamA?.id;
  const winnerIsB = isFinished && winner?.id === teamB?.id;

  // Dynamic card class
  const cardClass = [
    'relative w-48 rounded-2xl overflow-hidden text-left transition-all duration-250 group select-none',
    'glass card-shadow',
    isClickable
      ? 'cursor-pointer hover:scale-[1.04] hover:border-[rgba(0,212,255,0.5)] hover:[box-shadow:0_0_24px_rgba(0,212,255,0.2),0_8px_32px_rgba(0,0,0,0.8)]'
      : '',
    isOngoing
      ? 'match-active'
      : isFinished
      ? 'match-winner'
      : 'opacity-60',
    !teamA || !teamB ? 'opacity-40 cursor-not-allowed' : '',
  ].join(' ');

  return (
    <button
      id={`match-${id}`}
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      title={
        !teamA || !teamB
          ? 'Menunggu tim lain...'
          : isFinished
          ? 'Pertandingan selesai'
          : 'Klik untuk buka papan skor'
      }
      className={cardClass}
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Top status bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{
          background: isFinished
            ? 'rgba(57,255,20,0.06)'
            : isOngoing
            ? 'rgba(255,184,0,0.08)'
            : 'rgba(255,255,255,0.03)',
          borderBottom: isFinished
            ? '1px solid rgba(57,255,20,0.15)'
            : isOngoing
            ? '1px solid rgba(255,184,0,0.2)'
            : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span className="text-[10px] font-mono tracking-widest uppercase"
          style={{ color: '#555' }}
        >
          {id}
        </span>
        <span className="flex items-center">
          {isFinished ? (
            <CheckCircle2 className="w-3 h-3" style={{ color: '#39FF14' }} />
          ) : isOngoing ? (
            <span className="w-2 h-2 rounded-full inline-block" style={{
              background: '#FFB800',
              boxShadow: '0 0 6px #FFB800',
              animation: 'neonBorderPulse 1.2s ease-in-out infinite',
            }} />
          ) : (
            <Clock4 className="w-3 h-3" style={{ color: '#444' }} />
          )}
        </span>
      </div>

      {/* Team A row */}
      <TeamRow
        name={teamA?.name ?? 'TBD'}
        score={isFinished || isOngoing ? scoreA : null}
        isWinner={winnerIsA}
        isLoser={winnerIsB}
        isEmpty={!teamA}
        side="A"
      />

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 12px' }} />

      {/* Team B row */}
      <TeamRow
        name={teamB?.name ?? 'TBD'}
        score={isFinished || isOngoing ? scoreB : null}
        isWinner={winnerIsB}
        isLoser={winnerIsA}
        isEmpty={!teamB}
        side="B"
      />

      {/* Finished lock indicator */}
      {isFinished && (
        <div className="absolute top-1.5 right-1.5">
          <Lock className="w-3 h-3" style={{ color: 'rgba(57,255,20,0.4)' }} />
        </div>
      )}

      {/* Hover ring glow */}
      {isClickable && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-250"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(0,212,255,0.35)' }}
        />
      )}
    </button>
  );
}

// ── Team Row ───────────────────────────────────────────────────────────────

interface TeamRowProps {
  name: string;
  score: number | null;
  isWinner: boolean;
  isLoser: boolean;
  isEmpty: boolean;
  side: 'A' | 'B';
}

function TeamRow({ name, score, isWinner, isLoser, isEmpty, side }: TeamRowProps) {
  const textColor = isEmpty
    ? '#333'
    : isWinner
    ? '#39FF14'
    : isLoser
    ? '#555'
    : '#E8E8E8';

  const scoreColor = isWinner ? '#39FF14' : isLoser ? '#444' : '#C0C0C0';

  return (
    <div
      className="flex items-center justify-between px-3 py-2.5"
      style={{
        background: isWinner
          ? 'rgba(57,255,20,0.05)'
          : 'transparent',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Side indicator pill */}
        <span
          className="text-[9px] font-black shrink-0 w-4 h-4 rounded flex items-center justify-center"
          style={{
            background: side === 'A'
              ? 'rgba(0,212,255,0.15)'
              : 'rgba(255,49,49,0.15)',
            color: side === 'A' ? '#00D4FF' : '#FF6B6B',
            border: `1px solid ${side === 'A' ? 'rgba(0,212,255,0.2)' : 'rgba(255,49,49,0.2)'}`,
          }}
        >
          {side}
        </span>
        <span
          className="text-sm font-semibold truncate max-w-[98px]"
          style={{
            color: textColor,
            fontStyle: isEmpty ? 'italic' : 'normal',
            textShadow: isWinner ? '0 0 10px rgba(57,255,20,0.4)' : 'none',
          }}
        >
          {isEmpty ? 'TBD' : name}
        </span>
      </div>
      <span
        className="text-sm font-black tabular-nums shrink-0 ml-2"
        style={{ color: scoreColor }}
      >
        {score !== null ? score : '–'}
      </span>
    </div>
  );
}

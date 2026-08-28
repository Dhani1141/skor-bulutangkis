'use client';

import React from 'react';
import type { Match } from '@/types/tournament';
import { CheckCircle, Clock, Lock } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  onClick: () => void;
}

/**
 * Kartu tampilan satu pertandingan di bracket.
 * Bisa diklik untuk membuka modal papan skor.
 */
export default function MatchCard({ match, onClick }: MatchCardProps) {
  const { teamA, teamB, scoreA, scoreB, status, winner, id } = match;

  const isClickable = status !== 'finished' && teamA !== null && teamB !== null;
  const isFinished = status === 'finished';
  const isPending = status === 'pending';
  const isOngoing = status === 'ongoing';

  const statusIcon = isFinished
    ? <CheckCircle className="w-3 h-3 text-green-400" />
    : isOngoing
    ? <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block" />
    : <Clock className="w-3 h-3 text-slate-500" />;

  const winnerIsA = isFinished && winner?.id === teamA?.id;
  const winnerIsB = isFinished && winner?.id === teamB?.id;

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
          : 'Klik untuk membuka papan skor'
      }
      className={`
        relative w-44 rounded-xl border overflow-hidden text-left
        transition-all duration-200 group
        ${isClickable
          ? 'border-blue-500/40 bg-gradient-to-b from-slate-800 to-slate-900 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.03] cursor-pointer active:scale-[0.98]'
          : isFinished
          ? 'border-green-500/30 bg-gradient-to-b from-slate-800/60 to-slate-900/60 cursor-default'
          : 'border-white/10 bg-slate-900/50 cursor-not-allowed opacity-60'}
      `}
    >
      {/* Status bar atas */}
      <div className={`flex items-center justify-between px-2.5 py-1.5 border-b
        ${isFinished ? 'bg-green-500/10 border-green-500/20' : isOngoing ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-white/5 border-white/10'}`}
      >
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{id}</span>
        <span className="flex items-center gap-1">{statusIcon}</span>
      </div>

      {/* Baris Tim A */}
      <TeamRow
        name={teamA?.name ?? '—'}
        score={isFinished || isOngoing ? scoreA : null}
        isWinner={winnerIsA}
        isEmpty={!teamA}
      />

      {/* Divider */}
      <div className="mx-2.5 h-px bg-white/10" />

      {/* Baris Tim B */}
      <TeamRow
        name={teamB?.name ?? '—'}
        score={isFinished || isOngoing ? scoreB : null}
        isWinner={winnerIsB}
        isEmpty={!teamB}
      />

      {/* Overlay lock jika finished */}
      {isFinished && (
        <div className="absolute top-1.5 right-1.5">
          <Lock className="w-3 h-3 text-green-400/60" />
        </div>
      )}

      {/* Hover glow */}
      {isClickable && (
        <div className="absolute inset-0 rounded-xl ring-1 ring-blue-400/0 group-hover:ring-blue-400/40 transition-all pointer-events-none" />
      )}
    </button>
  );
}

// ── Team Row Sub-component ─────────────────────────────────────────────────

interface TeamRowProps {
  name: string;
  score: number | null;
  isWinner: boolean;
  isEmpty: boolean;
}

function TeamRow({ name, score, isWinner, isEmpty }: TeamRowProps) {
  return (
    <div className={`flex items-center justify-between px-2.5 py-2.5
      ${isWinner ? 'bg-green-500/10' : ''}`}
    >
      <span className={`text-sm font-medium truncate max-w-[110px]
        ${isEmpty ? 'text-slate-600 italic' : isWinner ? 'text-green-300' : 'text-slate-200'}`}
      >
        {isEmpty ? 'TBD' : name}
        {isWinner && <span className="ml-1 text-xs text-yellow-400">👑</span>}
      </span>
      <span className={`text-sm font-bold tabular-nums ml-2
        ${isWinner ? 'text-green-400' : 'text-slate-300'}`}
      >
        {score !== null ? score : '–'}
      </span>
    </div>
  );
}

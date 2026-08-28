'use client';

import React, { useEffect, useCallback } from 'react';
import { useTournamentStore } from '@/store/tournamentStore';
import { checkWinner, isDeuce, isSuddenDeath, getMatchStatusText } from '@/lib/scoringLogic';
import { X, Trophy, ChevronRight, Minus, Plus } from 'lucide-react';

/**
 * Modal Papan Skor – antarmuka besar yang menutupi layar saat
 * pemain mengklik sebuah pertandingan di bracket.
 *
 * Menerapkan aturan BWF:
 * - Normal win: 21 poin dengan selisih ≥ 2
 * - Deuce     : 20-20 → lanjut sampai selisih 2
 * - Sudden Death: 29-29 → poin ke-30 langsung menang
 */
export default function ScoreboardModal() {
  const { getActiveMatch, incrementScore, saveMatch, closeMatch } = useTournamentStore();
  const match = getActiveMatch();

  // Tutup dengan tombol Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMatch();
    },
    [closeMatch]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!match) return null;

  const { teamA, teamB, scoreA, scoreB, winner, id } = match;
  const hasWinner = !!winner;
  const winnerIsA = hasWinner && winner?.id === teamA?.id;
  const winnerIsB = hasWinner && winner?.id === teamB?.id;

  const statusText = getMatchStatusText(scoreA, scoreB);
  const deuce = isDeuce(scoreA, scoreB);
  const suddenDeath = isSuddenDeath(scoreA, scoreB);

  // Warna latar tombol skor
  const btnAColor = winnerIsA
    ? 'from-green-600 to-green-500'
    : winnerIsB
    ? 'from-slate-700 to-slate-600'
    : 'from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500';

  const btnBColor = winnerIsB
    ? 'from-green-600 to-green-500'
    : winnerIsA
    ? 'from-slate-700 to-slate-600'
    : 'from-red-700 to-red-600 hover:from-red-600 hover:to-red-500';

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeMatch(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Papan skor pertandingan ${id}`}
    >
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div>
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Match {id}</span>
            <h2 className="text-lg font-bold text-white mt-0.5">Papan Skor</h2>
          </div>
          <button
            onClick={closeMatch}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-all"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Banner */}
        {statusText && (
          <div className={`text-center py-3 text-sm font-bold tracking-wide
            ${hasWinner ? 'bg-gradient-to-r from-yellow-600/30 via-yellow-500/20 to-yellow-600/30 text-yellow-300' :
              suddenDeath ? 'bg-red-500/20 text-red-300 animate-pulse' :
              deuce ? 'bg-orange-500/20 text-orange-300' : 'bg-white/5 text-slate-300'}
          `}>
            {statusText}
          </div>
        )}

        {/* Scoreboard Main Area */}
        <div className="grid grid-cols-2 gap-0 divide-x divide-white/10">
          {/* Tim A */}
          <ScoreSide
            teamName={teamA?.name ?? 'Tim A'}
            players={teamA?.players}
            score={scoreA}
            isWinner={winnerIsA}
            isLoser={winnerIsB}
            btnColor={btnAColor}
            disabled={hasWinner}
            side="A"
            onIncrement={() => incrementScore('A')}
          />

          {/* Tim B */}
          <ScoreSide
            teamName={teamB?.name ?? 'Tim B'}
            players={teamB?.players}
            score={scoreB}
            isWinner={winnerIsB}
            isLoser={winnerIsA}
            btnColor={btnBColor}
            disabled={hasWinner}
            side="B"
            onIncrement={() => incrementScore('B')}
          />
        </div>

        {/* Aturan Aktif */}
        <div className="px-6 py-3 bg-white/3 border-t border-white/10">
          <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
            <RuleChip label="Normal Win" desc="21 poin, unggul 2" active={!deuce && !suddenDeath && !hasWinner} />
            <RuleChip label="Deuce / Jus" desc="Selisih 2 dari 20+" active={deuce} color="orange" />
            <RuleChip label="Sudden Death" desc="Poin ke-30 menang" active={suddenDeath} color="red" />
          </div>
        </div>

        {/* Footer Aksi */}
        <div className="px-6 py-5 border-t border-white/10 bg-white/5">
          {hasWinner ? (
            <div className="space-y-3">
              {/* Winner announcement */}
              <div className="flex items-center justify-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="font-bold text-yellow-300 text-lg">
                  {winner?.name} Menang! {scoreA}-{scoreB}
                </span>
              </div>
              <button
                onClick={saveMatch}
                id="save-match-btn"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Simpan & Kembali ke Bracket
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <p className="text-center text-xs text-slate-500">
              Ketuk tombol skor untuk menambah poin · Tekan Esc untuk tutup tanpa menyimpan
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface ScoreSideProps {
  teamName: string;
  players?: [{ name: string }, { name: string }];
  score: number;
  isWinner: boolean;
  isLoser: boolean;
  btnColor: string;
  disabled: boolean;
  side: 'A' | 'B';
  onIncrement: () => void;
}

function ScoreSide({
  teamName,
  players,
  score,
  isWinner,
  isLoser,
  btnColor,
  disabled,
  side,
  onIncrement,
}: ScoreSideProps) {
  return (
    <div className={`flex flex-col items-center py-8 px-6 gap-5 transition-all
      ${isWinner ? 'bg-green-500/5' : isLoser ? 'opacity-50' : ''}`}
    >
      {/* Team name */}
      <div className="text-center">
        <div className={`text-xl font-extrabold ${isWinner ? 'text-green-300' : 'text-white'}`}>
          {teamName}
          {isWinner && <span className="ml-2">👑</span>}
        </div>
        {players && (
          <div className="text-xs text-slate-500 mt-1">
            {players[0].name} & {players[1].name}
          </div>
        )}
      </div>

      {/* Score display */}
      <div className={`text-8xl font-black tabular-nums leading-none
        ${isWinner ? 'text-green-400' : 'text-white'}`}
      >
        {score}
      </div>

      {/* +1 Button */}
      <button
        id={`score-btn-${side}`}
        onClick={onIncrement}
        disabled={disabled}
        className={`
          w-full py-4 rounded-2xl font-bold text-xl transition-all
          bg-gradient-to-b ${btnColor}
          shadow-lg active:scale-95
          ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-[1.03]'}
        `}
        aria-label={`Tambah poin ${teamName}`}
      >
        <div className="flex items-center justify-center gap-2">
          <Plus className="w-6 h-6" />
          <span>+1 Poin</span>
        </div>
      </button>
    </div>
  );
}

interface RuleChipProps {
  label: string;
  desc: string;
  active: boolean;
  color?: 'blue' | 'orange' | 'red';
}

function RuleChip({ label, desc, active, color = 'blue' }: RuleChipProps) {
  const colorClass = active
    ? color === 'orange'
      ? 'text-orange-400 border-orange-500/50 bg-orange-500/10'
      : color === 'red'
      ? 'text-red-400 border-red-500/50 bg-red-500/10'
      : 'text-blue-400 border-blue-500/50 bg-blue-500/10'
    : 'text-slate-600 border-white/5';

  return (
    <div className={`border rounded-lg px-3 py-1.5 transition-all ${colorClass}`}>
      <div className="font-semibold">{label}</div>
      <div className="text-[10px] opacity-70">{desc}</div>
    </div>
  );
}

'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useTournamentStore } from '@/store/tournamentStore';
import { checkWinner, isDeuce, isSuddenDeath, getMatchStatusText } from '@/lib/scoringLogic';
import { X, Trophy, ChevronRight, Plus } from 'lucide-react';

/**
 * ScoreboardModal – antarmuka papan skor fullscreen dengan estetika:
 * - Glassmorphism backdrop
 * - Fade-in animation saat buka
 * - Pulse animasi saat skor bertambah
 * - Aturan BWF: Normal win (21), Deuce (20-20), Sudden Death (29-29→30)
 */
export default function ScoreboardModal() {
  const { getActiveMatch, incrementScore, saveMatch, closeMatch } = useTournamentStore();
  const match = getActiveMatch();

  // ── Local state untuk trigger animasi pulse per skor ──────────
  // Tidak mengubah logika – murni UI trigger
  const [scoreKeyA, setScoreKeyA] = useState(0);
  const [scoreKeyB, setScoreKeyB] = useState(0);
  const prevScoreA = React.useRef(match?.scoreA ?? 0);
  const prevScoreB = React.useRef(match?.scoreB ?? 0);

  useEffect(() => {
    if (!match) return;
    if (match.scoreA !== prevScoreA.current) {
      setScoreKeyA((k) => k + 1);
      prevScoreA.current = match.scoreA;
    }
    if (match.scoreB !== prevScoreB.current) {
      setScoreKeyB((k) => k + 1);
      prevScoreB.current = match.scoreB;
    }
  }, [match?.scoreA, match?.scoreB]);

  // ── Keyboard ESC ──────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') closeMatch(); },
    [closeMatch]
  );
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!match) return null;

  const { teamA, teamB, scoreA, scoreB, winner, id } = match;
  const hasWinner  = !!winner;
  const winnerIsA  = hasWinner && winner?.id === teamA?.id;
  const winnerIsB  = hasWinner && winner?.id === teamB?.id;
  const deuce      = isDeuce(scoreA, scoreB);
  const suddenDeath = isSuddenDeath(scoreA, scoreB);

  return (
    /* ── Overlay ── */
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeMatch(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Papan skor match ${id}`}
    >
      {/* ── Panel ── */}
      <div
        className="modal-panel relative w-full max-w-2xl rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(14,14,14,0.92)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 80px rgba(0,0,0,0.9)',
        }}
      >
        {/* ── Top accent line ── */}
        <div className="h-px w-full" style={{
          background: hasWinner
            ? 'linear-gradient(90deg, transparent, #39FF14, transparent)'
            : deuce
            ? 'linear-gradient(90deg, transparent, #FFB800, transparent)'
            : 'linear-gradient(90deg, transparent, #00D4FF, transparent)',
        }} />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: '#444' }}>
              MATCH {id}
            </span>
            <h2 className="text-base font-bold mt-0.5" style={{ color: '#F0F0F0' }}>
              Papan Skor
            </h2>
          </div>
          <button
            onClick={closeMatch}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#666' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#F0F0F0'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#666'; }}
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Status Banner ── */}
        {(deuce || suddenDeath || hasWinner) && (
          <StatusBanner
            hasWinner={hasWinner}
            winnerName={winner?.name}
            scoreA={scoreA}
            scoreB={scoreB}
            deuce={deuce}
            suddenDeath={suddenDeath}
          />
        )}

        {/* ── Score Sides ── */}
        <div className="grid grid-cols-2 divide-x" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <ScoreSide
            teamName={teamA?.name ?? 'Tim A'}
            players={teamA?.players}
            score={scoreA}
            scoreAnimKey={scoreKeyA}
            isWinner={winnerIsA}
            isLoser={winnerIsB}
            hasWinner={hasWinner}
            side="A"
            onIncrement={() => incrementScore('A')}
          />
          <ScoreSide
            teamName={teamB?.name ?? 'Tim B'}
            players={teamB?.players}
            score={scoreB}
            scoreAnimKey={scoreKeyB}
            isWinner={winnerIsB}
            isLoser={winnerIsA}
            hasWinner={hasWinner}
            side="B"
            onIncrement={() => incrementScore('B')}
          />
        </div>

        {/* ── Rule Indicators ── */}
        <div
          className="flex items-center justify-center gap-3 px-6 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}
        >
          <RuleChip label="Normal" sub="Pertama 21, selisih 2" active={!deuce && !suddenDeath && !hasWinner} color="cyan" />
          <RuleChip label="Deuce"  sub="20-20 → selisih 2"    active={deuce}       color="amber" />
          <RuleChip label="Sudden" sub="29-29 → poin ke-30"   active={suddenDeath} color="red"   />
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {hasWinner ? (
            <div className="space-y-3">
              <div
                className="flex items-center justify-center gap-3 rounded-2xl px-4 py-3"
                style={{ background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.25)' }}
              >
                <Trophy className="w-5 h-5" style={{ color: '#FFD700' }} />
                <span className="font-black text-lg" style={{ color: '#39FF14', textShadow: '0 0 12px rgba(57,255,20,0.5)' }}>
                  {winner?.name} Menang! &nbsp;{scoreA}–{scoreB}
                </span>
              </div>
              <button
                onClick={saveMatch}
                id="save-match-btn"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #1a4a0a, #2d7a15)',
                  border: '1px solid rgba(57,255,20,0.4)',
                  color: '#39FF14',
                  boxShadow: '0 0 24px rgba(57,255,20,0.2)',
                }}
              >
                Simpan &amp; Kembali ke Bracket
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <p className="text-center text-xs" style={{ color: '#3A3A3A' }}>
              Ketuk tombol skor untuk menambah poin · Tekan <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: '#1E1E1E', border: '1px solid #333', color: '#666' }}>Esc</kbd> untuk keluar
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Status Banner ──────────────────────────────────────────────────────────

interface StatusBannerProps {
  hasWinner: boolean;
  winnerName?: string;
  scoreA: number;
  scoreB: number;
  deuce: boolean;
  suddenDeath: boolean;
}

function StatusBanner({ hasWinner, winnerName, scoreA, scoreB, deuce, suddenDeath }: StatusBannerProps) {
  const bg      = hasWinner ? 'rgba(57,255,20,0.06)'  : suddenDeath ? 'rgba(255,49,49,0.08)'   : 'rgba(255,184,0,0.08)';
  const border  = hasWinner ? 'rgba(57,255,20,0.2)'   : suddenDeath ? 'rgba(255,49,49,0.3)'    : 'rgba(255,184,0,0.25)';
  const textCls = hasWinner ? 'neon-green'             : suddenDeath ? 'neon-red'               : 'neon-amber';
  const text    = hasWinner
    ? `🏆  ${winnerName} Menang!`
    : suddenDeath
    ? '⚡ SUDDEN DEATH  —  Satu poin menentukan!'
    : '🔥 DEUCE  —  Butuh selisih 2 poin!';

  return (
    <div
      className={`text-center py-2.5 text-sm font-black tracking-wide ${textCls} ${suddenDeath && !hasWinner ? 'animate-pulse' : ''}`}
      style={{ background: bg, borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}
    >
      {text}
    </div>
  );
}

// ── Score Side ─────────────────────────────────────────────────────────────

interface ScoreSideProps {
  teamName: string;
  players?: [{ name: string }, { name: string }];
  score: number;
  scoreAnimKey: number;
  isWinner: boolean;
  isLoser: boolean;
  hasWinner: boolean;
  side: 'A' | 'B';
  onIncrement: () => void;
}

function ScoreSide({ teamName, players, score, scoreAnimKey, isWinner, isLoser, hasWinner, side, onIncrement }: ScoreSideProps) {
  const accentColor = side === 'A' ? '#00D4FF' : '#FF3131';
  const winnerColor = '#39FF14';

  const nameColor   = isWinner ? winnerColor : isLoser ? '#333' : '#F0F0F0';
  const scoreColor  = isWinner ? winnerColor : isLoser ? '#2A2A2A' : '#F0F0F0';
  const nameShadow  = isWinner ? '0 0 14px rgba(57,255,20,0.5)' : 'none';

  return (
    <div
      className="flex flex-col items-center py-8 px-5 gap-5 transition-all duration-300"
      style={{ background: isWinner ? 'rgba(57,255,20,0.04)' : isLoser ? 'rgba(0,0,0,0.2)' : 'transparent' }}
    >
      {/* Team name */}
      <div className="text-center">
        <div
          className="text-xl font-black leading-tight"
          style={{ color: nameColor, textShadow: nameShadow }}
        >
          {teamName}
          {isWinner && <span className="ml-2 text-base">👑</span>}
        </div>
        {players && (
          <div className="text-xs mt-1" style={{ color: '#3A3A3A' }}>
            {players[0].name} &amp; {players[1].name}
          </div>
        )}
      </div>

      {/* Score with pulse animation on change */}
      <div
        key={scoreAnimKey}
        className="score-pop tabular-nums font-black leading-none select-none"
        style={{
          fontSize: 'clamp(5rem, 14vw, 8rem)',
          color: scoreColor,
          textShadow: isWinner
            ? '0 0 30px rgba(57,255,20,0.5), 0 0 60px rgba(57,255,20,0.2)'
            : isLoser
            ? 'none'
            : `0 0 20px rgba(255,255,255,0.08)`,
          filter: isLoser ? 'blur(0px)' : 'none',
        }}
      >
        {score}
      </div>

      {/* +1 Button */}
      <button
        id={`score-btn-${side}`}
        onClick={onIncrement}
        disabled={hasWinner}
        className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 ${side === 'A' ? 'btn-score-a' : 'btn-score-b'}`}
        aria-label={`Tambah poin ${teamName}`}
      >
        <Plus className="w-5 h-5" />
        +1 Poin
      </button>
    </div>
  );
}

// ── Rule Chip ──────────────────────────────────────────────────────────────

interface RuleChipProps {
  label: string;
  sub: string;
  active: boolean;
  color: 'cyan' | 'amber' | 'red';
}

function RuleChip({ label, sub, active, color }: RuleChipProps) {
  const palette = {
    cyan:  { text: '#00D4FF', bg: 'rgba(0,212,255,0.08)',  border: 'rgba(0,212,255,0.3)'  },
    amber: { text: '#FFB800', bg: 'rgba(255,184,0,0.08)', border: 'rgba(255,184,0,0.3)'  },
    red:   { text: '#FF3131', bg: 'rgba(255,49,49,0.08)',  border: 'rgba(255,49,49,0.3)'  },
  };
  const p = palette[color];

  return (
    <div
      className="rounded-xl px-3 py-2 text-center transition-all duration-200"
      style={active
        ? { background: p.bg, border: `1px solid ${p.border}`, color: p.text }
        : { background: 'transparent', border: '1px solid rgba(255,255,255,0.04)', color: '#2A2A2A' }
      }
    >
      <div className="text-[11px] font-black uppercase tracking-wider">{label}</div>
      <div className="text-[9px] mt-0.5 opacity-70">{sub}</div>
    </div>
  );
}

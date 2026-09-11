'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useLeagueStore } from '@/store/leagueStore';
import { checkWinner, isMatchPoint } from '@/lib/scoringLogic';
import { X, Trophy, ChevronRight, Plus, Minus, AlertCircle } from 'lucide-react';

/**
 * ScoreboardModal – Papan skor fullscreen untuk sistem Liga (target 30 poin).
 *
 * Fitur kunci:
 * - Tombol [+] terkunci jika sudah ada pemenang
 * - Tombol [-] SELALU bisa diklik — jika match terkunci (finished) dan skor
 *   turun di bawah 30, match otomatis terbuka kembali (unlock)
 * - Keyboard shortcut: Esc untuk tutup
 */
export default function ScoreboardModal() {
  const { getActiveMatch, incrementScore, decrementScore, saveMatch, closeMatch } =
    useLeagueStore();
  const match = getActiveMatch();

  // ── Animasi pulse pada perubahan skor ─────────────────────────────────
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
  }, [match?.scoreA, match?.scoreB]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard ESC ──────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMatch();
    },
    [closeMatch],
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
  const matchPoint = isMatchPoint(scoreA, scoreB);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeMatch();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Papan skor pertandingan ${id}`}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(14,14,14,0.92)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 80px rgba(0,0,0,0.9)',
        }}
      >
        {/* ── Garis aksen atas ── */}
        <div
          className="h-px w-full"
          style={{
            background: hasWinner
              ? 'linear-gradient(90deg, transparent, #39FF14, transparent)'
              : matchPoint
                ? 'linear-gradient(90deg, transparent, #FFB800, transparent)'
                : 'linear-gradient(90deg, transparent, #00D4FF, transparent)',
          }}
        />

        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <span
              className="text-[10px] font-mono tracking-widest uppercase"
              style={{ color: '#444' }}
            >
              PERTANDINGAN {id}
            </span>
            <h2 className="text-base font-bold mt-0.5" style={{ color: '#F0F0F0' }}>
              Papan Skor · Target 30 Poin
            </h2>
          </div>
          <button
            onClick={closeMatch}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#666',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#F0F0F0';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#666';
            }}
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Banner Status ── */}
        {(matchPoint || hasWinner) && (
          <StatusBanner
            hasWinner={hasWinner}
            winnerName={winner?.name}
            matchPoint={matchPoint}
          />
        )}

        {/* ── Unlock notice saat match finished ── */}
        {hasWinner && (
          <div
            className="flex items-center justify-center gap-2 px-4 py-2 text-[11px]"
            style={{
              background: 'rgba(255,184,0,0.06)',
              color: '#888',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <AlertCircle className="w-3 h-3 text-[#FFB800]" />
            Tekan <strong className="text-[#FFB800] mx-1">[–]</strong> untuk mengoreksi skor dan membuka kembali pertandingan
          </div>
        )}

        {/* ── Sisi Skor ── */}
        <div
          className="grid grid-cols-2 divide-x"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
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
            onDecrement={() => decrementScore('A')}
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
            onDecrement={() => decrementScore('B')}
          />
        </div>

        {/* ── Progress Bar ke 30 ── */}
        <div
          className="px-6 py-3"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-600 w-8 text-right font-mono">{scoreA}</span>
            <div className="flex-1 h-2 rounded-full bg-[#111] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(scoreA / 30) * 100}%`,
                  background: winnerIsA
                    ? '#39FF14'
                    : 'linear-gradient(90deg, #00D4FF, #0088FF)',
                  boxShadow: winnerIsA ? '0 0 8px rgba(57,255,20,0.6)' : 'none',
                }}
              />
            </div>
            <span className="text-[10px] text-gray-600 font-mono">/ 30</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-gray-600 w-8 text-right font-mono">{scoreB}</span>
            <div className="flex-1 h-2 rounded-full bg-[#111] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(scoreB / 30) * 100}%`,
                  background: winnerIsB
                    ? '#39FF14'
                    : 'linear-gradient(90deg, #FF3131, #FF8800)',
                  boxShadow: winnerIsB ? '0 0 8px rgba(57,255,20,0.6)' : 'none',
                }}
              />
            </div>
            <span className="text-[10px] text-gray-600 font-mono">/ 30</span>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {hasWinner ? (
            <div className="space-y-3">
              <div
                className="flex items-center justify-center gap-3 rounded-2xl px-4 py-3"
                style={{
                  background: 'rgba(57,255,20,0.08)',
                  border: '1px solid rgba(57,255,20,0.25)',
                }}
              >
                <Trophy className="w-5 h-5" style={{ color: '#FFD700' }} />
                <span
                  className="font-black text-lg"
                  style={{
                    color: '#39FF14',
                    textShadow: '0 0 12px rgba(57,255,20,0.5)',
                  }}
                >
                  {winner?.name} Menang! &nbsp;{scoreA}–{scoreB}
                </span>
              </div>
              <button
                onClick={saveMatch}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #1a4a0a, #2d7a15)',
                  border: '1px solid rgba(57,255,20,0.4)',
                  color: '#39FF14',
                  boxShadow: '0 0 24px rgba(57,255,20,0.2)',
                }}
              >
                Simpan & Lanjut ke Pertandingan Berikutnya
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <p className="text-center text-xs" style={{ color: '#3A3A3A' }}>
              Ketuk tombol skor untuk menambah poin · Tekan{' '}
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{ background: '#1E1E1E', border: '1px solid #333', color: '#666' }}
              >
                Esc
              </kbd>{' '}
              untuk keluar
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
  matchPoint: boolean;
}

function StatusBanner({ hasWinner, winnerName, matchPoint }: StatusBannerProps) {
  const bg = hasWinner ? 'rgba(57,255,20,0.06)' : 'rgba(255,184,0,0.08)';
  const border = hasWinner ? 'rgba(57,255,20,0.2)' : 'rgba(255,184,0,0.25)';
  const textColor = hasWinner ? '#39FF14' : '#FFB800';
  const text = hasWinner
    ? `🏆  ${winnerName} Menang!`
    : '⚡ MATCH POINT! Satu poin lagi menentukan!';

  return (
    <div
      className={`text-center py-2.5 text-sm font-black tracking-wide ${!hasWinner && matchPoint ? 'animate-pulse' : ''}`}
      style={{
        background: bg,
        borderTop: `1px solid ${border}`,
        borderBottom: `1px solid ${border}`,
        color: textColor,
      }}
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
  onDecrement: () => void;
}

function ScoreSide({
  teamName,
  players,
  score,
  scoreAnimKey,
  isWinner,
  isLoser,
  hasWinner,
  side,
  onIncrement,
  onDecrement,
}: ScoreSideProps) {
  const accentColor = side === 'A' ? '#00D4FF' : '#FF3131';
  const winnerColor = '#39FF14';

  const nameColor = isWinner ? winnerColor : isLoser ? '#555' : '#F0F0F0';
  const playerColor = isWinner ? 'rgba(57,255,20,0.8)' : isLoser ? '#666' : '#A0A0A0';
  const scoreColor = isWinner ? winnerColor : isLoser ? '#2A2A2A' : '#F0F0F0';
  const nameShadow = isWinner ? '0 0 14px rgba(57,255,20,0.5)' : 'none';

  return (
    <div
      className="flex flex-col items-center py-8 px-5 gap-5 transition-all duration-300"
      style={{
        background: isWinner
          ? 'rgba(57,255,20,0.04)'
          : isLoser
            ? 'rgba(0,0,0,0.2)'
            : 'transparent',
      }}
    >
      {/* Nama tim */}
      <div className="text-center">
        <div
          className="text-xl font-black leading-tight"
          style={{ color: nameColor, textShadow: nameShadow }}
        >
          {teamName}
          {isWinner && <span className="ml-2 text-base">👑</span>}
        </div>
        {players && (
          <div className="text-sm font-semibold mt-1" style={{ color: playerColor }}>
            {players[0].name} & {players[1].name}
          </div>
        )}
      </div>

      {/* Skor dengan animasi pulse */}
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
        }}
      >
        {score}
      </div>

      {/* Tombol kontrol */}
      <div className="w-full flex flex-col gap-2">
        {/* Tombol [+]: disabled jika sudah ada pemenang */}
        <button
          id={`score-btn-${side}`}
          onClick={onIncrement}
          disabled={hasWinner}
          className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 ${
            side === 'A' ? 'btn-score-a' : 'btn-score-b'
          }`}
          aria-label={`Tambah poin ${teamName}`}
        >
          <Plus className="w-5 h-5" />
          +1 Poin
        </button>

        {/* Tombol [-]: SELALU aktif (bahkan saat match finished) agar bisa unlock */}
        <button
          onClick={onDecrement}
          disabled={score === 0}
          className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#A0A0A0' }}
          aria-label={`Kurangi poin ${teamName}${hasWinner ? ' (akan membuka kembali pertandingan)' : ''}`}
        >
          <Minus className="w-4 h-4" />
          Kurangi 1 Poin{hasWinner ? ' · Unlock' : ''}
        </button>
      </div>
    </div>
  );
}

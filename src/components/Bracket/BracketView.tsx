'use client';

import React from 'react';
import type { Match } from '@/types/tournament';
import { groupMatchesByRound } from '@/lib/bracketGenerator';
import MatchCard from './MatchCard';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Garis konektor horizontal ke kanan */
function ConnectorRight() {
  return (
    <div className="w-8 h-px bg-gradient-to-r from-slate-600 to-transparent absolute -right-8 top-1/2" />
  );
}

/** Hitung spacing vertikal antar match berdasarkan posisi ronde */
function getMatchSpacing(rounds: Match[][], roundIdx: number): number {
  const baseSpacing = 16;
  return baseSpacing * Math.pow(2, roundIdx);
}

// ── Upper Bracket + Grand Final (digabung satu baris) ─────────────────────

interface UpperAndGrandFinalProps {
  upperMatches: Match[];
  grandFinalMatches: Match[];
  onMatchClick: (matchId: string) => void;
}

/**
 * Merender Upper Bracket dan Grand Final dalam satu baris horizontal.
 * Grand Final muncul sebagai kolom terakhir setelah semua ronde upper,
 * sehingga terlihat sebagai kelanjutan alami dari upper bracket.
 */
function UpperAndGrandFinal({ upperMatches, grandFinalMatches, onMatchClick }: UpperAndGrandFinalProps) {
  const upperRounds = groupMatchesByRound(upperMatches, 'upper');
  const gfRounds = groupMatchesByRound(grandFinalMatches, 'grand_final');

  // Gabungkan ronde upper + grand final menjadi satu array kolom
  const allColumns: { matches: Match[]; label: string; isGF: boolean }[] = [
    ...upperRounds.map((roundMatches, rIdx) => ({
      matches: roundMatches,
      label: upperRounds.length === 1 ? 'Final' : `Ronde ${rIdx + 1}`,
      isGF: false,
    })),
    ...gfRounds.map((roundMatches) => ({
      matches: roundMatches,
      label: 'Grand Final',
      isGF: true,
    })),
  ];

  if (allColumns.length === 0) return null;

  return (
    <div className="mb-10">
      {/* Section Header */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/5 border border-blue-500/30 text-blue-300 text-sm font-semibold mb-6">
        🏅 Upper Bracket
      </div>

      {/* Semua kolom dalam satu flex row */}
      <div className="flex items-start gap-10 overflow-x-auto pb-4">
        {allColumns.map((col, colIdx) => {
          // Untuk spacing, Grand Final dihitung berdasarkan posisi di array gabungan
          const spacingIdx = colIdx;

          return (
            <div key={colIdx} className="flex flex-col items-center gap-1 shrink-0">
              {/* Label kolom */}
              <div className={`text-[11px] font-mono mb-3 uppercase tracking-widest ${
                col.isGF ? 'text-yellow-500 font-bold' : 'text-slate-500'
              }`}>
                {col.label}
                {col.isGF && <span className="ml-1">🏆</span>}
              </div>

              {/* Match cards */}
              <div
                className="flex flex-col"
                style={{
                  gap: `${getMatchSpacing(
                    allColumns.map((c) => c.matches),
                    spacingIdx
                  )}px`,
                }}
              >
                {col.matches.map((match) => (
                  <div key={match.id} className="relative flex items-center">
                    <MatchCard
                      match={match}
                      onClick={() => onMatchClick(match.id)}
                    />
                    {/* Konektor ke kolom berikutnya (kecuali kolom terakhir) */}
                    {colIdx < allColumns.length - 1 && <ConnectorRight />}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Lower Bracket ──────────────────────────────────────────────────────────

interface LowerBracketProps {
  matches: Match[];
  onMatchClick: (matchId: string) => void;
}

function LowerBracket({ matches, onMatchClick }: LowerBracketProps) {
  const rounds = groupMatchesByRound(matches, 'lower');
  if (rounds.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-purple-600/5 border border-purple-500/30 text-purple-300 text-sm font-semibold mb-6">
        ⚔️ Lower Bracket
      </div>

      <div className="flex items-start gap-10 overflow-x-auto pb-4">
        {rounds.map((roundMatches, rIdx) => (
          <div key={rIdx} className="flex flex-col items-center gap-1 shrink-0">
            <div className="text-[11px] text-slate-500 font-mono mb-3 uppercase tracking-widest">
              Ronde {rIdx + 1}
            </div>
            <div
              className="flex flex-col"
              style={{ gap: `${getMatchSpacing(rounds, rIdx)}px` }}
            >
              {roundMatches.map((match) => (
                <div key={match.id} className="relative flex items-center">
                  <MatchCard
                    match={match}
                    onClick={() => onMatchClick(match.id)}
                  />
                  {rIdx < rounds.length - 1 && <ConnectorRight />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main BracketView ───────────────────────────────────────────────────────

interface BracketViewProps {
  matches: Match[];
  onMatchClick: (matchId: string) => void;
}

export default function BracketView({ matches, onMatchClick }: BracketViewProps) {
  const upperMatches = matches.filter((m) => m.bracket === 'upper');
  const lowerMatches = matches.filter((m) => m.bracket === 'lower');
  const grandFinalMatches = matches.filter((m) => m.bracket === 'grand_final');

  return (
    <div className="space-y-4">
      {/* Upper Bracket + Grand Final dalam satu baris */}
      <UpperAndGrandFinal
        upperMatches={upperMatches}
        grandFinalMatches={grandFinalMatches}
        onMatchClick={onMatchClick}
      />

      {/* Lower Bracket (di bawah, dipisah dengan garis) */}
      {lowerMatches.length > 0 && (
        <>
          <div className="border-t border-white/10 pt-4" />
          <LowerBracket matches={lowerMatches} onMatchClick={onMatchClick} />
        </>
      )}
    </div>
  );
}

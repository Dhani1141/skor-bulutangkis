'use client';

import React from 'react';
import type { Match } from '@/types/tournament';
import { groupMatchesByRound } from '@/lib/bracketGenerator';
import MatchCard from './MatchCard';

interface BracketSectionProps {
  title: string;
  bracket: 'upper' | 'lower' | 'grand_final';
  matches: Match[];
  onMatchClick: (matchId: string) => void;
  accentColor?: string;
}

/**
 * BracketSection merender satu bagian bracket (Upper/Lower/Grand Final)
 * sebagai deretan ronde dari kiri ke kanan.
 */
function BracketSection({ title, bracket, matches, onMatchClick, accentColor = 'blue' }: BracketSectionProps) {
  const rounds = groupMatchesByRound(matches, bracket);

  if (rounds.length === 0) return null;

  const colorMap: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-300',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30 text-purple-300',
    yellow: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30 text-yellow-300',
  };

  return (
    <div className="mb-10">
      {/* Section Header */}
      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r border mb-6 text-sm font-semibold ${colorMap[accentColor] ?? colorMap.blue}`}>
        {title}
      </div>

      {/* Rounds container */}
      <div className="flex items-start gap-10 overflow-x-auto pb-4">
        {rounds.map((roundMatches, rIdx) => (
          <div key={rIdx} className="flex flex-col items-center gap-1 shrink-0">
            {/* Round label */}
            <div className="text-[11px] text-slate-500 font-mono mb-3 uppercase tracking-widest">
              {bracket === 'grand_final'
                ? 'Grand Final'
                : `Ronde ${rIdx + 1}`}
            </div>

            {/* Matches di ronde ini dengan spacing vertikal proporsional */}
            <div
              className="flex flex-col"
              style={{
                gap: `${getMatchSpacing(rounds, rIdx)}px`,
              }}
            >
              {roundMatches.map((match) => (
                <div key={match.id} className="relative flex items-center">
                  <MatchCard
                    match={match}
                    onClick={() => onMatchClick(match.id)}
                  />
                  {/* Connector line ke kanan (ke ronde berikutnya) */}
                  {rIdx < rounds.length - 1 && (
                    <ConnectorRight />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Garis konektor sederhana ke kanan */
function ConnectorRight() {
  return (
    <div className="w-8 h-px bg-gradient-to-r from-slate-600 to-transparent absolute -right-8 top-1/2" />
  );
}

/** Hitung spacing antar match berdasarkan posisi ronde */
function getMatchSpacing(rounds: Match[][], roundIdx: number): number {
  const baseSpacing = 16;
  return baseSpacing * Math.pow(2, roundIdx);
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
      {/* Upper Bracket */}
      <BracketSection
        title="🏅 Upper Bracket"
        bracket="upper"
        matches={upperMatches}
        onMatchClick={onMatchClick}
        accentColor="blue"
      />

      {/* Lower Bracket */}
      {lowerMatches.length > 0 && (
        <>
          <div className="border-t border-white/10 pt-4" />
          <BracketSection
            title="⚔️ Lower Bracket"
            bracket="lower"
            matches={lowerMatches}
            onMatchClick={onMatchClick}
            accentColor="purple"
          />
        </>
      )}

      {/* Grand Final */}
      {grandFinalMatches.length > 0 && (
        <>
          <div className="border-t border-white/10 pt-4" />
          <BracketSection
            title="🏆 Grand Final"
            bracket="grand_final"
            matches={grandFinalMatches}
            onMatchClick={onMatchClick}
            accentColor="yellow"
          />
        </>
      )}
    </div>
  );
}

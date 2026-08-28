'use client';

import React from 'react';
import type { Match } from '@/types/tournament';
import { groupMatchesByRound } from '@/lib/bracketGenerator';
import MatchCard from './MatchCard';

// ── Curved SVG Connector ───────────────────────────────────────────────────

/**
 * Garis konektor melengkung (bezier kurva) antar kolom match.
 * Warna berubah jadi neon amber jika match tujuan sedang berlangsung.
 */
interface ConnectorProps {
  isTargetActive?: boolean;
  isTargetFinished?: boolean;
}

function CurvedConnector({ isTargetActive, isTargetFinished }: ConnectorProps) {
  const strokeColor = isTargetActive
    ? '#FFB800'
    : isTargetFinished
    ? 'rgba(57,255,20,0.35)'
    : 'rgba(60,60,60,0.9)';

  const glowFilter = isTargetActive
    ? 'drop-shadow(0 0 3px rgba(255,184,0,0.8)) drop-shadow(0 0 6px rgba(255,184,0,0.4))'
    : isTargetFinished
    ? 'drop-shadow(0 0 2px rgba(57,255,20,0.5))'
    : 'none';

  return (
    <div className="absolute flex items-center justify-center pointer-events-none"
      style={{ right: '-40px', top: '50%', transform: 'translateY(-50%)', width: 40, height: 20 }}
    >
      <svg
        width="40"
        height="20"
        viewBox="0 0 40 20"
        fill="none"
        className="connector-svg"
        style={{ filter: glowFilter, overflow: 'visible' }}
      >
        {/* Gentle S-curve: starts center-left, curves slightly then straightens */}
        <path
          d="M 0 10 C 12 6 28 14 40 10"
          stroke={strokeColor}
          strokeWidth={isTargetActive ? 1.8 : 1.2}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// ── Section Label ──────────────────────────────────────────────────────────

interface SectionLabelProps {
  children: React.ReactNode;
  color: 'cyan' | 'purple' | 'gold';
}

function SectionLabel({ children, color }: SectionLabelProps) {
  const styles = {
    cyan:   { bg: 'rgba(0,212,255,0.06)',  border: 'rgba(0,212,255,0.25)',  text: '#00D4FF' },
    purple: { bg: 'rgba(168,85,247,0.06)', border: 'rgba(168,85,247,0.25)', text: '#A855F7' },
    gold:   { bg: 'rgba(255,215,0,0.08)',  border: 'rgba(255,215,0,0.3)',   text: '#FFD700' },
  };
  const s = styles[color];

  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 uppercase tracking-widest"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}
    >
      {children}
    </div>
  );
}

// ── Round Column ───────────────────────────────────────────────────────────

interface RoundColumnProps {
  matches: Match[];
  label: string;
  isGF?: boolean;
  isLast: boolean;
  spacing: number;
  allMatches: Match[]; // to check next-match status
  onMatchClick: (id: string) => void;
}

function RoundColumn({ matches, label, isGF, isLast, spacing, allMatches, onMatchClick }: RoundColumnProps) {
  return (
    <div className="flex flex-col items-center shrink-0">
      {/* Column label */}
      <div
        className="text-[10px] font-mono mb-4 uppercase tracking-[0.2em]"
        style={{ color: isGF ? '#FFD700' : '#3A3A3A' }}
      >
        {label}
        {isGF && <span className="ml-1">✦</span>}
      </div>

      <div className="flex flex-col" style={{ gap: `${spacing}px` }}>
        {matches.map((match) => {
          // Check if next winner match is active/finished (for connector glow)
          const nextWinMatch = match.nextMatchWinnerId
            ? allMatches.find((m) => m.id === match.nextMatchWinnerId)
            : null;
          const targetActive   = nextWinMatch?.status === 'ongoing';
          const targetFinished = nextWinMatch?.status === 'finished';

          return (
            <div key={match.id} className="relative flex items-center">
              <MatchCard match={match} onClick={() => onMatchClick(match.id)} />
              {!isLast && (
                <CurvedConnector
                  isTargetActive={targetActive}
                  isTargetFinished={targetFinished}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Upper Bracket + Grand Final (same row) ─────────────────────────────────

interface UpperAndGFProps {
  upperMatches: Match[];
  grandFinalMatches: Match[];
  allMatches: Match[];
  onMatchClick: (id: string) => void;
}

function UpperAndGrandFinal({ upperMatches, grandFinalMatches, allMatches, onMatchClick }: UpperAndGFProps) {
  const upperRounds = groupMatchesByRound(upperMatches, 'upper');
  const gfRounds    = groupMatchesByRound(grandFinalMatches, 'grand_final');

  const allColumns: { matches: Match[]; label: string; isGF: boolean }[] = [
    ...upperRounds.map((r, i) => ({
      matches: r,
      label:
        upperRounds.length === 1
          ? 'Final'
          : i === upperRounds.length - 1
          ? 'Upper Final'
          : `Ronde ${i + 1}`,
      isGF: false,
    })),
    ...gfRounds.map(() => ({ matches: grandFinalMatches, label: 'Grand Final', isGF: true })),
  ];

  if (allColumns.length === 0) return null;

  return (
    <div className="mb-10">
      <SectionLabel color="cyan">🏅 Upper Bracket</SectionLabel>

      <div className="flex items-start overflow-x-auto pb-6" style={{ gap: '48px' }}>
        {allColumns.map((col, colIdx) => {
          const baseSpacing = 20;
          const spacing = col.isGF
            ? 0
            : baseSpacing * Math.pow(2, colIdx);

          return (
            <RoundColumn
              key={colIdx}
              matches={col.matches}
              label={col.label}
              isGF={col.isGF}
              isLast={colIdx === allColumns.length - 1}
              spacing={spacing}
              allMatches={allMatches}
              onMatchClick={onMatchClick}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Lower Bracket ──────────────────────────────────────────────────────────

interface LowerBracketProps {
  matches: Match[];
  allMatches: Match[];
  onMatchClick: (id: string) => void;
}

function LowerBracket({ matches, allMatches, onMatchClick }: LowerBracketProps) {
  const rounds = groupMatchesByRound(matches, 'lower');
  if (rounds.length === 0) return null;

  return (
    <div className="mb-6">
      <SectionLabel color="purple">⚔️ Lower Bracket</SectionLabel>

      <div className="flex items-start overflow-x-auto pb-6" style={{ gap: '48px' }}>
        {rounds.map((roundMatches, rIdx) => {
          const spacing = 20 * Math.pow(2, rIdx);
          return (
            <RoundColumn
              key={rIdx}
              matches={roundMatches}
              label={`Ronde ${rIdx + 1}`}
              isLast={rIdx === rounds.length - 1}
              spacing={spacing}
              allMatches={allMatches}
              onMatchClick={onMatchClick}
            />
          );
        })}
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
  const upperMatches      = matches.filter((m) => m.bracket === 'upper');
  const lowerMatches      = matches.filter((m) => m.bracket === 'lower');
  const grandFinalMatches = matches.filter((m) => m.bracket === 'grand_final');

  return (
    <div>
      {/* Upper Bracket + Grand Final — same horizontal flow */}
      <UpperAndGrandFinal
        upperMatches={upperMatches}
        grandFinalMatches={grandFinalMatches}
        allMatches={matches}
        onMatchClick={onMatchClick}
      />

      {/* Lower Bracket — below, separated by a styled divider */}
      {lowerMatches.length > 0 && (
        <>
          {/* Divider */}
          <div className="relative my-6 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(168,85,247,0.3), transparent)' }} />
            <span className="text-[10px] font-mono uppercase tracking-widest shrink-0" style={{ color: '#444' }}>
              losers path
            </span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(168,85,247,0.3), transparent)' }} />
          </div>

          <LowerBracket matches={lowerMatches} allMatches={matches} onMatchClick={onMatchClick} />
        </>
      )}
    </div>
  );
}

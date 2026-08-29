'use client';

import React from 'react';
import type { Match } from '@/types/tournament';

interface MatchQueueBannerProps {
  queue: Match[];
  isResting: boolean;
}

function TeamLabel({ match, slot }: { match: Match; slot: 'A' | 'B' }) {
  const team = slot === 'A' ? match.teamA : match.teamB;
  if (!team) return <span style={{ color: '#555' }}>TBD</span>;
  return (
    <span className="font-black" style={{ color: '#F0F0F0' }}>
      {team.players[0].name} & {team.players[1].name}
    </span>
  );
}

function BracketBadge({ match }: { match: Match }) {
  const label =
    match.bracket === 'upper'
      ? 'UB'
      : match.bracket === 'lower'
      ? 'LB'
      : 'GF';
  const color =
    match.bracket === 'upper'
      ? '#00D4FF'
      : match.bracket === 'lower'
      ? '#A855F7'
      : '#FFD700';
  return (
    <span
      className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest"
      style={{ color, background: `${color}18`, border: `1px solid ${color}40` }}
    >
      {label} R{match.round}
    </span>
  );
}

export default function MatchQueueBanner({ queue, isResting }: MatchQueueBannerProps) {
  const nowPlaying = queue[0] ?? null;
  const upNext = queue[1] ?? null;

  if (!nowPlaying && !isResting) return null;

  return (
    <div
      className="rounded-2xl mb-6 overflow-hidden"
      style={{
        background: 'rgba(13,13,13,0.8)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* NOW PLAYING */}
        <div className="px-6 py-4 flex items-center gap-4">
          {/* Pulsing dot */}
          <div className="relative shrink-0">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: '#FF3131', boxShadow: '0 0 10px #FF3131' }}
            />
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: '#FF313140' }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div
              className="text-[9px] font-black uppercase tracking-[0.25em] mb-1.5"
              style={{ color: '#FF3131' }}
            >
              🔴 Sedang Main
            </div>
            {nowPlaying ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <BracketBadge match={nowPlaying} />
                <TeamLabel match={nowPlaying} slot="A" />
                <span style={{ color: '#444' }}>vs</span>
                <TeamLabel match={nowPlaying} slot="B" />
              </div>
            ) : (
              <span className="text-sm" style={{ color: '#555' }}>—</span>
            )}
          </div>
        </div>

        {/* UP NEXT */}
        <div className="px-6 py-4 flex items-center gap-4">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: '#FFB800', boxShadow: '0 0 8px #FFB80060' }}
          />
          <div className="flex-1 min-w-0">
            <div
              className="text-[9px] font-black uppercase tracking-[0.25em] mb-1.5"
              style={{ color: '#FFB800' }}
            >
              🟡 Selanjutnya
            </div>
            {upNext ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <BracketBadge match={upNext} />
                <TeamLabel match={upNext} slot="A" />
                <span style={{ color: '#444' }}>vs</span>
                <TeamLabel match={upNext} slot="B" />
              </div>
            ) : (
              <span className="text-sm" style={{ color: '#555' }}>—</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

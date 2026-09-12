'use client';

import React from 'react';
import { Zap, CheckCircle2, Clock, PlayCircle, ChevronRight } from 'lucide-react';
import { useLeagueStore } from '@/store/leagueStore';
import type { LeagueMatch } from '@/types/league';

interface LeagueViewProps {
  onOpenMatch: (matchId: string) => void;
}

/**
 * LeagueView – Tampilan utama jadwal liga round-robin.
 *
 * Menampilkan:
 * - Pertandingan aktif (ongoing) di bagian atas
 * - Antrean berikutnya (next up)
 * - Semua ronde dengan status per pertandingan
 * - Tombol "Mulai" hanya untuk match pending berikutnya
 */
export default function LeagueView({ onOpenMatch }: LeagueViewProps) {
  const store = useLeagueStore();
  const { matches, getActiveMatch, getUpcomingMatches, phase } = store;

  const activeMatch = getActiveMatch();
  const upcoming = getUpcomingMatches();
  const nextMatch = upcoming[0] ?? null;
  const afterNext = upcoming[1] ?? null;

  // Kelompokkan semua match per ronde
  const maxRound = matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;
  const rounds: LeagueMatch[][] = [];
  for (let r = 1; r <= maxRound; r++) {
    const roundMatches = matches
      .filter((m) => m.round === r)
      .sort((a, b) => a.position - b.position);
    if (roundMatches.length > 0) rounds.push(roundMatches);
  }

  if (phase !== 'league' && phase !== 'finished') return null;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Info Bar Aktif / Berikutnya ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pertandingan aktif atau yang akan segera dimulai */}
        <ActiveMatchCard
          match={activeMatch ?? nextMatch}
          isTrulyActive={!!activeMatch}
          onOpen={onOpenMatch}
        />
        {/* Pertandingan berikutnya */}
        <NextMatchCard match={activeMatch ? nextMatch : afterNext} />
      </div>

      {/* ── Jadwal Lengkap Per Ronde ── */}
      <div className="space-y-4">
        {rounds.map((roundMatches, ri) => (
          <RoundBlock
            key={ri}
            roundNumber={ri + 1}
            matches={roundMatches}
            nextMatchId={nextMatch?.id ?? null}
            activeMatchId={activeMatch?.id ?? null}
            onOpenMatch={onOpenMatch}
          />
        ))}
      </div>
    </div>
  );
}

// ── Card: Pertandingan Aktif ───────────────────────────────────────────────

function ActiveMatchCard({
  match,
  isTrulyActive,
  onOpen,
}: {
  match: LeagueMatch | null;
  isTrulyActive: boolean;
  onOpen: (id: string) => void;
}) {
  const color = isTrulyActive ? '#FFB800' : '#00D4FF';
  const label = isTrulyActive ? 'SEDANG BERLANGSUNG' : 'SEGERA DIMULAI';

  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{
        background: '#0b0e12',
        border: `1px solid ${color}30`,
        boxShadow: `0 0 20px ${color}08`,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
      <div className="flex justify-between items-center mb-3">
        <span
          className="text-xs font-bold tracking-widest uppercase flex items-center gap-2"
          style={{ color }}
        >
          <Zap className="w-3 h-3" />
          {label}
        </span>
        {match && (
          <span className="text-gray-600 text-[10px] font-mono">{match.id}</span>
        )}
      </div>

      {match ? (
        <>
          <div
            className="flex items-center justify-between rounded-lg px-3 py-2 mb-3"
            style={{ background: '#1f252d', border: '1px solid #2d3748' }}
          >
            <TeamLabel team={match.teamA} />
            <span className="text-gray-600 text-xs font-black px-2">VS</span>
            <TeamLabel team={match.teamB} align="right" />
          </div>
          {!isTrulyActive && (
            <button
              onClick={() => onOpen(match.id)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition hover:opacity-90"
              style={{
                background: `${color}18`,
                border: `1px solid ${color}40`,
                color,
              }}
            >
              <PlayCircle className="w-4 h-4" />
              Mulai Pertandingan
            </button>
          )}
        </>
      ) : (
        <div className="text-gray-600 text-xs text-center py-4">Tidak ada pertandingan</div>
      )}
    </div>
  );
}

// ── Card: Match Berikutnya ─────────────────────────────────────────────────

function NextMatchCard({ match }: { match: LeagueMatch | null }) {
  return (
    <div
      className="rounded-xl p-4 relative"
      style={{ background: '#0b0e12', border: '1px solid #1f2937' }}
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-gray-500 text-xs font-bold tracking-widest uppercase">
          PERTANDINGAN BERIKUTNYA
        </span>
        {match && (
          <span className="text-gray-700 text-[10px] font-mono">{match.id}</span>
        )}
      </div>
      {match ? (
        <div
          className="flex items-center justify-between rounded-lg px-3 py-2"
          style={{ background: '#1a1f26', border: '1px solid #2d3748' }}
        >
          <TeamLabel team={match.teamA} dimmed />
          <span className="text-gray-700 text-xs font-black px-2">VS</span>
          <TeamLabel team={match.teamB} align="right" dimmed />
        </div>
      ) : (
        <div className="text-gray-700 text-xs text-center py-4">—</div>
      )}
    </div>
  );
}

// ── Block per Ronde ────────────────────────────────────────────────────────

function RoundBlock({
  roundNumber,
  matches,
  nextMatchId,
  activeMatchId,
  onOpenMatch,
}: {
  roundNumber: number;
  matches: LeagueMatch[];
  nextMatchId: string | null;
  activeMatchId: string | null;
  onOpenMatch: (id: string) => void;
}) {
  const allFinished = matches.every((m) => m.status === 'finished');
  const hasOngoing = matches.some((m) => m.status === 'ongoing');

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: hasOngoing
          ? '1px solid rgba(255,184,0,0.2)'
          : allFinished
            ? '1px solid rgba(57,255,20,0.1)'
            : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Header ronde */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{
          background: hasOngoing
            ? 'rgba(255,184,0,0.06)'
            : allFinished
              ? 'rgba(57,255,20,0.04)'
              : 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <span className="text-xs font-bold tracking-widest uppercase text-gray-400">
          Ronde {roundNumber}
        </span>
        {allFinished && (
          <span className="text-[10px] text-green-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Selesai
          </span>
        )}
        {hasOngoing && (
          <span className="text-[10px] text-[#FFB800] flex items-center gap-1 animate-pulse">
            <Zap className="w-3 h-3" />
            Berlangsung
          </span>
        )}
      </div>

      {/* Pertandingan dalam ronde */}
      <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
        {matches.map((m) => (
          <MatchRow
            key={m.id}
            match={m}
            isNext={m.id === nextMatchId}
            isActive={m.id === activeMatchId}
            onOpen={onOpenMatch}
          />
        ))}
      </div>
    </div>
  );
}

// ── Baris Match ────────────────────────────────────────────────────────────

function MatchRow({
  match,
  isNext,
  isActive,
  onOpen,
}: {
  match: LeagueMatch;
  isNext: boolean;
  isActive: boolean;
  onOpen: (id: string) => void;
}) {
  const { id, teamA, teamB, scoreA, scoreB, status, winner } = match;

  const statusConfig = {
    pending: { color: '#4b5563', label: 'Menunggu', icon: <Clock className="w-3 h-3" /> },
    ongoing: { color: '#FFB800', label: 'Berlangsung', icon: <Zap className="w-3 h-3" /> },
    finished: { color: '#39FF14', label: 'Selesai', icon: <CheckCircle2 className="w-3 h-3" /> },
  };

  const cfg = statusConfig[status];
  const canOpen = (status === 'pending' && isNext) || status === 'ongoing';

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 transition-colors"
      style={{
        background: isActive
          ? 'rgba(255,184,0,0.04)'
          : isNext
            ? 'rgba(0,212,255,0.03)'
            : 'transparent',
      }}
    >
      {/* Match ID */}
      <span className="text-[10px] text-gray-600 font-mono w-8 shrink-0">{id}</span>

      {/* Tim A */}
      <div className="flex-1 text-right">
        <div
          className="text-xs font-bold"
          style={{
            color:
              status === 'finished'
                ? winner?.id === teamA.id
                  ? '#39FF14'
                  : '#4b5563'
                : '#e5e7eb',
          }}
        >
          {teamA.name}
        </div>
        <div className="text-[10px] text-gray-600 truncate max-w-[120px] ml-auto">
          {teamA.players[0].name} & {teamA.players[1].name}
        </div>
      </div>

      {/* Skor tengah */}
      <div className="text-center shrink-0 w-16">
        {status === 'finished' ? (
          <span className="font-black text-sm text-gray-200">
            {scoreA} – {scoreB}
          </span>
        ) : status === 'ongoing' ? (
          <span
            className="font-black text-sm animate-pulse"
            style={{ color: '#FFB800' }}
          >
            {scoreA} – {scoreB}
          </span>
        ) : (
          <span className="text-gray-600 text-xs font-bold">VS</span>
        )}
      </div>

      {/* Tim B */}
      <div className="flex-1">
        <div
          className="text-xs font-bold"
          style={{
            color:
              status === 'finished'
                ? winner?.id === teamB.id
                  ? '#39FF14'
                  : '#4b5563'
                : '#e5e7eb',
          }}
        >
          {teamB.name}
        </div>
        <div className="text-[10px] text-gray-600 truncate max-w-[120px]">
          {teamB.players[0].name} & {teamB.players[1].name}
        </div>
      </div>

      {/* Status / Aksi */}
      <div className="shrink-0">
        {canOpen ? (
          <button
            onClick={() => onOpen(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
            style={{
              background: status === 'ongoing' ? 'rgba(255,184,0,0.1)' : 'rgba(0,212,255,0.1)',
              border: status === 'ongoing' ? '1px solid rgba(255,184,0,0.3)' : '1px solid rgba(0,212,255,0.3)',
              color: status === 'ongoing' ? '#FFB800' : '#00D4FF',
            }}
          >
            {status === 'ongoing' ? 'Lanjut' : 'Mulai'} <ChevronRight className="w-3 h-3" />
          </button>
        ) : (
          <span
            className="flex items-center gap-1 text-[10px] font-bold"
            style={{ color: cfg.color }}
          >
            {cfg.icon}
            <span className="hidden sm:inline">{cfg.label}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ── Helper: label nama tim ─────────────────────────────────────────────────

function TeamLabel({
  team,
  align = 'left',
  dimmed = false,
}: {
  team: LeagueMatch['teamA'];
  align?: 'left' | 'right';
  dimmed?: boolean;
}) {
  return (
    <div className={`flex-1 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <div
        className="text-sm font-bold"
        style={{ color: dimmed ? '#6b7280' : '#e5e7eb' }}
      >
        {team.name}
      </div>
      <div className="text-[10px] text-gray-600">
        {team.players[0].name} & {team.players[1].name}
      </div>
    </div>
  );
}

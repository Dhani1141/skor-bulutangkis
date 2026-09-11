'use client';

import React, { useState } from 'react';
import { Pencil, Trophy, ArrowUp, ArrowDown, Minus as Dash } from 'lucide-react';
import { useLeagueStore } from '@/store/leagueStore';
import type { TeamStanding } from '@/types/league';
import PlayerEditModal from '@/components/League/PlayerEditModal';

/**
 * StandingsTable – Tabel Klasemen Liga
 *
 * Menampilkan peringkat semua tim dengan statistik lengkap.
 * Setiap nama pemain memiliki ikon edit (✏️) untuk live-edit.
 */
export default function StandingsTable() {
  const store = useLeagueStore();
  const { getStandings, teams, phase } = store;

  const standings = getStandings();

  const [editTarget, setEditTarget] = useState<{
    playerId: string;
    currentName: string;
  } | null>(null);

  if (teams.length === 0) return null;

  return (
    <>
      <div className="bg-[#1a1f26] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-[#202730] px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-200 tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            KLASEMEN LIGA
          </h2>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            {standings.filter((s) => s.played > 0).length} / {standings.length} tim bermain
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="px-4 py-3 text-left text-gray-500 font-bold uppercase tracking-wider w-8">#</th>
                <th className="px-4 py-3 text-left text-gray-500 font-bold uppercase tracking-wider">Tim / Pemain</th>
                <th className="px-4 py-3 text-center text-gray-500 font-bold uppercase tracking-wider">M</th>
                <th className="px-4 py-3 text-center text-gray-500 font-bold uppercase tracking-wider">W</th>
                <th className="px-4 py-3 text-center text-gray-500 font-bold uppercase tracking-wider">L</th>
                <th className="px-4 py-3 text-center text-gray-500 font-bold uppercase tracking-wider">PF</th>
                <th className="px-4 py-3 text-center text-gray-500 font-bold uppercase tracking-wider">PA</th>
                <th className="px-4 py-3 text-center text-gray-500 font-bold uppercase tracking-wider">+/-</th>
                <th className="px-4 py-3 text-center text-[#00D4FF] font-bold uppercase tracking-wider">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, idx) => (
                <StandingRow
                  key={row.teamId}
                  row={row}
                  rank={idx + 1}
                  phase={phase}
                  onEditPlayer={(playerId, name) =>
                    setEditTarget({ playerId, currentName: name })
                  }
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div
          className="px-4 py-2 flex items-center gap-4 text-[10px] text-gray-600"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <span>M=Dimainkan</span>
          <span>W=Menang</span>
          <span>L=Kalah</span>
          <span>PF=Poin Masuk</span>
          <span>PA=Poin Kebobolan</span>
          <span>Pts=Poin Liga (2 per menang)</span>
        </div>
      </div>

      {/* Modal Edit Pemain */}
      {editTarget && (
        <PlayerEditModal
          playerId={editTarget.playerId}
          currentName={editTarget.currentName}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}

// ── Baris klasemen individual ─────────────────────────────────────────────

interface StandingRowProps {
  row: TeamStanding;
  rank: number;
  phase: string;
  onEditPlayer: (playerId: string, name: string) => void;
}

function StandingRow({ row, rank, phase, onEditPlayer }: StandingRowProps) {
  const diff = row.pointsFor - row.pointsAgainst;

  const rankColors: Record<number, string> = {
    1: '#FFD700',
    2: '#C0C0C0',
    3: '#CD7F32',
  };
  const rankColor = rankColors[rank] ?? '#4b5563';

  const isLeader = rank === 1 && row.played > 0;

  return (
    <tr
      className="transition-colors"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        background: isLeader ? 'rgba(255,215,0,0.03)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background = isLeader
          ? 'rgba(255,215,0,0.06)'
          : 'rgba(255,255,255,0.02)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background = isLeader
          ? 'rgba(255,215,0,0.03)'
          : 'transparent';
      }}
    >
      {/* Rank */}
      <td className="px-4 py-3">
        <span
          className="font-black text-sm"
          style={{ color: rankColor }}
        >
          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
        </span>
      </td>

      {/* Tim & Pemain */}
      <td className="px-4 py-3">
        <div className="font-bold text-white text-[13px]">{row.teamName}</div>
        <div className="flex items-center gap-2 mt-0.5">
          {row.players.map((p, i) => (
            <React.Fragment key={p.id}>
              {i > 0 && <span className="text-gray-700">&</span>}
              <button
                onClick={() => onEditPlayer(p.id, p.name)}
                className="flex items-center gap-1 text-gray-400 hover:text-[#00D4FF] transition group"
                title={`Edit nama ${p.name}`}
                disabled={phase === 'input' || phase === 'drafting'}
              >
                <span className="text-[11px]">{p.name}</span>
                <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition" />
              </button>
            </React.Fragment>
          ))}
        </div>
      </td>

      {/* Statistik */}
      <td className="px-4 py-3 text-center text-gray-400 font-mono">{row.played}</td>
      <td className="px-4 py-3 text-center text-green-400 font-mono font-bold">{row.won}</td>
      <td className="px-4 py-3 text-center text-red-400 font-mono">{row.lost}</td>
      <td className="px-4 py-3 text-center text-gray-300 font-mono">{row.pointsFor}</td>
      <td className="px-4 py-3 text-center text-gray-500 font-mono">{row.pointsAgainst}</td>
      <td className="px-4 py-3 text-center font-mono">
        <span
          className="flex items-center justify-center gap-0.5"
          style={{
            color: diff > 0 ? '#39FF14' : diff < 0 ? '#FF3131' : '#666',
          }}
        >
          {diff > 0 ? (
            <ArrowUp className="w-3 h-3" />
          ) : diff < 0 ? (
            <ArrowDown className="w-3 h-3" />
          ) : (
            <Dash className="w-3 h-3" />
          )}
          {Math.abs(diff)}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className="font-black text-sm"
          style={{ color: '#00D4FF' }}
        >
          {row.leaguePoints}
        </span>
      </td>
    </tr>
  );
}

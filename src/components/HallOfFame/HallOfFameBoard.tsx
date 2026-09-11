'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Trophy, RefreshCw, Medal, Crown, Star } from 'lucide-react';
import { getLeaderboard } from '@/lib/hallOfFame';
import type { HallOfFameEntry } from '@/types/league';

/**
 * HallOfFameBoard – Leaderboard Juara Bertahan dari Firestore.
 *
 * Mengambil data collection `hall_of_fame` dan menampilkan
 * peringkat pemain berdasarkan jumlah gelar terbanyak.
 */
export default function HallOfFameBoard() {
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getLeaderboard();
      setEntries(data);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data Hall of Fame');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="bg-[#1a1f26] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1200] to-[#202730] px-5 py-3 border-b border-yellow-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-400" />
          <h2 className="text-sm font-bold text-yellow-100 tracking-wider">
            HALL OF FAME — JUARA BERTAHAN
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-[10px] text-gray-600">
              Update: {lastRefreshed.toLocaleTimeString('id-ID')}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-yellow-400 transition disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.03)' }}
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {isLoading && entries.length === 0 ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : entries.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => (
              <HallOfFameRow key={entry.name} entry={entry} rank={idx + 1} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2 text-[10px] text-gray-700"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        Data tersimpan permanen di Firebase Firestore · Collection: <code>hall_of_fame</code>
      </div>
    </div>
  );
}

// ── Row individual ─────────────────────────────────────────────────────────

function HallOfFameRow({ entry, rank }: { entry: HallOfFameEntry; rank: number }) {
  const medalIcon =
    rank === 1 ? '🥇'
    : rank === 2 ? '🥈'
    : rank === 3 ? '🥉'
    : null;

  const rankColor =
    rank === 1 ? '#FFD700'
    : rank === 2 ? '#C0C0C0'
    : rank === 3 ? '#CD7F32'
    : '#4b5563';

  const lastWon = entry.last_won_at
    ? new Date(entry.last_won_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition"
      style={{
        background:
          rank === 1
            ? 'rgba(255,215,0,0.04)'
            : 'rgba(255,255,255,0.02)',
        border: rank === 1
          ? '1px solid rgba(255,215,0,0.15)'
          : '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Rank */}
      <div className="w-7 text-center shrink-0">
        {medalIcon ? (
          <span className="text-lg">{medalIcon}</span>
        ) : (
          <span className="text-xs font-bold" style={{ color: rankColor }}>{rank}</span>
        )}
      </div>

      {/* Nama */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-white truncate">{entry.name}</div>
        {lastWon && (
          <div className="text-[10px] text-gray-600">Terakhir juara: {lastWon}</div>
        )}
      </div>

      {/* Gelar */}
      <div className="shrink-0 flex items-center gap-1.5">
        {Array.from({ length: Math.min(entry.championships_won, 5) }).map((_, i) => (
          <Star
            key={i}
            className="w-3 h-3"
            style={{ color: '#FFD700', fill: '#FFD700' }}
          />
        ))}
        {entry.championships_won > 5 && (
          <span className="text-[10px] text-yellow-400 font-bold">
            +{entry.championships_won - 5}
          </span>
        )}
        <span
          className="ml-1 text-sm font-black"
          style={{ color: rankColor }}
        >
          {entry.championships_won}×
        </span>
      </div>
    </div>
  );
}

// ── States ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-12 rounded-xl animate-pulse"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-6">
      <p className="text-red-400 text-xs mb-3">{message}</p>
      <button
        onClick={onRetry}
        className="text-xs text-gray-500 hover:text-white transition underline"
      >
        Coba lagi
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8">
      <Trophy className="w-8 h-8 text-gray-700 mx-auto mb-3" />
      <p className="text-gray-600 text-xs">Belum ada juara yang tercatat.</p>
      <p className="text-gray-700 text-[10px] mt-1">
        Selesaikan liga dan klik "Akhiri Liga & Simpan Juara" untuk mencatat gelar.
      </p>
    </div>
  );
}

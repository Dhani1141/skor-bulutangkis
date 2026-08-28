'use client';

import React from 'react';
import { useTournamentStore } from '@/store/tournamentStore';
import BracketView from '@/components/Bracket/BracketView';
import ScoreboardModal from '@/components/Scoreboard/ScoreboardModal';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, Users, RotateCcw } from 'lucide-react';

export default function BracketPage() {
  const router = useRouter();
  const { matches, teams, champion, phase, openMatch, activeMatchId, resetTournament } =
    useTournamentStore();

  // Redirect jika belum generate bracket
  if (phase === 'input' && matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Belum ada bracket yang di-generate.</p>
          <button
            onClick={() => router.push('/input')}
            className="px-6 py-3 bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors"
          >
            Kembali ke Input Pemain
          </button>
        </div>
      </div>
    );
  }

  const finishedCount = matches.filter((m) => m.status === 'finished').length;
  const totalCount = matches.length;
  const progressPct = totalCount > 0 ? Math.round((finishedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5 sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/input')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Input Pemain
            </button>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">Bracket Turnamen</span>
            </div>
          </div>

          {/* Progress */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-xs text-slate-400">Progres: {finishedCount}/{totalCount} match</span>
            <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">{progressPct}%</span>
          </div>

          {/* Tim info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 border border-white/10 rounded-lg px-3 py-1.5">
              <Users className="w-3.5 h-3.5" />
              {teams.length} tim
            </div>
            <button
              onClick={() => {
                if (confirm('Reset turnamen? Semua data akan dihapus.')) {
                  resetTournament();
                  router.push('/input');
                }
              }}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded-lg px-3 py-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Champion Banner */}
        {phase === 'finished' && champion && (
          <div className="mb-8 relative overflow-hidden rounded-3xl border border-yellow-500/30 bg-gradient-to-r from-yellow-900/40 via-orange-900/40 to-yellow-900/40 p-8 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5" />
            {/* Animated stars */}
            <div className="absolute top-4 left-10 text-3xl animate-bounce" style={{ animationDelay: '0s' }}>⭐</div>
            <div className="absolute top-4 right-10 text-3xl animate-bounce" style={{ animationDelay: '0.3s' }}>⭐</div>
            <div className="absolute bottom-4 left-24 text-2xl animate-bounce" style={{ animationDelay: '0.15s' }}>✨</div>
            <div className="absolute bottom-4 right-24 text-2xl animate-bounce" style={{ animationDelay: '0.45s' }}>✨</div>

            <div className="relative z-10">
              <div className="text-6xl mb-4">🏆</div>
              <div className="text-sm font-semibold text-yellow-400 uppercase tracking-widest mb-2">
                🎉 Juara Turnamen 🎉
              </div>
              <h2 className="text-4xl font-black text-white mb-2">{champion.name}</h2>
              <p className="text-yellow-300 text-lg">
                {champion.players[0].name} & {champion.players[1].name}
              </p>
              <button
                onClick={() => {
                  resetTournament();
                  router.push('/input');
                }}
                className="mt-6 px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                Mulai Turnamen Baru
              </button>
            </div>
          </div>
        )}

        {/* Bracket */}
        <div className="overflow-x-auto">
          <BracketView matches={matches} onMatchClick={openMatch} />
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-white/10 pt-6">
          <span className="font-medium text-slate-400">Keterangan:</span>
          {[
            { color: 'bg-blue-500/30 border-blue-500/50', label: 'Bisa dimainkan (klik untuk skor)' },
            { color: 'bg-green-500/10 border-green-500/30', label: 'Selesai' },
            { color: 'bg-white/5 border-white/10 opacity-60', label: 'Menunggu tim' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-4 h-3 rounded border ${item.color}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Scoreboard Modal */}
      {activeMatchId && <ScoreboardModal />}
    </div>
  );
}

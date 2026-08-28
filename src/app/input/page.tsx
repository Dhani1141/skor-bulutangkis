'use client';

import React, { useState } from 'react';
import { useTournamentStore } from '@/store/tournamentStore';
import { UserPlus, X, Trophy, AlertTriangle, ChevronRight, Shuffle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ── Komponen PlayerForm (Halaman Input Pemain) ─────────────────────────────

export default function PlayerInputPage() {
  const router = useRouter();
  const { players, addPlayer, removePlayer, generateBracket, resetTournament } =
    useTournamentStore();

  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const totalPlayers = players.length;
  const isEven = totalPlayers % 2 === 0;
  const isEnough = totalPlayers >= 4;
  const isMaxed = totalPlayers >= 16;
  const canGenerate = isEven && isEnough;

  // Pesan validasi
  const validationMessage = () => {
    if (totalPlayers === 0) return null;
    if (totalPlayers < 4) return `Tambahkan ${4 - totalPlayers} pemain lagi (minimal 4 pemain = 2 tim)`;
    if (!isEven) return 'Jumlah pemain harus genap agar bisa dibentuk tim 2v2';
    return null;
  };

  const handleAddPlayer = () => {
    const name = inputValue.trim();
    if (!name) {
      setError('Nama pemain tidak boleh kosong');
      return;
    }
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setError('Nama pemain sudah ada');
      return;
    }
    if (isMaxed) {
      setError('Maksimal 16 pemain (8 tim)');
      return;
    }
    addPlayer(name);
    setInputValue('');
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddPlayer();
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    generateBracket();
    router.push('/bracket');
  };

  const msg = validationMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Bulu Tangkis Pro</h1>
              <p className="text-xs text-blue-300">Double Elimination Tournament</p>
            </div>
          </div>
          <button
            onClick={resetTournament}
            className="text-xs text-slate-400 hover:text-red-400 transition-colors border border-white/10 hover:border-red-500/50 px-3 py-1.5 rounded-lg"
          >
            Reset Semua
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium">
            Langkah 1 dari 2 — Input Pemain
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-white via-blue-100 to-cyan-300 bg-clip-text text-transparent">
            Daftarkan Pemain
          </h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Masukkan nama pemain satu per satu. Sistem akan otomatis mengacak dan membentuk tim 2v2.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Input */}
          <div className="space-y-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                Tambah Pemain
              </h3>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setError('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Nama pemain..."
                  maxLength={30}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all"
                  disabled={isMaxed}
                />
                <button
                  onClick={handleAddPlayer}
                  disabled={isMaxed}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-95"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </p>
              )}

              {/* Statistik */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: 'Pemain', value: totalPlayers, max: 16 },
                  { label: 'Tim', value: Math.floor(totalPlayers / 2), suffix: '' },
                  { label: 'Slot Tersisa', value: 16 - totalPlayers },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Validasi Warning */}
            {msg && (
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-amber-300 text-sm">{msg}</p>
              </div>
            )}

            {/* Tombol Generate */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              id="generate-bracket-btn"
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                canGenerate
                  ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-400 hover:via-orange-400 hover:to-red-400 shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/10'
              }`}
            >
              <Shuffle className="w-5 h-5" />
              Generate Bracket
              {canGenerate && <ChevronRight className="w-5 h-5" />}
            </button>

            {canGenerate && (
              <p className="text-center text-xs text-slate-500">
                {totalPlayers} pemain akan diacak dan dibentuk {Math.floor(totalPlayers / 2)} tim
              </p>
            )}
          </div>

          {/* Daftar Pemain */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">
              Daftar Pemain ({totalPlayers}/16)
            </h3>

            {players.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-500 text-sm">Belum ada pemain</p>
                <p className="text-slate-600 text-xs mt-1">Tambahkan minimal 4 pemain</p>
              </div>
            ) : (
              <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                {players.map((player, idx) => (
                  <li
                    key={player.id}
                    className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 group transition-all"
                  >
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600/50 to-purple-600/50 flex items-center justify-center text-xs font-bold text-blue-300 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-white font-medium">{player.name}</span>
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400"
                      aria-label={`Hapus ${player.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

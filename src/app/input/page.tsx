'use client';

import React, { useState } from 'react';
import { useTournamentStore } from '@/store/tournamentStore';
import { UserPlus, X, AlertTriangle, ChevronRight, Shuffle, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PlayerInputPage() {
  const router = useRouter();
  const { players, addPlayer, removePlayer, startDrafting, resetTournament } =
    useTournamentStore();

  const [inputValue, setInputValue] = useState('');
  const [error, setError]           = useState('');

  const totalPlayers = players.length;
  const isEven       = totalPlayers % 2 === 0;
  const isEnough     = totalPlayers >= 4;
  const isMaxed      = totalPlayers >= 16;
  const canGenerate  = isEven && isEnough;

  const validationMessage = () => {
    if (totalPlayers === 0) return null;
    if (totalPlayers < 4)  return `Tambahkan ${4 - totalPlayers} pemain lagi (minimal 4 pemain = 2 tim)`;
    if (!isEven)           return 'Jumlah pemain harus genap agar bisa dibentuk tim 2v2';
    return null;
  };

  const handleAddPlayer = () => {
    const name = inputValue.trim();
    if (!name) { setError('Nama pemain tidak boleh kosong'); return; }
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setError('Nama pemain sudah ada'); return;
    }
    if (isMaxed) { setError('Maksimal 16 pemain (8 tim)'); return; }
    addPlayer(name);
    setInputValue('');
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddPlayer();
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    startDrafting();
    router.push('/drafting');
  };

  const msg = validationMessage();

  // Letter avatars
  const avatarColors = [
    'rgba(0,212,255,0.15)','rgba(255,49,49,0.15)','rgba(57,255,20,0.15)',
    'rgba(255,184,0,0.15)','rgba(168,85,247,0.15)','rgba(255,107,53,0.15)',
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>

      {/* ── Ambient background blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #00D4FF, transparent)' }} />
        <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #39FF14, transparent)' }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #FFB800, transparent)' }} />
      </div>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-10"
        style={{
          background: 'rgba(13,13,13,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight" style={{ color: '#F0F0F0' }}>
                Bulu Tangkis Pro
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#00D4FF' }}>
                Double Elimination
              </div>
            </div>
          </div>

          <button
            onClick={resetTournament}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ color: '#444', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#FF3131'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#444'; }}
          >
            Reset
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 relative">

        {/* ── Hero ── */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-widest mb-5"
            style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}
          >
            <Zap className="w-3 h-3" />
            Langkah 1 — Daftarkan Pemain
          </div>
          <h1
            className="text-4xl md:text-6xl font-black mb-4 leading-none tracking-tight"
            style={{ color: '#F0F0F0' }}
          >
            Setup
            <span className="ml-3" style={{ color: '#00D4FF', textShadow: '0 0 30px rgba(0,212,255,0.4)' }}>
              Turnamen
            </span>
          </h1>
          <p className="text-sm max-w-sm mx-auto" style={{ color: '#555' }}>
            Masukkan nama pemain. Sistem akan acak & bentuk tim 2v2 secara otomatis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Left: Form + Stats ── */}
          <div className="space-y-4">

            {/* Input card */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-4 h-4" style={{ color: '#00D4FF' }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#555' }}>
                  Tambah Pemain
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); setError(''); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Nama pemain..."
                  maxLength={30}
                  disabled={isMaxed}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#F0F0F0',
                  }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(0,212,255,0.4)'; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
                <button
                  onClick={handleAddPlayer}
                  disabled={isMaxed}
                  className="px-5 py-3 rounded-xl font-bold text-sm transition-all shrink-0"
                  style={{
                    background: isMaxed ? '#1A1A1A' : 'rgba(0,212,255,0.12)',
                    border: `1px solid ${isMaxed ? 'rgba(255,255,255,0.05)' : 'rgba(0,212,255,0.3)'}`,
                    color: isMaxed ? '#333' : '#00D4FF',
                  }}
                  onMouseEnter={(e) => { if (!isMaxed) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.2)'; }}
                  onMouseLeave={(e) => { if (!isMaxed) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.12)'; }}
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-1.5 mt-2.5 text-xs"
                  style={{ color: '#FF3131' }}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mt-5">
                {[
                  { label: 'Pemain', value: totalPlayers, accent: '#00D4FF' },
                  { label: 'Tim',    value: Math.floor(totalPlayers / 2), accent: '#39FF14' },
                  { label: 'Sisa',   value: 16 - totalPlayers, accent: '#FFB800' },
                ].map((s) => (
                  <div key={s.label}
                    className="rounded-xl py-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="text-2xl font-black" style={{ color: s.accent }}>{s.value}</div>
                    <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: '#3A3A3A' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation warning */}
            {msg && (
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
                style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.2)', color: '#FFB800' }}
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                {msg}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              id="generate-bracket-btn"
              className="btn-neon-green w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3"
            >
              <Shuffle className="w-5 h-5" />
              Mulai Drafting Tim
              {canGenerate && <ChevronRight className="w-5 h-5" />}
            </button>

            {canGenerate && (
              <p className="text-center text-[11px]" style={{ color: '#333' }}>
                {totalPlayers} pemain → {Math.floor(totalPlayers / 2)} tim → acak otomatis
              </p>
            )}
          </div>

          {/* ── Right: Player list ── */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#444' }}>
                Daftar Pemain
              </span>
              <span className="text-[10px] font-mono" style={{ color: '#333' }}>
                {totalPlayers} / 16
              </span>
            </div>

            {players.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <UserPlus className="w-6 h-6" style={{ color: '#2A2A2A' }} />
                </div>
                <p className="text-sm" style={{ color: '#333' }}>Belum ada pemain</p>
                <p className="text-xs" style={{ color: '#222' }}>Tambahkan minimal 4 pemain</p>
              </div>
            ) : (
              <ul className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                {players.map((player, idx) => {
                  const bg = avatarColors[idx % avatarColors.length];
                  return (
                    <li
                      key={player.id}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 group transition-all"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLLIElement).style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLLIElement).style.background = 'rgba(255,255,255,0.03)'; }}
                    >
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                        style={{ background: bg, color: '#F0F0F0' }}
                      >
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-sm font-semibold" style={{ color: '#D0D0D0' }}>
                        {player.name}
                      </span>
                      <button
                        onClick={() => removePlayer(player.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ color: '#555' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#FF3131'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#555'; }}
                        aria-label={`Hapus ${player.name}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

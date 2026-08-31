'use client';

import React, { useState } from 'react';
import { useTournamentStore } from '@/store/tournamentStore';
import { UserPlus, Trash2, AlertTriangle, ChevronRight, Shuffle, Zap } from 'lucide-react';
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

  // Letter avatars + left-border accent colors (per-index cycling)
  const avatarColors = [
    'rgba(0,212,255,0.18)',
    'rgba(255,49,49,0.18)',
    'rgba(57,255,20,0.18)',
    'rgba(255,184,0,0.18)',
    'rgba(168,85,247,0.18)',
    'rgba(255,107,53,0.18)',
  ];
  const leftBorderColors = [
    '#00D4FF', '#FF3131', '#39FF14', '#FFB800', '#A855F7', '#FF6B35',
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: '#0A0A0A', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
    >

      {/* ── Ambient background blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {/* Top-left cyan blob — larger & more vivid */}
        <div
          className="absolute -top-60 -left-60 rounded-full"
          style={{
            width: '600px', height: '600px',
            background: 'radial-gradient(circle at center, rgba(0,212,255,0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        {/* Mid-right green blob */}
        <div
          className="absolute top-1/3 -right-60 rounded-full"
          style={{
            width: '540px', height: '540px',
            background: 'radial-gradient(circle at center, rgba(57,255,20,0.12) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        {/* Bottom amber blob */}
        <div
          className="absolute -bottom-40 left-1/4 rounded-full"
          style={{
            width: '480px', height: '480px',
            background: 'radial-gradient(circle at center, rgba(255,184,0,0.10) 0%, transparent 70%)',
            filter: 'blur(45px)',
          }}
        />
        {/* Small red accent top-right */}
        <div
          className="absolute top-10 right-1/4 rounded-full"
          style={{
            width: '260px', height: '260px',
            background: 'radial-gradient(circle at center, rgba(255,49,49,0.08) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />
      </div>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-10"
        style={{
          background: 'rgba(10,10,10,0.80)',
          backdropFilter: 'blur(28px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.5)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 1px 0 rgba(0,212,255,0.04), 0 4px 24px rgba(0,0,0,0.5)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl overflow-hidden shrink-0"
              style={{
                border: '1px solid rgba(0,212,255,0.2)',
                boxShadow: '0 0 12px rgba(0,212,255,0.12)',
              }}
            >
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight" style={{ color: '#E8E8E8' }}>
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
            style={{
              color: '#555',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.02)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#FF3131';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,49,49,0.3)';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,49,49,0.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#555';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)';
            }}
          >
            Reset
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-14 relative">

        {/* ── Hero ── */}
        <div className="text-center mb-14">
          {/* Step badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-widest mb-6"
            style={{
              background: 'rgba(0,212,255,0.07)',
              border: '1px solid rgba(0,212,255,0.25)',
              color: '#00D4FF',
              boxShadow: '0 0 16px rgba(0,212,255,0.12)',
            }}
          >
            <Zap className="w-3 h-3" />
            Langkah 1 — Daftarkan Pemain
          </div>

          {/* Title — bigger, gradient accent */}
          <h1
            className="font-black leading-none tracking-tight mb-5"
            style={{ fontSize: 'clamp(2.8rem, 8vw, 5.5rem)', color: '#E8E8E8' }}
          >
            Setup{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #00D4FF 0%, #39FF14 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.5))',
              }}
            >
              Turnamen
            </span>
          </h1>

          <p
            className="text-sm max-w-xs mx-auto leading-relaxed"
            style={{ color: '#606060' }}
          >
            Masukkan nama pemain. Sistem akan acak &amp; bentuk tim 2v2 secara otomatis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Left: Form + Stats ── */}
          <div className="space-y-4">

            {/* Input card — glassmorphism */}
            <div
              className="rounded-3xl p-6"
              style={{
                background: 'rgba(255,255,255,0.035)',
                backdropFilter: 'blur(24px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow:
                  '0 2px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)',
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <UserPlus
                  className="w-4 h-4"
                  style={{ color: '#00D4FF', filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.6))' }}
                />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#505050' }}>
                  Tambah Pemain
                </span>
              </div>

              <div className="flex gap-2">
                {/* Stylish input with cyan glow on focus */}
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
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    color: '#E8E8E8',
                    caretColor: '#00D4FF',
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = 'rgba(0,212,255,0.55)';
                    (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(0,212,255,0.10), 0 0 16px rgba(0,212,255,0.18)';
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.09)';
                    (e.target as HTMLInputElement).style.boxShadow = 'none';
                  }}
                />
                <button
                  onClick={handleAddPlayer}
                  disabled={isMaxed}
                  className="px-5 py-3 rounded-xl font-bold text-sm transition-all shrink-0"
                  style={{
                    background: isMaxed ? 'rgba(255,255,255,0.03)' : 'rgba(0,212,255,0.13)',
                    border: `1px solid ${isMaxed ? 'rgba(255,255,255,0.06)' : 'rgba(0,212,255,0.35)'}`,
                    color: isMaxed ? '#333' : '#00D4FF',
                    boxShadow: isMaxed ? 'none' : '0 0 14px rgba(0,212,255,0.15)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isMaxed) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.22)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 22px rgba(0,212,255,0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMaxed) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.13)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 14px rgba(0,212,255,0.15)';
                    }
                  }}
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-1.5 mt-3 text-xs" style={{ color: '#FF3131' }}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Stats chips with per-color glow */}
              <div className="grid grid-cols-3 gap-2 mt-6">
                {[
                  { label: 'Pemain', value: totalPlayers,                 accent: '#00D4FF', glow: 'rgba(0,212,255,0.22)' },
                  { label: 'Tim',    value: Math.floor(totalPlayers / 2), accent: '#39FF14', glow: 'rgba(57,255,20,0.20)' },
                  { label: 'Sisa',   value: 16 - totalPlayers,            accent: '#FFB800', glow: 'rgba(255,184,0,0.20)' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl py-3.5 text-center transition-all"
                    style={{
                      background: 'rgba(0,0,0,0.35)',
                      border: `1px solid ${s.glow.replace('0.22','0.18').replace('0.20','0.18')}`,
                      boxShadow: `0 0 18px ${s.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
                    }}
                  >
                    <div
                      className="text-2xl font-black"
                      style={{ color: s.accent, textShadow: `0 0 12px ${s.glow}` }}
                    >
                      {s.value}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: '#404040' }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation warning */}
            {msg && (
              <div
                className="flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm"
                style={{
                  background: 'rgba(255,184,0,0.07)',
                  border: '1px solid rgba(255,184,0,0.22)',
                  color: '#FFB800',
                  boxShadow: '0 0 16px rgba(255,184,0,0.10)',
                }}
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                {msg}
              </div>
            )}

            {/* Generate button — premium neon green */}
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
              <p className="text-center text-[11px]" style={{ color: '#3A3A3A' }}>
                {totalPlayers} pemain → {Math.floor(totalPlayers / 2)} tim → acak otomatis
              </p>
            )}
          </div>

          {/* ── Right: Player list — glassmorphism ── */}
          <div
            className="rounded-3xl p-5"
            style={{
              background: 'rgba(255,255,255,0.025)',
              backdropFilter: 'blur(24px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow:
                '0 2px 0 rgba(255,255,255,0.03) inset, 0 8px 32px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#484848' }}>
                Daftar Pemain
              </span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{
                  color: '#00D4FF',
                  background: 'rgba(0,212,255,0.08)',
                  border: '1px solid rgba(0,212,255,0.2)',
                }}
              >
                {totalPlayers} / 16
              </span>
            </div>

            {players.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <UserPlus className="w-6 h-6" style={{ color: '#2D2D2D' }} />
                </div>
                <p className="text-sm" style={{ color: '#3A3A3A' }}>Belum ada pemain</p>
                <p className="text-xs" style={{ color: '#282828' }}>Tambahkan minimal 4 pemain</p>
              </div>
            ) : (
              <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {players.map((player, idx) => {
                  const bg          = avatarColors[idx % avatarColors.length];
                  const accentColor = leftBorderColors[idx % leftBorderColors.length];
                  return (
                    <li
                      key={player.id}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 group transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderLeft: `3px solid ${accentColor}`,
                        boxShadow: `0 0 0 0 transparent`,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLLIElement;
                        el.style.background = 'rgba(255,255,255,0.055)';
                        el.style.boxShadow  = `0 0 16px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.3)`;
                        el.style.transform  = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLLIElement;
                        el.style.background = 'rgba(255,255,255,0.03)';
                        el.style.boxShadow  = '0 0 0 0 transparent';
                        el.style.transform  = 'translateX(0)';
                      }}
                    >
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                        style={{ background: bg, color: '#E8E8E8' }}
                      >
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-sm font-semibold" style={{ color: '#D4D4D4' }}>
                        {player.name}
                      </span>
                      <button
                        onClick={() => removePlayer(player.id)}
                        className="transition-colors w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ color: '#FF313180' }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = '#FF3131';
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,49,49,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = '#FF313180';
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                        aria-label={`Hapus ${player.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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

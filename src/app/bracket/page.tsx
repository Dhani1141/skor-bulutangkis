'use client';

import React from 'react';
import { useTournamentStore } from '@/store/tournamentStore';
import BracketView from '@/components/Bracket/BracketView';
import ScoreboardModal from '@/components/Scoreboard/ScoreboardModal';
import MatchQueueBanner from '@/components/Queue/MatchQueueBanner';
import RestTimer from '@/components/Queue/RestTimer';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, RotateCcw, Zap } from 'lucide-react';

export default function BracketPage() {
  const router = useRouter();
  const { matches, teams, champion, phase, openMatch, activeMatchId, resetTournament,
          isResting, restEndTime, skipRest, getMatchQueue } =
    useTournamentStore();
  
  const queue = getMatchQueue();

  if (phase === 'input' && matches.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0D0D0D' }}
      >
        <div className="text-center space-y-4">
          <p className="text-sm" style={{ color: '#444' }}>
            Belum ada bracket yang di-generate.
          </p>
          <button
            onClick={() => router.push('/input')}
            className="px-6 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' }}
          >
            Kembali ke Input Pemain
          </button>
        </div>
      </div>
    );
  }

  const finishedCount = matches.filter((m) => m.status === 'finished').length;
  const totalCount    = matches.length;
  const progressPct   = totalCount > 0 ? Math.round((finishedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>

      {/* ── Ambient blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.03]"
          style={{ background: 'radial-gradient(circle at top right, #39FF14, transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] opacity-[0.025]"
          style={{ background: 'radial-gradient(circle at bottom left, #A855F7, transparent 60%)' }} />
      </div>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-20"
        style={{
          background: 'rgba(13,13,13,0.9)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap">

          {/* Left: back + logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/input')}
              className="flex items-center gap-1.5 text-xs transition-all rounded-lg px-2.5 py-1.5"
              style={{ color: '#444', border: '1px solid rgba(255,255,255,0.05)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#00D4FF'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,212,255,0.2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#444'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.05)'; }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Input
            </button>

            <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="text-sm font-black" style={{ color: '#F0F0F0' }}>Bracket Turnamen</div>
                <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#39FF14' }}>
                  Double Elimination
                </div>
              </div>
            </div>
          </div>

          {/* Center: progress bar */}
          <div className="hidden md:flex items-center gap-3">
            <Zap className="w-3.5 h-3.5" style={{ color: '#39FF14' }} />
            <div
              className="w-36 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, #00D4FF, #39FF14)',
                  boxShadow: progressPct > 0 ? '0 0 8px rgba(57,255,20,0.5)' : 'none',
                }}
              />
            </div>
            <span className="text-xs font-mono" style={{ color: '#3A3A3A' }}>
              {finishedCount}/{totalCount}
            </span>
          </div>

          {/* Right: info + reset */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#555' }}
            >
              <Users className="w-3 h-3" />
              {teams.length} tim
            </div>
            <button
              onClick={() => {
                if (confirm('Reset turnamen? Semua data akan dihapus.')) {
                  resetTournament();
                  router.push('/input');
                }
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ color: '#444', border: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#FF3131'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,49,49,0.3)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#444'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.05)'; }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-8 relative">

        {/* ── Queue Banner ── */}
        {phase !== 'finished' && (
          <MatchQueueBanner queue={queue} isResting={isResting} />
        )}

        {/* ── Champion Banner ── */}
        {phase === 'finished' && champion && (
          <div
            className="mb-10 relative rounded-3xl overflow-hidden text-center py-14 px-8"
            style={{
              background: 'rgba(255,215,0,0.04)',
              border: '1px solid rgba(255,215,0,0.2)',
              boxShadow: '0 0 60px rgba(255,215,0,0.1), 0 0 120px rgba(255,184,0,0.05)',
            }}
          >
            {/* Background shimmer line */}
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, #FFD700, transparent)' }}
            />
            <div className="absolute inset-x-0 bottom-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, #FFD700, transparent)' }}
            />

            {/* Floating corner stars */}
            {['top-5 left-10','top-5 right-10','bottom-5 left-24','bottom-5 right-24'].map((pos, i) => (
              <span key={i} className={`absolute ${pos} text-2xl`}
                style={{ animation: `float ${1.8 + i * 0.2}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }}
              >
                ✦
              </span>
            ))}

            <div className="relative z-10">
              <div className="text-5xl mb-5" style={{ animation: 'float 2s ease-in-out infinite' }}>🏆</div>
              <div
                className="text-[11px] font-mono uppercase tracking-[0.3em] mb-3"
                style={{ color: '#FFB800' }}
              >
                🎉 Juara Turnamen 🎉
              </div>
              <h2 className="text-5xl font-black mb-2 shimmer-text">{champion.name}</h2>
              <p className="text-base mb-8" style={{ color: '#888' }}>
                {champion.players[0].name} &amp; {champion.players[1].name}
              </p>
              <button
                onClick={() => { resetTournament(); router.push('/input'); }}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255,215,0,0.1)',
                  border: '1px solid rgba(255,215,0,0.4)',
                  color: '#FFD700',
                  boxShadow: '0 0 24px rgba(255,215,0,0.15)',
                }}
              >
                Mulai Turnamen Baru
              </button>
            </div>
          </div>
        )}

        {/* ── Bracket ── */}
        <div className="overflow-x-auto">
          <BracketView matches={matches} onMatchClick={openMatch} />
        </div>

        {/* ── Legend ── */}
        <div
          className="mt-10 flex flex-wrap items-center gap-5 pt-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#333' }}>
            Legend
          </span>
          {[
            { color: 'rgba(0,212,255,0.15)',  border: 'rgba(0,212,255,0.4)',  glow: 'rgba(0,212,255,0.2)',  label: 'Siap dimainkan' },
            { color: 'rgba(255,184,0,0.08)',  border: 'rgba(255,184,0,0.6)',  glow: 'rgba(255,184,0,0.3)',  label: 'Sedang berlangsung' },
            { color: 'rgba(57,255,20,0.05)',  border: 'rgba(57,255,20,0.5)',  glow: 'rgba(57,255,20,0.2)',  label: 'Selesai' },
            { color: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)', glow: 'none',              label: 'Menunggu tim' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-5 h-3.5 rounded"
                style={{
                  background: item.color,
                  border: `1px solid ${item.border}`,
                  boxShadow: item.glow !== 'none' ? `0 0 6px ${item.glow}` : 'none',
                }}
              />
              <span className="text-[11px]" style={{ color: '#3A3A3A' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* ── Scoreboard Modal ── */}
      {activeMatchId && <ScoreboardModal />}

      {/* ── Rest Timer Overlay ── */}
      {isResting && restEndTime && (
        <RestTimer restEndTime={restEndTime} onSkip={skipRest} />
      )}
    </div>
  );
}

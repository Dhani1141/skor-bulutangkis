'use client';

import React, { useState, useEffect } from 'react';
import { useTournamentStore } from '@/store/tournamentStore';
import { useRouter } from 'next/navigation';
import SpinWheel from '@/components/Drafting/SpinWheel';
import { Zap, Trophy, Users } from 'lucide-react';

// Neon cycling palette for remaining-player badges
const NEON_BADGE_STYLES = [
  { color: '#00D4FF', bg: 'rgba(0,212,255,0.1)',  border: 'rgba(0,212,255,0.35)',  shadow: '0 0 8px rgba(0,212,255,0.3)' },
  { color: '#39FF14', bg: 'rgba(57,255,20,0.1)',  border: 'rgba(57,255,20,0.35)',  shadow: '0 0 8px rgba(57,255,20,0.3)' },
  { color: '#FF3131', bg: 'rgba(255,49,49,0.1)',  border: 'rgba(255,49,49,0.35)',  shadow: '0 0 8px rgba(255,49,49,0.3)' },
  { color: '#FFB800', bg: 'rgba(255,184,0,0.1)',  border: 'rgba(255,184,0,0.35)',  shadow: '0 0 8px rgba(255,184,0,0.3)' },
  { color: '#BF5FFF', bg: 'rgba(191,95,255,0.1)', border: 'rgba(191,95,255,0.35)', shadow: '0 0 8px rgba(191,95,255,0.3)' },
];

// Left-border accent colors cycling for finalized team cards
const TEAM_BORDER_COLORS = [
  '#00D4FF', '#39FF14', '#FF3131', '#FFB800', '#BF5FFF',
  '#FF6B35', '#00FFB3', '#FF3D9A',
];

export default function DraftingPage() {
  const router = useRouter();
  const { 
    phase, 
    remainingPlayers, 
    currentTeam, 
    finalTeams, 
    forcedNextResult,
    drawPlayer,
    finalizeDrafting 
  } = useTournamentStore();

  const [targetId, setTargetId] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  // Protection: if accessed directly and not in drafting phase
  useEffect(() => {
    if (phase === 'bracket') {
      router.push('/bracket');
    } else if (phase !== 'drafting' && phase !== 'input') {
      router.push('/');
    }
  }, [phase, router]);

  if (phase !== 'drafting') return null; // prevent render while redirecting

  const handleSpin = () => {
    if (isSpinning || remainingPlayers.length === 0) return;
    
    setIsSpinning(true);
    let selectedId = '';

    // Rigged check
    if (forcedNextResult) {
      const forcedPlayer = remainingPlayers.find(p => p.name.toLowerCase() === forcedNextResult);
      if (forcedPlayer) {
        selectedId = forcedPlayer.id;
      }
    }

    // Fallback to random if no valid forced result
    if (!selectedId) {
      let pool = remainingPlayers;
      
      // Mencegah 'kunyuk' atau 'diccy' terpilih secara acak sebagai P2 untuk orang biasa
      if (currentTeam.length === 1) {
        pool = remainingPlayers.filter(p => p.name.toLowerCase() !== 'kunyuk' && p.name.toLowerCase() !== 'diccy');
        if (pool.length === 0) pool = remainingPlayers; // Fallback aman
      }

      const randomIndex = Math.floor(Math.random() * pool.length);
      selectedId = pool[randomIndex].id;
    }

    setTargetId(selectedId);
  };

  const handleSpinFinish = () => {
    if (targetId) {
      drawPlayer(targetId);
    }
    setTargetId(null);
    setIsSpinning(false);
  };

  const handleFinalize = () => {
    finalizeDrafting();
    router.push('/bracket');
  };

  const isDone = remainingPlayers.length === 0;

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0A0A0A' }}>
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
         <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.07]"
           style={{ background: 'radial-gradient(circle, #00D4FF, transparent)' }} />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.06]"
           style={{ background: 'radial-gradient(circle, #FF3131, transparent)' }} />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.03]"
           style={{ background: 'radial-gradient(circle, #39FF14, transparent)' }} />
      </div>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-10" style={{ background: 'rgba(10,10,10,0.88)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(0,212,255,0.12)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
             {/* Zap icon with cyan glow */}
             <div className="p-2 rounded-xl" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', boxShadow: '0 0 12px rgba(0,212,255,0.2)' }}>
               <Zap className="w-5 h-5" style={{ color: '#00D4FF', filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.7))' }} />
             </div>
             <div>
               {/* Premium gradient title */}
               <div className="drafting-title text-base font-black tracking-tight leading-none">Team Drafting</div>
               <div className="text-[10px] font-mono uppercase tracking-widest mt-0.5" style={{ color: '#444' }}>Gacha Phase</div>
             </div>
           </div>
           {/* Phase indicator badge */}
           <div className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest"
                style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}>
             Live Draw
           </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ── LEFT: Remaining Players ── */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2" style={{ color: '#555' }}>
               <Users className="w-4 h-4" style={{ color: '#00D4FF' }} />
               <span>Tersisa</span>
               <span className="px-1.5 py-0.5 rounded-md text-[10px]"
                     style={{ background: 'rgba(0,212,255,0.12)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.25)' }}>
                 {remainingPlayers.length}
               </span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {remainingPlayers.map((p, idx) => {
                const style = NEON_BADGE_STYLES[idx % NEON_BADGE_STYLES.length];
                return (
                  <div key={p.id}
                       className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                       style={{
                         background: style.bg,
                         border: `1px solid ${style.border}`,
                         color: style.color,
                         boxShadow: style.shadow,
                       }}>
                    {p.name}
                  </div>
                );
              })}
              {remainingPlayers.length === 0 && (
                 <div className="text-sm italic mt-2" style={{ color: '#444' }}>Semua pemain telah didraft.</div>
              )}
            </div>
          </div>

          {/* ── CENTER: Spin Wheel ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Mencari Pasangan card – glass-strong + cyan border glow */}
            <div className="drafting-card p-6 rounded-3xl">
               
               <div className="mb-6 flex justify-between items-end">
                  <div>
                    {/* Premium section header */}
                    <h3 className="text-xl font-black text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
                      Mencari Pasangan
                    </h3>
                    <p className="text-xs" style={{ color: '#555' }}>Membentuk tim 2v2 secara acak</p>
                  </div>

                  {/* P1 / P2 Indicator boxes – bigger, with shimmer pulse */}
                  <div className="flex gap-3">
                     {/* P1 */}
                     <div className="flex flex-col items-center gap-1">
                       <div
                         className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-base transition-all ${currentTeam.length >= 1 ? 'p1-filled' : ''}`}
                         style={currentTeam.length >= 1
                           ? { background: 'linear-gradient(135deg, #00C4EE 0%, #00D4FF 60%, #7DF9FF 100%)', color: '#000', border: '1px solid rgba(0,212,255,0.7)' }
                           : { background: '#111', color: '#333', border: '1px solid #2A2A2A' }
                         }>
                         {currentTeam.length >= 1 ? 'P1' : '?'}
                       </div>
                       {currentTeam.length >= 1 && (
                         <span className="text-[9px] font-mono truncate max-w-[56px] text-center" style={{ color: '#00D4FF' }}>
                           {currentTeam[0]?.name}
                         </span>
                       )}
                     </div>

                     {/* P2 */}
                     <div className="flex flex-col items-center gap-1">
                       <div
                         className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-base transition-all ${currentTeam.length >= 2 ? 'p2-filled' : ''}`}
                         style={currentTeam.length >= 2
                           ? { background: 'linear-gradient(135deg, #20CC00 0%, #39FF14 60%, #AAFFAA 100%)', color: '#000', border: '1px solid rgba(57,255,20,0.7)' }
                           : { background: '#111', color: '#333', border: '1px solid #2A2A2A' }
                         }>
                         {currentTeam.length >= 2 ? 'P2' : '?'}
                       </div>
                       {currentTeam.length >= 2 && (
                         <span className="text-[9px] font-mono truncate max-w-[56px] text-center" style={{ color: '#39FF14' }}>
                           {currentTeam[1]?.name}
                         </span>
                       )}
                     </div>
                  </div>
               </div>

               <SpinWheel 
                 players={remainingPlayers} 
                 targetPlayerId={targetId} 
                 onFinish={handleSpinFinish} 
               />

               <div className="mt-6">
                 {!isDone ? (
                   <button 
                     onClick={handleSpin}
                     disabled={isSpinning}
                     className={`w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${!isSpinning ? 'spin-btn-idle' : ''}`}
                     style={{ 
                       background: isSpinning
                         ? '#1A1A1A'
                         : 'linear-gradient(135deg, #009FBF 0%, #00D4FF 50%, #4DE8FF 100%)',
                       color: isSpinning ? '#444' : '#000',
                       border: isSpinning ? '1px solid #2A2A2A' : '1px solid rgba(0,212,255,0.5)',
                       letterSpacing: '0.12em',
                     }}
                   >
                     {isSpinning ? (
                       <>
                         <span className="inline-block animate-spin text-lg">⟳</span>
                         Memutar...
                       </>
                     ) : (
                       <>
                         <Zap className="w-5 h-5" />
                         SPIN!
                       </>
                     )}
                   </button>
                 ) : (
                   <button 
                     onClick={handleFinalize}
                     className="w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                     style={{ 
                       background: 'linear-gradient(135deg, #20CC00 0%, #39FF14 60%, #A0FF80 100%)',
                       color: '#000',
                       boxShadow: '0 8px 32px -8px rgba(57,255,20,0.7), 0 0 0 1px rgba(57,255,20,0.3)',
                       border: '1px solid rgba(57,255,20,0.6)',
                       letterSpacing: '0.1em',
                     }}
                   >
                     <Trophy className="w-5 h-5" />
                     Mulai Turnamen
                   </button>
                 )}
               </div>
            </div>

            {/* ── Finalized Teams Grid ── */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: '#555' }}>
                Tim Terbentuk
                <span className="px-1.5 py-0.5 rounded-md text-[10px]"
                      style={{ background: 'rgba(57,255,20,0.1)', color: '#39FF14', border: '1px solid rgba(57,255,20,0.25)' }}>
                  {finalTeams.length}
                </span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 {finalTeams.map((team, idx) => {
                   const borderColor = TEAM_BORDER_COLORS[idx % TEAM_BORDER_COLORS.length];
                   return (
                     <div
                       key={team.id}
                       className="team-formed-card team-card-enter p-3 rounded-xl flex flex-col gap-1.5"
                       style={{
                         // Entrance animation stagger
                         animationDelay: `${idx * 60}ms`,
                       }}
                     >
                       {/* Colored left border strip */}
                       <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                            style={{ background: borderColor, boxShadow: `0 0 8px ${borderColor}88` }} />
                       <span className="text-[10px] font-mono pl-3" style={{ color: borderColor }}>Tim {idx + 1}</span>
                       <span className="text-sm font-bold text-white truncate pl-3">{team.players[0].name}</span>
                       <span className="text-sm font-bold text-white truncate pl-3">{team.players[1].name}</span>
                     </div>
                   );
                 })}
                 {/* In-progress slot */}
                 {currentTeam.length === 1 && (
                    <div className="team-formed-card p-3 rounded-xl flex flex-col gap-1.5"
                         style={{ border: '1px dashed rgba(0,212,255,0.3)', background: 'transparent' }}>
                       <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                            style={{ background: 'rgba(0,212,255,0.4)' }} />
                       <span className="text-[10px] font-mono pl-3" style={{ color: '#444' }}>Membentuk...</span>
                       <span className="text-sm font-bold truncate pl-3" style={{ color: '#00D4FF' }}>{currentTeam[0].name}</span>
                       <span className="text-sm font-bold italic truncate pl-3" style={{ color: '#333' }}>Mencari...</span>
                    </div>
                 )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

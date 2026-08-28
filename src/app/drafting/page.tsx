'use client';

import React, { useState, useEffect } from 'react';
import { useTournamentStore } from '@/store/tournamentStore';
import { useRouter } from 'next/navigation';
import SpinWheel from '@/components/Drafting/SpinWheel';
import { Zap, Trophy, Users } from 'lucide-react';

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
  const [autoCompleting, setAutoCompleting] = useState(false);
  const autoCompletingRef = useRef(false);

  // Auto-complete when exactly 2 players remain and current team is empty
  useEffect(() => {
    if (phase === 'drafting' && remainingPlayers.length === 2 && currentTeam.length === 0 && !autoCompletingRef.current) {
      autoCompletingRef.current = true;
      setAutoCompleting(true);
      
      const p1 = remainingPlayers[0].id;
      const p2 = remainingPlayers[1].id;

      const timer = setTimeout(() => {
        drawPlayer(p1);
        drawPlayer(p2);
        finalizeDrafting();
        router.push('/bracket');
      }, 1200);
      
      return () => {
        clearTimeout(timer);
        autoCompletingRef.current = false;
      };
    }
  }, [phase, remainingPlayers, currentTeam.length, drawPlayer, finalizeDrafting, router]);

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
    <div className="min-h-screen pb-20" style={{ background: '#0D0D0D' }}>
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
         <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-[0.05]"
           style={{ background: 'radial-gradient(circle, #00D4FF, transparent)' }} />
         <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-[0.05]"
           style={{ background: 'radial-gradient(circle, #FF3131, transparent)' }} />
      </div>

      <header className="sticky top-0 z-10" style={{ background: 'rgba(13,13,13,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <Zap className="w-6 h-6 text-[#00D4FF]" />
             <div>
               <div className="text-sm font-black text-white">Team Drafting</div>
               <div className="text-[10px] font-mono uppercase tracking-widest text-[#555]">Gacha Phase</div>
             </div>
           </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Remaining Players */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#555] flex items-center gap-2">
               <Users className="w-4 h-4" /> Tersisa ({remainingPlayers.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {remainingPlayers.map(p => (
                 <div key={p.id} className="px-3 py-1.5 rounded-lg text-xs font-bold" 
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#CCC' }}>
                    {p.name}
                 </div>
              ))}
              {remainingPlayers.length === 0 && (
                 <div className="text-sm text-[#444] italic mt-2">Semua pemain telah didraft.</div>
              )}
            </div>
          </div>

          {/* CENTER: Spin Wheel */}
          <div className="lg:col-span-2 space-y-8">
            <div className="p-6 rounded-3xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
               
               <div className="mb-6 flex justify-between items-end">
                  <div>
                    <h3 className="text-xl font-black text-white mb-1">Mencari Pasangan</h3>
                    <p className="text-xs text-[#666]">Membentuk tim 2v2 secara acak</p>
                  </div>
                  {/* Current Team Status */}
                  <div className="flex gap-2">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${currentTeam.length >= 1 ? 'bg-[#00D4FF] text-black shadow-[0_0_15px_rgba(0,212,255,0.5)]' : 'bg-[#1A1A1A] text-[#555] border border-[#333]'}`}>
                       {currentTeam.length >= 1 ? 'P1' : '?'}
                     </div>
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${currentTeam.length >= 2 ? 'bg-[#39FF14] text-black shadow-[0_0_15px_rgba(57,255,20,0.5)]' : 'bg-[#1A1A1A] text-[#555] border border-[#333]'}`}>
                       {currentTeam.length >= 2 ? 'P2' : '?'}
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
                     disabled={isSpinning || autoCompleting}
                     className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                     style={{ 
                       background: (isSpinning || autoCompleting) ? '#222' : 'linear-gradient(to right, #00D4FF, #0077FF)',
                       color: (isSpinning || autoCompleting) ? '#555' : '#FFF',
                       boxShadow: (isSpinning || autoCompleting) ? 'none' : '0 10px 30px -10px rgba(0,212,255,0.6)'
                     }}
                   >
                     {autoCompleting ? 'Menyelesaikan...' : isSpinning ? 'Memutar...' : 'SPIN!'}
                   </button>
                 ) : (
                   <button 
                     onClick={handleFinalize}
                     className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                     style={{ 
                       background: 'linear-gradient(to right, #39FF14, #00C800)',
                       color: '#000',
                       boxShadow: '0 10px 30px -10px rgba(57,255,20,0.6)'
                     }}
                   >
                     <Trophy className="w-5 h-5" />
                     Mulai Turnamen
                   </button>
                 )}
               </div>
            </div>

            {/* Finalized Teams Grid */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#555] mb-4">Tim Terbentuk ({finalTeams.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 {finalTeams.map((team, idx) => (
                    <div key={team.id} className="p-3 rounded-xl flex flex-col gap-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                       <span className="text-[10px] font-mono text-[#00D4FF]">Tim {idx + 1}</span>
                       <span className="text-sm font-bold text-white truncate">{team.players[0].name}</span>
                       <span className="text-sm font-bold text-white truncate">{team.players[1].name}</span>
                    </div>
                 ))}
                 {currentTeam.length === 1 && (
                    <div className="p-3 rounded-xl flex flex-col gap-1 border-dashed" style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)' }}>
                       <span className="text-[10px] font-mono text-[#555]">Membentuk...</span>
                       <span className="text-sm font-bold text-[#00D4FF] truncate">{currentTeam[0].name}</span>
                       <span className="text-sm font-bold text-[#555] italic truncate">Mencari...</span>
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

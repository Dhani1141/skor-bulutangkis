'use client';

import React, { useState, useEffect } from 'react';
import { useTournamentStore } from '@/store/tournamentStore';
import { UserPlus, Trash2, Zap, Users, Shuffle, ChevronRight, Trophy } from 'lucide-react';
import BracketView from '@/components/Bracket/BracketView';
import ScoreboardModal from '@/components/Scoreboard/ScoreboardModal';
import RestTimer from '@/components/Queue/RestTimer';

// Wheel component for Drafting
function CircularWheel({ players, targetPlayerId, onFinish, colorTheme }: { players: any[], targetPlayerId: string | null, onFinish: () => void, colorTheme: 'blue' | 'green' }) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (targetPlayerId && players.length > 0) {
      const targetIndex = players.findIndex((p) => p.id === targetPlayerId);
      if (targetIndex === -1) return;

      const sliceAngle = 360 / players.length;
      // We want the target to stop at top (0 degrees).
      const targetAngle = 360 - (targetIndex * sliceAngle); 
      // Add extra spins
      const extraSpins = 360 * 5; 
      const finalRotation = rotation + extraSpins + (targetAngle - (rotation % 360));

      setRotation(finalRotation);

      const timeout = setTimeout(() => {
        onFinish();
      }, 3500); // Wait for transition
      
      return () => clearTimeout(timeout);
    }
  }, [targetPlayerId, players]); // eslint-disable-line react-hooks/exhaustive-deps

  let displayPlayers = players;
  if (players.length === 0) {
    displayPlayers = Array.from({length: 8}).map((_, i) => ({id: String(i), name: `Sektor ${i+1}`}));
  }

  const sliceAngle = displayPlayers.length > 0 ? 360 / displayPlayers.length : 360;
  const colors = colorTheme === 'blue' 
    ? ['#0088cc', '#00aaff'] 
    : ['#1e90ff', '#32cd32']; // We'll refine colors later

  return (
    <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 shadow-lg transition-transform duration-[3500ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
         style={{
           transform: `rotate(${rotation}deg)`,
           borderColor: colorTheme === 'blue' ? '#00D4FF' : '#39FF14',
           boxShadow: colorTheme === 'blue' ? '0 0 20px rgba(0,212,255,0.3)' : '0 0 20px rgba(57,255,20,0.3)',
         }}>
         
         {/* Simple pie slices using conic-gradient (approximate for now, better to use absolute positioned divs if we want text) */}
         <div className="absolute inset-0" style={{
             background: `conic-gradient(${displayPlayers.map((p, i) => `${colors[i % 2]} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`).join(', ')})`
         }} />
         
         {/* Text labels */}
         {displayPlayers.map((p, i) => {
           const midAngle = (i * sliceAngle) + (sliceAngle / 2);
           return (
             <div key={p.id} className="absolute inset-0 flex items-start justify-center text-xs font-bold text-white pt-4"
                  style={{ transform: `rotate(${midAngle}deg)`, textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
               {p.name.length > 10 ? p.name.substring(0,8) + '..' : p.name}
             </div>
           );
         })}
         
         {/* Center dot */}
         <div className="absolute inset-0 m-auto w-8 h-8 bg-white rounded-full shadow-inner z-10" />
    </div>
  );
}


export default function DashboardPage() {
  const store = useTournamentStore();
  const {
    phase, players, teams, matches, remainingPlayers, currentTeam, finalTeams,
    addPlayer, removePlayer, startDrafting, drawPlayer, finalizeDrafting,
    openMatch, resetTournament, activeMatchId, isResting, restEndTime, skipRest, getMatchQueue
  } = store;

  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetIdP1, setTargetIdP1] = useState<string | null>(null);
  const [targetIdP2, setTargetIdP2] = useState<string | null>(null);

  const totalPlayers = players.length;
  const isEven = totalPlayers % 2 === 0;
  const isEnough = totalPlayers >= 4;
  const isMaxed = totalPlayers >= 16;
  const canGenerate = isEven && isEnough;
  const queue = getMatchQueue();
  
  // -- REGISTRATION HANDLERS --
  const handleAddPlayer = () => {
    const name = inputValue.trim();
    if (!name) { setError('Nama pemain tidak boleh kosong'); return; }
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setError('Nama pemain sudah ada'); return;
    }
    if (isMaxed) { setError('Maksimal 16 pemain'); return; }
    addPlayer(name);
    setInputValue('');
    setError('');
  };
  
  // -- DRAFTING HANDLERS --
  const handleSpin = () => {
    if (isSpinning || remainingPlayers.length === 0) return;
    setIsSpinning(true);
    
    // Choose player based on store logic (rigged or random)
    let selectedId = '';
    if (store.forcedNextResult) {
      const forcedPlayer = remainingPlayers.find(p => p.name.toLowerCase() === store.forcedNextResult);
      if (forcedPlayer) selectedId = forcedPlayer.id;
    }
    
    if (!selectedId) {
       let pool = remainingPlayers;
       if (currentTeam.length === 1) {
         pool = remainingPlayers.filter(p => p.name.toLowerCase() !== 'kunyuk' && p.name.toLowerCase() !== 'diccy');
         if (pool.length === 0) pool = remainingPlayers;
       }
       selectedId = pool[Math.floor(Math.random() * pool.length)].id;
    }
    
    if (currentTeam.length === 0) {
      setTargetIdP1(selectedId);
    } else {
      setTargetIdP2(selectedId);
    }
  };

  const handleSpinFinish = () => {
    if (targetIdP1) { drawPlayer(targetIdP1); setTargetIdP1(null); }
    if (targetIdP2) { drawPlayer(targetIdP2); setTargetIdP2(null); }
    setIsSpinning(false);
  };

  // Determine which wheel to spin and render
  // When forming a new team, currentTeam.length is 0. So wheel 1 spins.
  // Then currentTeam.length is 1. Wheel 2 spins.
  const isWheel1Active = currentTeam.length === 0;
  const isWheel2Active = currentTeam.length === 1;

  // -- RENDER --
  return (
    <div className="min-h-screen bg-[#111418] text-[#e5e7eb] font-sans overflow-x-hidden"
         style={{ backgroundImage: 'linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      
      {/* ── TOP BANNER ── */}
      <header className="sticky top-0 z-30 bg-[#0b0e12]/90 backdrop-blur-md border-b border-gray-800">
         <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex flex-col xl:flex-row items-center xl:justify-between gap-4">
           <div className="flex flex-col md:flex-row items-center gap-2 text-center xl:text-left">
              <div className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                 <Zap className="w-5 h-5 text-[#00D4FF]" />
                 PENYIAPAN TURNAMEN
              </div>
              <span className="text-gray-500 font-normal text-xs sm:text-sm md:ml-2">(Ganda Amatir 2v2)</span>
           </div>
           
           <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 w-full xl:w-auto">
              <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] text-[10px] sm:text-xs font-bold tracking-wider uppercase">
                PEMAIN TERDAFTAR [{totalPlayers} / 16]
              </div>
              <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-[10px] sm:text-xs font-bold tracking-wider uppercase">
                TIM TERBENTUK [{phase === 'input' ? 0 : phase === 'drafting' ? finalTeams.length : teams.length}]
              </div>
              <div className="hidden sm:block px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-gray-800 border border-gray-700 text-gray-400 text-[10px] sm:text-xs font-bold tracking-wider uppercase">
                SLOT SISA [{16 - totalPlayers}]
              </div>
              <button onClick={resetTournament} className="sm:ml-4 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 text-[10px] sm:text-xs transition">
                Hapus Semua
              </button>
           </div>
         </div>
      </header>

      {/* ── MAIN GRID ── */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT COLUMN (Setup & Drafting) ── */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            {/* PANEL 1: PENDAFTARAN PEMAIN */}
            <div className="bg-[#1a1f26] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
               <div className="bg-[#202730] px-5 py-3 border-b border-gray-800">
                  <h2 className="text-sm font-bold text-gray-200 tracking-wider">1. PENDAFTARAN PEMAIN</h2>
               </div>
               <div className="p-5">
                  <div className="flex gap-2 mb-6">
                    <input type="text" value={inputValue} onChange={e => {setInputValue(e.target.value); setError('');}}
                           onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
                           placeholder="Masukkan nama pemain amatir..." disabled={isMaxed || phase !== 'input'}
                           className="flex-1 min-w-0 bg-[#111418] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition" />
                    <button onClick={handleAddPlayer} disabled={isMaxed || phase !== 'input'}
                            className="bg-white text-black w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl font-black text-xl hover:bg-gray-200 disabled:opacity-50 shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                      +
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Daftar Calon Pemain */}
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase mb-3">Daftar Calon Pemain ({totalPlayers} / 16)</div>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                         {players.length === 0 ? (
                           <div className="text-xs text-gray-600 italic">Belum ada pemain...</div>
                         ) : (
                           players.map((p, i) => (
                             <div key={p.id} className="flex items-center justify-between bg-[#1f252d] border border-gray-700 rounded-lg px-3 py-2">
                               <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-500 font-mono">{i+1}.</span>
                                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                    <UserPlus className="w-3 h-3 text-gray-400" />
                                  </div>
                                  <span className="text-sm font-medium">{p.name}</span>
                               </div>
                               {phase === 'input' && (
                                 <button onClick={() => removePlayer(p.id)} className="text-red-500/70 hover:text-red-500 transition">
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               )}
                             </div>
                           ))
                         )}
                      </div>
                    </div>
                    
                    {/* Tim Terbentuk (if any in drafting phase) */}
                    <div>
                       <div className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                         <Users className="w-4 h-4" /> Tim Terbentuk ({(phase === 'drafting' ? finalTeams.length : teams.length) || 0})
                       </div>
                       <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                         {phase === 'input' && <div className="text-xs text-gray-600 italic">Tim belum diacak...</div>}
                         {phase === 'drafting' && finalTeams.map((t, idx) => (
                           <div key={t.id} className="bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-lg p-2 flex gap-2 items-center">
                              <div className="w-6 h-6 shrink-0 bg-[#00D4FF]/20 text-[#00D4FF] rounded text-xs font-bold flex items-center justify-center">
                                {idx + 1}
                              </div>
                              <div className="text-xs">
                                <div className="font-bold text-white">Team {idx + 1}</div>
                                <div className="text-gray-400">({t.players[0].name} & {t.players[1].name})</div>
                              </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>
                  
                  {phase === 'input' && (
                    <button onClick={() => { startDrafting(); }} disabled={!canGenerate}
                            className="w-full mt-6 bg-gray-800 text-gray-400 py-3 rounded-lg font-bold text-sm tracking-widest hover:bg-gray-700 transition disabled:opacity-40 uppercase border border-gray-700">
                      MULAI DRAFTING TIM SEKARANG
                    </button>
                  )}
               </div>
            </div>
            
            {/* PANEL 2: DRAFTING TIM: FASE LOTERE */}
            <div className={`bg-[#1a1f26] border border-gray-800 rounded-2xl overflow-hidden shadow-xl transition ${phase !== 'drafting' ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
               <div className="bg-[#202730] px-5 py-3 border-b border-gray-800 flex justify-between items-center">
                  <h2 className="text-sm font-bold text-gray-200 tracking-wider">2. DRAFTING TIM: FASE LOTERE</h2>
                  {phase === 'drafting' && <div className="text-[#39FF14] text-xs">Live Draw</div>}
               </div>
               
               <div className="p-6">
                 <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8 relative">
                   
                   {/* Wheel 1 */}
                   <div className="flex flex-col items-center">
                      <CircularWheel 
                        players={phase === 'drafting' && remainingPlayers.length === 0 && finalTeams.length > 0 ? [finalTeams[finalTeams.length - 1].players[0]] : remainingPlayers} 
                        targetPlayerId={targetIdP1} 
                        onFinish={handleSpinFinish} 
                        colorTheme="blue" 
                      />
                      <div className="mt-4 bg-[#00D4FF]/10 border border-[#00D4FF]/30 px-4 py-1.5 rounded text-[#00D4FF] font-bold text-xs text-center w-full min-h-[32px]">
                         {phase === 'drafting' && remainingPlayers.length === 0 && finalTeams.length > 0 ? `TERPILIH: ${finalTeams[finalTeams.length - 1].players[0].name} (Tim Biru)` : currentTeam.length >= 1 ? currentTeam[0].name : 'Pemain 1'}
                      </div>
                   </div>
                   
                   {/* Center text */}
                   <div className="text-center font-bold text-gray-400 text-xs sm:text-sm uppercase tracking-widest max-w-[120px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1f26]/90 backdrop-blur p-3 rounded z-10 border border-gray-700 shadow-xl">
                      {phase === 'drafting' && remainingPlayers.length === 0 ? 'Draf Tim Selesai! Tim Baru Terbentuk!' : 'SISTEM SEDANG MENGACAK...'}
                   </div>
                   
                   {/* Wheel 2 */}
                   <div className="flex flex-col items-center">
                      <CircularWheel 
                        players={phase === 'drafting' && remainingPlayers.length === 0 && finalTeams.length > 0 ? [finalTeams[finalTeams.length - 1].players[1]] : remainingPlayers} 
                        targetPlayerId={targetIdP2} 
                        onFinish={handleSpinFinish} 
                        colorTheme="green" 
                      />
                      <div className="mt-4 bg-[#39FF14]/10 border border-[#39FF14]/30 px-4 py-1.5 rounded text-[#39FF14] font-bold text-xs text-center w-full min-h-[32px]">
                         {phase === 'drafting' && remainingPlayers.length === 0 && finalTeams.length > 0 ? `TERPILIH: ${finalTeams[finalTeams.length - 1].players[1].name} (Tim Hijau)` : currentTeam.length >= 2 ? currentTeam[1].name : 'Pemain 2'}
                      </div>
                   </div>
                 </div>
                 
                 {phase === 'drafting' && remainingPlayers.length > 0 ? (
                   <button onClick={handleSpin} disabled={isSpinning}
                           className="w-full bg-[#00D4FF] text-black py-4 rounded-xl font-black text-sm tracking-widest uppercase hover:bg-[#00D4FF]/90 transition shadow-[0_0_15px_rgba(0,212,255,0.4)] disabled:opacity-50">
                     {isSpinning ? 'MEMUTAR...' : 'ACAK PEMAIN'}
                   </button>
                 ) : phase === 'drafting' && remainingPlayers.length === 0 ? (
                   <div className="flex gap-4">
                     <button disabled className="w-1/3 bg-gray-700 text-gray-400 py-4 rounded-xl font-black text-sm tracking-widest uppercase opacity-50 cursor-not-allowed">
                       ACAK LAGI
                     </button>
                     <button onClick={() => finalizeDrafting()}
                             className="w-2/3 bg-[#00D4FF] text-black py-4 rounded-xl font-black text-sm tracking-widest uppercase hover:bg-[#00D4FF]/90 transition shadow-[0_0_20px_rgba(0,212,255,0.6)] border border-[#00D4FF]">
                       KONFIRMASI TIM
                     </button>
                   </div>
                 ) : (
                   <div className="w-full bg-gray-800 text-gray-500 py-4 rounded-xl font-black text-sm tracking-widest uppercase text-center border border-gray-700">
                     MENUNGGU PENDAFTARAN
                   </div>
                 )}
                 
               </div>
            </div>
            
          </div>
          
          {/* ── RIGHT COLUMN (Bracket) ── */}
          <div className="lg:col-span-7 flex flex-col gap-6">
             <div className={`bg-[#1a1f26] border border-gray-800 rounded-2xl overflow-hidden shadow-xl min-h-[800px] flex flex-col ${phase !== 'bracket' && phase !== 'finished' ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                <div className="bg-[#202730] px-5 py-3 border-b border-gray-800 flex justify-between items-center">
                  <h2 className="text-sm font-bold text-gray-200 tracking-wider">BRAKET PERTANDINGAN</h2>
                  <div className="text-gray-400"><Shuffle className="w-4 h-4" /></div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                   {/* Top Active Matches Banner */}
                   {phase === 'finished' && store.champion ? (
                      (() => {
                        const finalMatch = matches.slice().reverse().find(m => m.status === 'finished' && m.winner?.id === store.champion?.id);
                        const winnerScore = finalMatch ? (finalMatch.winner?.id === finalMatch.teamA?.id ? finalMatch.scoreA : finalMatch.scoreB) : 21;
                        const loserScore = finalMatch ? (finalMatch.winner?.id === finalMatch.teamA?.id ? finalMatch.scoreB : finalMatch.scoreA) : 0;
                        return (
                          <div className="mb-8 relative rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-900/40 via-black to-yellow-900/20 border border-yellow-500/50 shadow-[0_0_40px_rgba(250,204,21,0.2)] p-8 text-center flex flex-col items-center justify-center">
                            <div className="absolute inset-0 pointer-events-none bg-[url('/confetti.png')] opacity-30 mix-blend-screen" />
                            <h3 className="text-yellow-400 font-black text-4xl tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] mb-6">
                               JUARA TURNAMEN: GRAND FINAL
                            </h3>
                            <div className="flex items-center gap-8 z-10">
                               <Trophy className="w-24 h-24 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-pulse" />
                               <div className="bg-[#111]/80 backdrop-blur border-2 border-yellow-500 rounded-xl p-6 shadow-[0_0_30px_rgba(250,204,21,0.4)]">
                                  <div className="text-yellow-400 text-xs font-black tracking-widest mb-2">PEMENANG MUTLAK</div>
                                  <div className="flex items-center gap-4">
                                     <div className="text-white font-black text-2xl">{store.champion.name} <span className="text-gray-400 text-sm ml-2">({store.champion.players[0].name} & {store.champion.players[1].name})</span></div>
                                     <div className="text-yellow-400 font-black text-3xl">{winnerScore} - {loserScore}</div>
                                     <Trophy className="w-6 h-6 text-yellow-400" />
                                  </div>
                               </div>
                            </div>
                          </div>
                        );
                      })()
                   ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {/* Ongoing Match */}
                      <div className="bg-[#0b0e12] border border-[#00D4FF]/30 rounded-xl p-4 shadow-[0_0_15px_rgba(0,212,255,0.05)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#00D4FF]" />
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[#00D4FF] text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                             <Zap className="w-3 h-3" /> PERTANDINGAN BERLANGSUNG
                          </span>
                          <span className="text-gray-500 text-[10px]">
                            {queue.length > 0 && queue[0].status === 'ongoing' ? queue[0].id : 'Game -'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-[#1f252d] rounded-lg px-4 py-2 border border-gray-700">
                          <div className="text-sm font-bold text-white flex-1 text-center">
                            {queue.length > 0 && queue[0].status === 'ongoing' && queue[0].teamA ? queue[0].teamA.name : 'Tim -'}
                          </div>
                          <div className="text-xs text-gray-500 px-3 font-black">VS</div>
                          <div className="text-sm font-bold text-white flex-1 text-center">
                             {queue.length > 0 && queue[0].status === 'ongoing' && queue[0].teamB ? queue[0].teamB.name : 'Tim -'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Next Match */}
                      <div className="bg-[#0b0e12] border border-gray-800 rounded-xl p-4 relative">
                         <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-400 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                             PERTANDINGAN BERIKUTNYA
                          </span>
                          <span className="text-gray-600 text-[10px]">
                            {queue.length > 1 ? queue[1].id : queue.length === 1 && queue[0].status !== 'ongoing' ? queue[0].id : 'Game -'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-[#1a1f26] rounded-lg px-4 py-2 border border-gray-800">
                          <div className="text-sm font-medium text-gray-400 flex-1 text-center">
                            {queue.length > 1 && queue[1].teamA ? queue[1].teamA.name : queue.length === 1 && queue[0].status !== 'ongoing' && queue[0].teamA ? queue[0].teamA.name : 'Tim -'}
                          </div>
                          <div className="text-xs text-gray-600 px-3 font-black">VS</div>
                          <div className="text-sm font-medium text-gray-400 flex-1 text-center">
                            {queue.length > 1 && queue[1].teamB ? queue[1].teamB.name : queue.length === 1 && queue[0].status !== 'ongoing' && queue[0].teamB ? queue[0].teamB.name : 'Tim -'}
                          </div>
                        </div>
                      </div>
                   </div>
                   )}
                   
                   {/* Main Bracket Area */}
                   <div className="flex-1 rounded-xl bg-[#0b0e12] border border-gray-800 p-2 overflow-x-auto custom-scrollbar relative">
                     {phase !== 'input' && phase !== 'drafting' ? (
                       <BracketView matches={matches} onMatchClick={openMatch} />
                     ) : (
                       <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm font-bold tracking-widest uppercase">
                         Braket belum dibuat
                       </div>
                     )}
                   </div>
                   
                   {/* Legend */}
                   <div className="mt-4 flex items-center justify-center gap-6 border-t border-gray-800 pt-4">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mr-2">Keterangan:</div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#00D4FF]/20 border border-[#00D4FF] rounded-sm shadow-[0_0_5px_rgba(0,212,255,0.3)]"></div>
                        <span className="text-xs text-gray-400">Siap dimainkan</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#FFB800]/20 border border-[#FFB800] rounded-sm shadow-[0_0_5px_rgba(255,184,0,0.3)]"></div>
                        <span className="text-xs text-[#FFB800]">Sedang berlangsung</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#39FF14]/10 border border-[#39FF14] rounded-sm shadow-[0_0_5px_rgba(57,255,20,0.3)]"></div>
                        <span className="text-xs text-[#39FF14]">Selesai</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-800 border border-gray-600 rounded-sm"></div>
                        <span className="text-xs text-gray-500">Menunggu tim</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-400/20 border border-yellow-400 rounded-sm shadow-[0_0_5px_rgba(250,204,21,0.4)]"></div>
                        <span className="text-xs text-yellow-400 font-bold tracking-widest">PEMENANG</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
          
        </div>
      </main>

      {/* Modals & Overlays */}
      {activeMatchId && <ScoreboardModal />}
      {isResting && restEndTime && (
        <RestTimer restEndTime={restEndTime} onSkip={skipRest} />
      )}
      
      {/* Required by Next.js if we use custom CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1f26; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2d3748; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4a5568; 
        }
      `}} />
    </div>
  );
}

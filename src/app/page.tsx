'use client';

import React, { useState, useEffect } from 'react';
import { useLeagueStore } from '@/store/leagueStore';
import {
  UserPlus,
  Trash2,
  Zap,
  Users,
  Trophy,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Save,
} from 'lucide-react';
import ScoreboardModal from '@/components/Scoreboard/ScoreboardModal';
import RestTimer from '@/components/Queue/RestTimer';
import LeagueView from '@/components/League/LeagueView';
import StandingsTable from '@/components/League/StandingsTable';
import HallOfFameBoard from '@/components/HallOfFame/HallOfFameBoard';

// ── Komponen Roda Putar (dipertahankan dari versi lama) ───────────────────

function CircularWheel({
  players,
  targetPlayerId,
  onFinish,
  colorTheme,
}: {
  players: { id: string; name: string }[];
  targetPlayerId: string | null;
  onFinish: () => void;
  colorTheme: 'blue' | 'green';
}) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (targetPlayerId && players.length > 0) {
      const targetIndex = players.findIndex((p) => p.id === targetPlayerId);
      if (targetIndex === -1) return;

      const sliceAngle = 360 / players.length;
      const targetAngle = 360 - targetIndex * sliceAngle;
      const extraSpins = 360 * 5;
      const finalRotation = rotation + extraSpins + (targetAngle - (rotation % 360));
      setRotation(finalRotation);

      const timeout = setTimeout(() => onFinish(), 3500);
      return () => clearTimeout(timeout);
    }
  }, [targetPlayerId, players]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayPlayers =
    players.length === 0
      ? Array.from({ length: 8 }).map((_, i) => ({ id: String(i), name: `Sektor ${i + 1}` }))
      : players;

  const sliceAngle = displayPlayers.length > 0 ? 360 / displayPlayers.length : 360;
  const colors =
    colorTheme === 'blue' ? ['#0088cc', '#00aaff'] : ['#228b22', '#32cd32'];

  return (
    <div className="relative flex flex-col items-center">
      {/* Penunjuk segitiga */}
      <div
        className="absolute -top-3 sm:-top-4 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
        style={{ borderTopColor: colorTheme === 'blue' ? '#00D4FF' : '#39FF14' }}
      />
      <div
        className="relative w-48 h-48 sm:w-60 sm:h-60 mt-2 rounded-full overflow-hidden border-4 shadow-lg transition-transform duration-[3500ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{
          transform: `rotate(${rotation}deg)`,
          borderColor: colorTheme === 'blue' ? '#00D4FF' : '#39FF14',
          boxShadow:
            colorTheme === 'blue'
              ? '0 0 20px rgba(0,212,255,0.3)'
              : '0 0 20px rgba(57,255,20,0.3)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `conic-gradient(${displayPlayers
              .map(
                (p, i) =>
                  `${colors[i % 2]} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`,
              )
              .join(', ')})`,
          }}
        />
        {displayPlayers.map((p, i) => {
          const midAngle = i * sliceAngle + sliceAngle / 2;
          return (
            <div
              key={p.id}
              className="absolute inset-0 flex items-start justify-center text-xs font-bold text-white pt-4"
              style={{
                transform: `rotate(${midAngle}deg)`,
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              {p.name.length > 10 ? p.name.substring(0, 8) + '..' : p.name}
            </div>
          );
        })}
        <div className="absolute inset-0 m-auto w-8 h-8 bg-white rounded-full shadow-inner z-10" />
      </div>
    </div>
  );
}

// ── Halaman Utama ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const store = useLeagueStore();
  const {
    phase,
    players,
    teams,
    matches,
    remainingPlayers,
    currentTeam,
    finalTeams,
    activeMatchId,
    isResting,
    restEndTime,
    champion,
    isSavingToFirebase,
    firebaseSaveError,
    firebaseSaveSuccess,
    addPlayer,
    removePlayer,
    startDrafting,
    drawPlayer,
    finalizeDrafting,
    openMatch,
    closeMatch,
    skipRest,
    resetLeague,
    endLeagueAndSaveChampion,
    getPendingCount,
  } = store;

  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetIdP1, setTargetIdP1] = useState<string | null>(null);
  const [targetIdP2, setTargetIdP2] = useState<string | null>(null);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-pulse text-[#00D4FF]">Memuat...</div>
      </div>
    );
  }

  const totalPlayers = players.length;
  const isEven = totalPlayers % 2 === 0;
  const isEnough = totalPlayers >= 4;
  const isMaxed = totalPlayers >= 16;
  const canStartDrafting = isEven && isEnough && !isMaxed;
  const pendingCount = phase === 'league' ? getPendingCount() : 0;

  // ── Pendaftaran Pemain ─────────────────────────────────────────────────

  const handleAddPlayer = () => {
    const name = inputValue.trim();
    if (!name) { setInputError('Nama tidak boleh kosong'); return; }
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setInputError('Nama sudah terdaftar'); return;
    }
    if (isMaxed) { setInputError('Maksimal 16 pemain'); return; }
    addPlayer(name);
    setInputValue('');
    setInputError('');
  };

  // ── Drafting (Roda Putar) ──────────────────────────────────────────────

  const handleSpin = () => {
    if (isSpinning || remainingPlayers.length === 0) return;
    setIsSpinning(true);

    const activePairIndex = store.finalTeams.length;
    const activePair = store.predefinedPairs[activePairIndex];

    let selectedId = '';
    
    // Pilih P1 dari pasangan yang sudah dipre-kalkulasi
    if (currentTeam.length === 0) {
      selectedId = activePair[0].id;
      setTargetIdP1(selectedId);
    } 
    // Pilih P2 dari pasangan yang sama
    else {
      selectedId = activePair[1].id;
      setTargetIdP2(selectedId);
    }
  };

  const handleSpinFinish = () => {
    if (targetIdP1) { drawPlayer(targetIdP1); setTargetIdP1(null); }
    if (targetIdP2) { drawPlayer(targetIdP2); setTargetIdP2(null); }
    setIsSpinning(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen bg-[#111418] text-[#e5e7eb] font-sans overflow-x-hidden"
      style={{
        backgroundImage:
          'linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 bg-[#0b0e12]/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex flex-col xl:flex-row items-center xl:justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 text-center xl:text-left">
            <div className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#00D4FF]" />
              LIGA BULU TANGKIS
            </div>
            <span className="text-gray-500 font-normal text-xs sm:text-sm md:ml-2">
              (Sistem Round-Robin · Ganda 2v2)
            </span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 w-full xl:w-auto">
            <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] text-[10px] sm:text-xs font-bold tracking-wider uppercase">
              PEMAIN [{totalPlayers} / 16]
            </div>
            <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-[10px] sm:text-xs font-bold tracking-wider uppercase">
              TIM [{phase === 'input' ? 0 : phase === 'drafting' ? finalTeams.length : teams.length}]
            </div>
            {phase === 'league' && (
              <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-[#FFB800]/10 border border-[#FFB800]/30 text-[#FFB800] text-[10px] sm:text-xs font-bold tracking-wider uppercase">
                SISA MATCH [{pendingCount}]
              </div>
            )}
            <button
              onClick={resetLeague}
              className="sm:ml-4 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 text-[10px] sm:text-xs transition flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Liga
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN GRID ── */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── KOLOM KIRI: Setup + Hall of Fame ── */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* PANEL 1: PENDAFTARAN PEMAIN */}
            <div className="bg-[#1a1f26] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-[#202730] px-5 py-3 border-b border-gray-800">
                <h2 className="text-sm font-bold text-gray-200 tracking-wider">
                  1. PENDAFTARAN PEMAIN
                </h2>
              </div>
              <div className="p-5">
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => { setInputValue(e.target.value); setInputError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                    placeholder="Masukkan nama pemain..."
                    disabled={isMaxed || phase !== 'input'}
                    className="flex-1 min-w-0 bg-[#111418] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition"
                  />
                  <button
                    onClick={handleAddPlayer}
                    disabled={isMaxed || phase !== 'input'}
                    className="bg-white text-black w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl font-black text-xl hover:bg-gray-200 disabled:opacity-50 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                  >
                    +
                  </button>
                </div>
                {inputError && (
                  <p className="text-red-400 text-xs -mt-4 mb-4">{inputError}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Daftar Pemain */}
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-3">
                      Daftar Calon Pemain ({totalPlayers} / 16)
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                      {players.length === 0 ? (
                        <div className="text-xs text-gray-600 italic">Belum ada pemain...</div>
                      ) : (
                        players.map((p, i) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between bg-[#1f252d] border border-gray-700 rounded-lg px-3 py-2"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500 font-mono">{i + 1}.</span>
                              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                                <UserPlus className="w-3 h-3 text-gray-400" />
                              </div>
                              <span className="text-sm font-medium">{p.name}</span>
                            </div>
                            {phase === 'input' && (
                              <button
                                onClick={() => removePlayer(p.id)}
                                className="text-red-500/70 hover:text-red-500 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Tim Terbentuk */}
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Tim Terbentuk (
                      {phase === 'drafting' ? finalTeams.length : teams.length})
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                      {phase === 'input' && (
                        <div className="text-xs text-gray-600 italic">Tim belum diacak...</div>
                      )}
                      {phase === 'drafting' &&
                        finalTeams.map((t, idx) => (
                          <div
                            key={t.id}
                            className="bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-lg p-2 flex gap-2 items-center"
                          >
                            <div className="w-6 h-6 shrink-0 bg-[#00D4FF]/20 text-[#00D4FF] rounded text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </div>
                            <div className="text-xs">
                              <div className="font-bold text-white">Team {idx + 1}</div>
                              <div className="text-gray-400">
                                ({t.players[0].name} & {t.players[1].name})
                              </div>
                            </div>
                          </div>
                        ))}
                      {(phase === 'league' || phase === 'finished') &&
                        teams.map((t) => (
                          <div
                            key={t.id}
                            className="bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-lg p-2 flex gap-2 items-center"
                          >
                            <div className="w-6 h-6 shrink-0 bg-[#39FF14]/20 text-[#39FF14] rounded text-xs font-bold flex items-center justify-center">
                              {t.name.replace('Tim ', '')}
                            </div>
                            <div className="text-xs">
                              <div className="font-bold text-white">{t.name}</div>
                              <div className="text-gray-400">
                                ({t.players[0].name} & {t.players[1].name})
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {phase === 'input' && (
                  <div className="mt-6 space-y-2">
                    {!isEnough && totalPlayers > 0 && (
                      <p className="text-xs text-yellow-500 text-center">
                        Butuh minimal 4 pemain (saat ini {totalPlayers})
                      </p>
                    )}
                    {isEnough && !isEven && (
                      <p className="text-xs text-yellow-500 text-center">
                        Jumlah pemain harus genap untuk membentuk tim (saat ini {totalPlayers})
                      </p>
                    )}
                    <button
                      onClick={startDrafting}
                      disabled={!canStartDrafting}
                      className="w-full bg-gray-800 text-gray-400 py-3 rounded-lg font-bold text-sm tracking-widest hover:bg-gray-700 transition disabled:opacity-40 uppercase border border-gray-700"
                    >
                      MULAI DRAFTING TIM SEKARANG
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PANEL 2: DRAFTING — RODA PUTAR */}
            <div
              className={`bg-[#1a1f26] border border-gray-800 rounded-2xl overflow-hidden shadow-xl transition ${
                phase !== 'drafting' ? 'opacity-40 pointer-events-none grayscale' : ''
              }`}
            >
              <div className="bg-[#202730] px-5 py-3 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-200 tracking-wider">
                  2. DRAFTING TIM: FASE LOTERE
                </h2>
                {phase === 'drafting' && (
                  <div className="text-[#39FF14] text-xs">Live Draw</div>
                )}
              </div>
              <div className="p-6">
                <div className="text-center font-bold text-gray-400 text-xs sm:text-sm uppercase tracking-widest mb-6 border border-gray-700 p-3 rounded">
                  {phase === 'drafting' && remainingPlayers.length === 0
                    ? 'Draf Tim Selesai! Tim Baru Terbentuk!'
                    : 'SISTEM SEDANG MENGACAK...'}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
                  {/* Roda 1 */}
                  <div className="flex flex-col items-center">
                    <CircularWheel
                      players={
                        phase === 'drafting' &&
                        remainingPlayers.length === 0 &&
                        finalTeams.length > 0
                          ? [finalTeams[finalTeams.length - 1].players[0]]
                          : remainingPlayers
                      }
                      targetPlayerId={targetIdP1}
                      onFinish={handleSpinFinish}
                      colorTheme="blue"
                    />
                    <div className="mt-4 bg-[#00D4FF]/10 border border-[#00D4FF]/30 px-4 py-1.5 rounded text-[#00D4FF] font-bold text-xs text-center w-full min-h-[32px]">
                      {phase === 'drafting' &&
                      remainingPlayers.length === 0 &&
                      finalTeams.length > 0
                        ? `TERPILIH: ${finalTeams[finalTeams.length - 1].players[0].name}`
                        : currentTeam.length >= 1
                          ? currentTeam[0].name
                          : 'Pemain 1'}
                    </div>
                  </div>

                  {/* Roda 2 */}
                  <div className="flex flex-col items-center">
                    <CircularWheel
                      players={
                        phase === 'drafting' &&
                        remainingPlayers.length === 0 &&
                        finalTeams.length > 0
                          ? [finalTeams[finalTeams.length - 1].players[1]]
                          : remainingPlayers
                      }
                      targetPlayerId={targetIdP2}
                      onFinish={handleSpinFinish}
                      colorTheme="green"
                    />
                    <div className="mt-4 bg-[#39FF14]/10 border border-[#39FF14]/30 px-4 py-1.5 rounded text-[#39FF14] font-bold text-xs text-center w-full min-h-[32px]">
                      {phase === 'drafting' &&
                      remainingPlayers.length === 0 &&
                      finalTeams.length > 0
                        ? `TERPILIH: ${finalTeams[finalTeams.length - 1].players[1].name}`
                        : currentTeam.length >= 2
                          ? currentTeam[1].name
                          : 'Pemain 2'}
                    </div>
                  </div>
                </div>

                {phase === 'drafting' && remainingPlayers.length > 0 ? (
                  <button
                    onClick={handleSpin}
                    disabled={isSpinning}
                    className="w-full bg-[#00D4FF] text-black py-4 rounded-xl font-black text-sm tracking-widest uppercase hover:bg-[#00D4FF]/90 transition shadow-[0_0_15px_rgba(0,212,255,0.4)] disabled:opacity-50"
                  >
                    {isSpinning ? 'MEMUTAR...' : 'ACAK PEMAIN'}
                  </button>
                ) : phase === 'drafting' && remainingPlayers.length === 0 ? (
                  <div className="flex gap-4">
                    <button
                      disabled
                      className="w-1/3 bg-gray-700 text-gray-400 py-4 rounded-xl font-black text-sm tracking-widest uppercase opacity-50 cursor-not-allowed"
                    >
                      ACAK LAGI
                    </button>
                    <button
                      onClick={() => finalizeDrafting()}
                      className="w-2/3 bg-[#00D4FF] text-black py-4 rounded-xl font-black text-sm tracking-widest uppercase hover:bg-[#00D4FF]/90 transition shadow-[0_0_20px_rgba(0,212,255,0.6)] border border-[#00D4FF]"
                    >
                      KONFIRMASI & BUAT JADWAL LIGA
                    </button>
                  </div>
                ) : (
                  <div className="w-full bg-gray-800 text-gray-500 py-4 rounded-xl font-black text-sm tracking-widest uppercase text-center border border-gray-700">
                    MENUNGGU PENDAFTARAN
                  </div>
                )}
              </div>
            </div>

            {/* PANEL 3: HALL OF FAME */}
            <HallOfFameBoard />
          </div>

          {/* ── KOLOM KANAN: Liga + Klasemen ── */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* PANEL: JADWAL LIGA */}
            <div
              className={`bg-[#1a1f26] border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col ${
                phase !== 'league' && phase !== 'finished'
                  ? 'opacity-40 pointer-events-none grayscale'
                  : ''
              }`}
            >
              <div className="bg-[#202730] px-5 py-3 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-200 tracking-wider">
                  JADWAL LIGA ROUND-ROBIN
                </h2>
                {phase === 'league' && (
                  <div className="text-xs text-[#00D4FF] font-bold">
                    {matches.filter((m) => m.status === 'finished').length} / {matches.length} selesai
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col gap-5">
                {/* Banner Juara */}
                {phase === 'finished' && champion && (
                  <ChampionBanner
                    champion={champion}
                    isSaving={isSavingToFirebase}
                    saveError={firebaseSaveError}
                    saveSuccess={firebaseSaveSuccess}
                    onSave={endLeagueAndSaveChampion}
                  />
                )}

                {/* Jadwal Liga */}
                {(phase === 'league' || phase === 'finished') && (
                  <LeagueView onOpenMatch={openMatch} />
                )}

                {phase !== 'league' && phase !== 'finished' && (
                  <div className="flex items-center justify-center min-h-[300px] text-gray-600 text-sm font-bold tracking-widest uppercase">
                    Jadwal liga belum dibuat
                  </div>
                )}
              </div>
            </div>

            {/* PANEL: KLASEMEN */}
            {(phase === 'league' || phase === 'finished') && <StandingsTable />}
          </div>
        </div>
      </main>

      {/* ── Modals & Overlays ── */}
      {activeMatchId && <ScoreboardModal />}
      {isResting && restEndTime && (
        <RestTimer restEndTime={restEndTime} onSkip={skipRest} />
      )}

      {/* ── Custom Scrollbar CSS ── */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #1a1f26; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #2d3748; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4a5568; }
          .score-pop { animation: scorePop 0.3s cubic-bezier(0.34,1.56,0.64,1); }
          @keyframes scorePop { 0% { transform: scale(1); } 50% { transform: scale(1.18); } 100% { transform: scale(1); } }
          .btn-score-a {
            background: linear-gradient(135deg, #0a3d52, #0a5a7a);
            border: 1px solid rgba(0,212,255,0.4);
            color: #00D4FF;
            box-shadow: 0 0 20px rgba(0,212,255,0.15);
          }
          .btn-score-a:hover:not(:disabled) {
            background: linear-gradient(135deg, #0d4d66, #0d6e94);
            box-shadow: 0 0 28px rgba(0,212,255,0.3);
          }
          .btn-score-a:disabled { opacity: 0.3; cursor: not-allowed; }
          .btn-score-b {
            background: linear-gradient(135deg, #52100a, #7a1a0a);
            border: 1px solid rgba(255,49,49,0.4);
            color: #FF3131;
            box-shadow: 0 0 20px rgba(255,49,49,0.15);
          }
          .btn-score-b:hover:not(:disabled) {
            background: linear-gradient(135deg, #66140d, #941d0d);
            box-shadow: 0 0 28px rgba(255,49,49,0.3);
          }
          .btn-score-b:disabled { opacity: 0.3; cursor: not-allowed; }
          .neon-green { color: #39FF14; text-shadow: 0 0 10px rgba(57,255,20,0.5); }
          .neon-amber { color: #FFB800; text-shadow: 0 0 10px rgba(255,184,0,0.5); }
          .neon-red   { color: #FF3131; text-shadow: 0 0 10px rgba(255,49,49,0.5); }
        `
      }} />
    </div>
  );
}

// ── Banner Juara ──────────────────────────────────────────────────────────

interface ChampionBannerProps {
  champion: NonNullable<ReturnType<typeof useLeagueStore.getState>['champion']>;
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  onSave: () => Promise<void>;
}

function ChampionBanner({
  champion,
  isSaving,
  saveError,
  saveSuccess,
  onSave,
}: ChampionBannerProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-900/40 via-black to-yellow-900/20 border border-yellow-500/50 shadow-[0_0_40px_rgba(250,204,21,0.2)] p-6 flex flex-col items-center gap-4">
      <Trophy className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-pulse" />
      <div className="text-center">
        <div className="text-yellow-400 text-xs font-black tracking-widest mb-1">
          🏆 JUARA LIGA MUSIM INI
        </div>
        <div className="text-white font-black text-2xl">{champion.name}</div>
        <div className="text-yellow-100 font-bold text-sm mt-1 drop-shadow-md">
          {champion.players[0].name} & {champion.players[1].name}
        </div>
      </div>

      {/* Tombol simpan ke Hall of Fame */}
      {!saveSuccess ? (
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition hover:opacity-90 disabled:opacity-60"
          style={{
            background: 'rgba(255,215,0,0.15)',
            border: '1px solid rgba(255,215,0,0.4)',
            color: '#FFD700',
          }}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan ke Hall of Fame...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Akhiri Liga & Simpan Juara ke Hall of Fame
            </>
          )}
        </button>
      ) : (
        <div
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
          style={{
            background: 'rgba(57,255,20,0.08)',
            border: '1px solid rgba(57,255,20,0.3)',
            color: '#39FF14',
          }}
        >
          <CheckCircle2 className="w-4 h-4" />
          Juara berhasil disimpan ke Hall of Fame!
        </div>
      )}

      {saveError && (
        <div
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg w-full"
          style={{
            background: 'rgba(255,49,49,0.08)',
            border: '1px solid rgba(255,49,49,0.3)',
            color: '#FF3131',
          }}
        >
          <AlertTriangle className="w-3 h-3 shrink-0" />
          {saveError}
        </div>
      )}
    </div>
  );
}

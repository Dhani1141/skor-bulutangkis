// ============================================================
// tournamentStore.ts – Zustand Global State Management
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Player, Team, Match, TournamentPhase } from '@/types/tournament';
import { fisherYatesShuffle, chunkArray } from '@/lib/shuffleUtils';
import { generateDoubleEliminationBracket, advanceTeam, runAutoAdvanceCleanup } from '@/lib/bracketGenerator';
import { checkWinner } from '@/lib/scoringLogic';

// ── State Interface ────────────────────────────────────────────────────────

interface TournamentState {
  // Data
  phase: TournamentPhase;
  players: Player[];
  teams: Team[];
  matches: Match[];
  champion: Team | null;
  activeMatchId: string | null;

  // Queue & Rest
  isResting: boolean;
  restEndTime: number | null; // timestamp ms kapan istirahat berakhir

  // Drafting Data
  remainingPlayers: Player[];
  currentTeam: Player[];
  finalTeams: Team[];
  forcedNextResult: string;

  // Actions – Input Phase
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  updatePlayer: (id: string, name: string) => void;
  
  // Actions – Drafting Phase
  startDrafting: () => void;
  drawPlayer: (playerId: string) => void;
  finalizeDrafting: () => void;

  // Actions – Bracket Phase
  openMatch: (matchId: string) => void;
  closeMatch: () => void;
  incrementScore: (side: 'A' | 'B') => void;
  decrementScore: (side: 'A' | 'B') => void;
  saveMatch: () => void;
  skipRest: () => void;

  // Utility
  resetTournament: () => void;
  getActiveMatch: () => Match | null;
  getMatchQueue: () => Match[];
}

// ── Store Implementation ───────────────────────────────────────────────────

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      // ── Initial State ────────────────────────────────────────────────────
      phase: 'input',
      players: [],
      
      remainingPlayers: [],
      currentTeam: [],
      finalTeams: [],
      forcedNextResult: '',

      teams: [],
      matches: [],
      champion: null,
      activeMatchId: null,
      isResting: false,
      restEndTime: null,

      // ── Actions – Input Phase ────────────────────────────────────────────

      addPlayer: (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          players: [
            ...state.players,
            { id: uuidv4(), name: trimmed },
          ],
        }));
      },

      removePlayer: (id: string) => {
        set((state) => ({
          players: state.players.filter((p) => p.id !== id),
        }));
      },

      updatePlayer: (id: string, name: string) => {
        set((state) => ({
          players: state.players.map((p) =>
            p.id === id ? { ...p, name } : p
          ),
        }));
      },

      startDrafting: () => {
        const { players } = get();
        if (players.length < 4 || players.length % 2 !== 0) return;

        // Shuffle remaining players so the wheel has a randomized base
        const shuffled = fisherYatesShuffle([...players]);

        set({
          phase: 'drafting',
          remainingPlayers: shuffled,
          currentTeam: [],
          finalTeams: [],
          forcedNextResult: '',
        });
      },

      drawPlayer: (playerId: string) => {
        const state = get();
        const player = state.remainingPlayers.find(p => p.id === playerId);
        if (!player) return;

        const newRemaining = state.remainingPlayers.filter(p => p.id !== playerId);
        const newCurrentTeam = [...state.currentTeam, player];
        const newFinalTeams = [...state.finalTeams];
        let newForcedResult = '';

        // The Rigged Logic
        if (newCurrentTeam.length === 1) {
          const drawnName = player.name.toLowerCase();
          if (drawnName === 'kunyuk') {
            const diccyExists = newRemaining.some(p => p.name.toLowerCase() === 'diccy');
            if (diccyExists) newForcedResult = 'diccy';
          } else if (drawnName === 'diccy') {
            const kunyukExists = newRemaining.some(p => p.name.toLowerCase() === 'kunyuk');
            if (kunyukExists) newForcedResult = 'kunyuk';
          }
        } else if (newCurrentTeam.length === 2) {
          newFinalTeams.push({
            id: uuidv4(),
            name: '', // assigned later
            players: [newCurrentTeam[0], newCurrentTeam[1]],
          });
          // clear for next team
          newCurrentTeam.length = 0;
          newForcedResult = '';

          // AUTO-COMPLETE: Jika sisa tepat 2 pemain, langsung gabungkan jadi tim terakhir
          if (newRemaining.length === 2) {
            newFinalTeams.push({
              id: uuidv4(),
              name: '',
              players: [newRemaining[0], newRemaining[1]],
            });
            newRemaining.length = 0; // Habiskan
          }
        }

        set({
          remainingPlayers: newRemaining,
          currentTeam: newCurrentTeam,
          finalTeams: newFinalTeams,
          forcedNextResult: newForcedResult,
        });

        // Jika semua pemain sudah habis terundi, langsung finalize
        if (newRemaining.length === 0) {
          get().finalizeDrafting();
        }
      },

      finalizeDrafting: () => {
        const { finalTeams } = get();
        if (finalTeams.length === 0) return;

        // Acak urutan tim agar posisi di bracket tetap adil
        const shuffledTeams = fisherYatesShuffle([...finalTeams]);

        // Berikan nama Tim A, Tim B, dst
        const teams: Team[] = shuffledTeams.map((team, idx) => ({
          ...team,
          name: `Tim ${String.fromCharCode(65 + idx)}`
        }));

        // Generate bracket
        const matches = generateDoubleEliminationBracket(teams);

        set({
          teams,
          matches,
          phase: 'bracket',
          champion: null,
          activeMatchId: null,
        });
      },

      // ── Actions – Bracket Phase ──────────────────────────────────────────

      openMatch: (matchId: string) => {
        const match = get().matches.find((m) => m.id === matchId);
        if (!match || match.status === 'finished') return;
        if (!match.teamA || !match.teamB) return; // belum siap
        set({ activeMatchId: matchId });
        // Set status ke ongoing
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId ? { ...m, status: 'ongoing' } : m
          ),
        }));
      },

      closeMatch: () => {
        set({ activeMatchId: null });
      },

      /**
       * Tambah poin ke tim A atau B.
       * Skor dikunci jika sudah ada pemenang.
       */
      incrementScore: (side: 'A' | 'B') => {
        const { activeMatchId, matches } = get();
        if (!activeMatchId) return;

        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== activeMatchId) return m;
            // Jangan tambah poin jika sudah ada pemenang
            if (m.winner) return m;

            const newScoreA = side === 'A' ? m.scoreA + 1 : m.scoreA;
            const newScoreB = side === 'B' ? m.scoreB + 1 : m.scoreB;
            const winnerSide = checkWinner(newScoreA, newScoreB);

            const winnerTeam = winnerSide === 'A' ? m.teamA : winnerSide === 'B' ? m.teamB : null;
            const loserTeam = winnerSide === 'A' ? m.teamB : winnerSide === 'B' ? m.teamA : null;

            return {
              ...m,
              scoreA: newScoreA,
              scoreB: newScoreB,
              winner: winnerTeam,
              loser: loserTeam,
              status: winnerTeam ? 'finished' : 'ongoing',
            };
          }),
        }));
      },

      /**
       * Kurangi poin tim A atau B.
       * Jika match sebelumnya selesai tapi skor berkurang sehingga tidak ada pemenang,
       * match akan kembali 'ongoing'.
       */
      decrementScore: (side: 'A' | 'B') => {
        const { activeMatchId, matches } = get();
        if (!activeMatchId) return;

        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== activeMatchId) return m;

            const newScoreA = side === 'A' ? Math.max(0, m.scoreA - 1) : m.scoreA;
            const newScoreB = side === 'B' ? Math.max(0, m.scoreB - 1) : m.scoreB;
            const winnerSide = checkWinner(newScoreA, newScoreB);

            const winnerTeam = winnerSide === 'A' ? m.teamA : winnerSide === 'B' ? m.teamB : null;
            const loserTeam = winnerSide === 'A' ? m.teamB : winnerSide === 'B' ? m.teamA : null;

            return {
              ...m,
              scoreA: newScoreA,
              scoreB: newScoreB,
              winner: winnerTeam,
              loser: loserTeam,
              status: winnerTeam ? 'finished' : 'ongoing',
            };
          }),
        }));
      },

      /**
       * Simpan hasil match dan advance tim ke match berikutnya.
       * - Pemenang Upper → match upper berikutnya
       * - Pecundang Upper → match lower
       * - Pecundang Lower → eliminasi
       * - Pemenang Grand Final → champion
       */
      saveMatch: () => {
        const { activeMatchId, matches, teams } = get();
        if (!activeMatchId) return;

        const finishedMatch = matches.find((m) => m.id === activeMatchId);
        if (!finishedMatch || !finishedMatch.winner) return;

        // Custom Bo3 logic for 2 teams
        if (teams.length === 2) {
          const winnerId = finishedMatch.winner.id;
          const wins = matches.filter(m => m.winner?.id === winnerId).length;
          if (wins >= 2) {
            set({ champion: finishedMatch.winner, phase: 'finished', activeMatchId: null });
          } else {
            // Find next match and set to pending
            const nextMatch = matches.find(m => m.status === 'pending');
            if (nextMatch) {
              set((state) => ({
                matches: state.matches.map(m => m.id === nextMatch.id ? { ...m, status: 'pending' } : m),
                activeMatchId: null,
                isResting: true,
                restEndTime: Date.now() + 5 * 60 * 1000,
              }));
            }
          }
          return;
        }

        // Check apakah ini Grand Final
        if (finishedMatch.bracket === 'grand_final') {
            // Langsung set champion (Sudden Death, no bracket reset/True Grand Final)
            set({
              champion: finishedMatch.winner,
              phase: 'finished',
              activeMatchId: null,
            });
            return;
          }

          // Jika UB winner yang menang GF pertama, atau siapapun yang menang GF-Reset
          set({
            champion: finishedMatch.winner,
            phase: 'finished',
            activeMatchId: null,
          });
          return;
        }

        // Advance pemenang & pecundang ke match berikutnya
        const matchMap = new Map(matches.map((m) => [m.id, { ...m }]));
        advanceTeam(matchMap, finishedMatch);

        // Run auto-advance cleanup untuk bye/walkover secara iteratif sampai tidak ada yang maju lagi
        let cleanupNeeded = true;
        while (cleanupNeeded) {
          cleanupNeeded = runAutoAdvanceCleanup(matchMap);
        }

        set({
          matches: Array.from(matchMap.values()),
          activeMatchId: null,
          isResting: true,
          restEndTime: Date.now() + 5 * 60 * 1000, // 5 menit
        });
      },

      skipRest: () => {
        set({ isResting: false, restEndTime: null });
      },

      // ── Utility ─────────────────────────────────────────────────────────

      resetTournament: () => {
        set({
          phase: 'input',
          players: [],
          remainingPlayers: [],
          currentTeam: [],
          finalTeams: [],
          forcedNextResult: '',
          teams: [],
          matches: [],
          champion: null,
          activeMatchId: null,
          isResting: false,
          restEndTime: null,
        });
      },

      getActiveMatch: () => {
        const { activeMatchId, matches } = get();
        if (!activeMatchId) return null;
        return matches.find((m) => m.id === activeMatchId) ?? null;
      },

      /**
       * Mengurutkan match yang siap dimainkan (kedua tim sudah ada)
       * dengan pola bergantian UB Round N → LB Round N.
       */
      getMatchQueue: () => {
        const { matches } = get();

        // Hanya match yang pending dan sudah punya kedua tim
        const ready = matches.filter(
          (m) => m.status === 'pending' && m.teamA !== null && m.teamB !== null
        );

        // Kelompokkan: ubRound -> LBRound lalu susun bergantian
        const grouped = new Map<string, Match[]>();
        for (const m of ready) {
          const key = `${m.bracket}-${m.round}`;
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)!.push(m);
        }

        // Tentukan max round per bracket
        const ubRounds = [...new Set(ready.filter(m => m.bracket === 'upper').map(m => m.round))].sort((a,b) => a - b);
        const lbRounds = [...new Set(ready.filter(m => m.bracket === 'lower').map(m => m.round))].sort((a,b) => a - b);
        const gfRounds = [...new Set(ready.filter(m => m.bracket === 'grand_final').map(m => m.round))].sort((a,b) => a - b);

        const ordered: Match[] = [];
        const maxLen = Math.max(ubRounds.length, lbRounds.length, gfRounds.length);

        for (let i = 0; i < maxLen; i++) {
          if (ubRounds[i] !== undefined) {
            const key = `upper-${ubRounds[i]}`;
            ordered.push(...(grouped.get(key) ?? []));
          }
          if (lbRounds[i] !== undefined) {
            const key = `lower-${lbRounds[i]}`;
            ordered.push(...(grouped.get(key) ?? []));
          }
          if (gfRounds[i] !== undefined) {
            const key = `grand_final-${gfRounds[i]}`;
            ordered.push(...(grouped.get(key) ?? []));
          }
        }

        return ordered;
      },
    }),
    {
      name: 'badminton-tournament-storage',
      // Hanya persist data penting, bukan activeMatchId
      partialize: (state) => ({
        phase: state.phase,
        players: state.players,
        teams: state.teams,
        matches: state.matches,
        champion: state.champion,
      }),
    }
  )
);

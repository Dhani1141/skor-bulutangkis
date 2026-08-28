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

  // Actions – Input Phase
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  updatePlayer: (id: string, name: string) => void;
  generateBracket: () => void;

  // Actions – Bracket Phase
  openMatch: (matchId: string) => void;
  closeMatch: () => void;
  incrementScore: (side: 'A' | 'B') => void;
  saveMatch: () => void;

  // Utility
  resetTournament: () => void;
  getActiveMatch: () => Match | null;
}

// ── Store Implementation ───────────────────────────────────────────────────

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      // ── Initial State ────────────────────────────────────────────────────
      phase: 'input',
      players: [],
      teams: [],
      matches: [],
      champion: null,
      activeMatchId: null,

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

      /**
       * Generate bracket:
       * 1. Validasi jumlah pemain (harus genap, minimal 4)
       * 2. Acak pemain dengan Fisher-Yates
       * 3. Bentuk tim (setiap 2 pemain = 1 tim)
       * 4. Generate Double Elimination Bracket
       */
      generateBracket: () => {
        const { players } = get();
        if (players.length < 4 || players.length % 2 !== 0) return;

        let availablePlayers = [...players];
        let specialTeamPlayers: [Player, Player] | null = null;

        // Cek keberadaan "kunyuk" dan "diccy" (case-insensitive)
        const kunyuk = availablePlayers.find(p => p.name.toLowerCase() === 'kunyuk');
        const diccy = availablePlayers.find(p => p.name.toLowerCase() === 'diccy');

        if (kunyuk && diccy && kunyuk.id !== diccy.id) {
          // Pisahkan mereka dari array utama
          specialTeamPlayers = [kunyuk, diccy];
          availablePlayers = availablePlayers.filter(p => p.id !== kunyuk.id && p.id !== diccy.id);
        }

        // Fisher-Yates shuffle untuk sisa pemain
        const shuffledPlayers = fisherYatesShuffle(availablePlayers);

        // Bentuk grup (2 pemain per grup)
        const teamGroups = chunkArray(shuffledPlayers, 2);
        
        // Buat array tim sementara (tanpa nama dulu)
        const initialTeams: Team[] = teamGroups.map((group) => ({
          id: uuidv4(),
          name: '',
          players: [group[0], group[1]] as [Player, Player],
        }));

        // Masukkan tim khusus jika ada
        if (specialTeamPlayers) {
          initialTeams.push({
            id: uuidv4(),
            name: '',
            players: specialTeamPlayers,
          });
        }

        // Acak urutan tim agar posisi di bracket tetap adil
        const shuffledTeams = fisherYatesShuffle(initialTeams);

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
       * Simpan hasil match dan advance tim ke match berikutnya.
       * - Pemenang Upper → match upper berikutnya
       * - Pecundang Upper → match lower
       * - Pecundang Lower → eliminasi
       * - Pemenang Grand Final → champion
       */
      saveMatch: () => {
        const { activeMatchId, matches } = get();
        if (!activeMatchId) return;

        const finishedMatch = matches.find((m) => m.id === activeMatchId);
        if (!finishedMatch || !finishedMatch.winner) return;

        // Check apakah ini Grand Final
        if (finishedMatch.bracket === 'grand_final') {
          // Jika yang menang adalah tim B (dari Lower Bracket) DAN match saat ini bukan 'GF-Reset'
          if (finishedMatch.id === 'GF' && finishedMatch.winner?.id === finishedMatch.teamB?.id) {
            // Bracket Reset! Create True Grand Final
            const trueGF: Match = {
              id: 'GF-Reset',
              round: 2,
              position: 1,
              bracket: 'grand_final',
              teamA: finishedMatch.teamB, // The winner of first GF (from LB)
              teamB: finishedMatch.teamA, // The loser of first GF (from UB, now has 1 loss)
              scoreA: 0,
              scoreB: 0,
              winner: null,
              loser: null,
              status: 'pending',
              nextMatchWinnerId: null,
              nextWinnerSlot: null,
              nextMatchLoserId: null,
              nextLoserSlot: null,
            };

            set((state) => ({
              matches: [...state.matches, trueGF],
              activeMatchId: null,
            }));
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
        });
      },

      // ── Utility ─────────────────────────────────────────────────────────

      resetTournament: () => {
        set({
          phase: 'input',
          players: [],
          teams: [],
          matches: [],
          champion: null,
          activeMatchId: null,
        });
      },

      getActiveMatch: () => {
        const { activeMatchId, matches } = get();
        if (!activeMatchId) return null;
        return matches.find((m) => m.id === activeMatchId) ?? null;
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

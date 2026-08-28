// ============================================================
// tournamentStore.ts – Zustand Global State Management
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Player, Team, Match, TournamentPhase } from '@/types/tournament';
import { fisherYatesShuffle, chunkArray } from '@/lib/shuffleUtils';
import { generateDoubleEliminationBracket, advanceTeam } from '@/lib/bracketGenerator';
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

        // Fisher-Yates shuffle
        const shuffled = fisherYatesShuffle(players);

        // Bentuk tim (2 pemain per tim)
        const teamGroups = chunkArray(shuffled, 2);
        const teams: Team[] = teamGroups.map((group, idx) => ({
          id: uuidv4(),
          name: `Tim ${String.fromCharCode(65 + idx)}`, // Tim A, Tim B, dst.
          players: [group[0], group[1]] as [Player, Player],
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

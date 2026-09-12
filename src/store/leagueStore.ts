// ============================================================
// leagueStore.ts – Zustand Global State Management (Sistem Liga)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Player, Team, LeagueMatch, TeamStanding, LeaguePhase } from '@/types/league';
import { fisherYatesShuffle } from '@/lib/shuffleUtils';
import { generateLeagueSchedule } from '@/lib/leagueScheduler';
import { checkWinner } from '@/lib/scoringLogic';
import { saveChampions } from '@/lib/hallOfFame';
import { generateCustomTeams } from '@/lib/customMatchmaking';

// ── State Interface ────────────────────────────────────────────────────────

interface LeagueState {
  // Fase & Data Utama
  phase: LeaguePhase;
  players: Player[];
  teams: Team[];
  matches: LeagueMatch[];
  champion: Team | null;
  activeMatchId: string | null;

  // Rest Timer
  isResting: boolean;
  restEndTime: number | null;

  // Drafting
  remainingPlayers: Player[];
  currentTeam: Player[];
  finalTeams: Team[];
  predefinedPairs: Player[][];
  forcedNextResult: string;

  // Status simpan ke Firebase
  isSavingToFirebase: boolean;
  firebaseSaveError: string | null;
  firebaseSaveSuccess: boolean;

  // ── Actions: Input Phase ──────────────────────────────────────────────
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  /**
   * Update nama pemain secara global — propagasi ke teams[], matches[].
   * Tidak mereset skor atau membatalkan pertandingan yang berjalan.
   */
  updatePlayer: (id: string, newName: string) => void;

  // ── Actions: Drafting Phase ───────────────────────────────────────────
  startDrafting: () => void;
  drawPlayer: (playerId: string) => void;
  finalizeDrafting: () => void;

  // ── Actions: League Phase ─────────────────────────────────────────────
  openMatch: (matchId: string) => void;
  closeMatch: () => void;
  incrementScore: (side: 'A' | 'B') => void;
  /**
   * Kurangi skor. Jika match sebelumnya sudah 'finished' dan skor
   * turun sehingga tidak ada lagi pemenang, status dikembalikan ke 'ongoing'
   * dan winner di-reset → match bisa dilanjutkan kembali.
   */
  decrementScore: (side: 'A' | 'B') => void;
  saveMatch: () => void;
  skipRest: () => void;

  // ── Actions: End of Season ────────────────────────────────────────────
  endLeagueAndSaveChampion: () => Promise<void>;

  // ── Utility ───────────────────────────────────────────────────────────
  resetLeague: () => void;
  getActiveMatch: () => LeagueMatch | null;
  getStandings: () => TeamStanding[];
  getUpcomingMatches: () => LeagueMatch[];
  getPendingCount: () => number;
}

// ── Helper: propagasi perubahan nama pemain ────────────────────────────────

/**
 * Memperbarui nama seorang pemain di dalam sebuah objek Team.
 * Mengembalikan team baru (immutable) atau team yang sama jika tidak ada perubahan.
 */
function updatePlayerInTeam(team: Team, playerId: string, newName: string): Team {
  const [p0, p1] = team.players;
  if (p0.id !== playerId && p1.id !== playerId) return team;
  return {
    ...team,
    players: [
      p0.id === playerId ? { ...p0, name: newName } : p0,
      p1.id === playerId ? { ...p1, name: newName } : p1,
    ],
  };
}

/**
 * Memperbarui nama pemain di dalam sebuah LeagueMatch.
 */
function updatePlayerInMatch(match: LeagueMatch, playerId: string, newName: string): LeagueMatch {
  const newTeamA = updatePlayerInTeam(match.teamA, playerId, newName);
  const newTeamB = updatePlayerInTeam(match.teamB, playerId, newName);
  const newWinner = match.winner
    ? updatePlayerInTeam(match.winner, playerId, newName)
    : null;

  if (newTeamA === match.teamA && newTeamB === match.teamB && newWinner === match.winner) {
    return match;
  }
  return { ...match, teamA: newTeamA, teamB: newTeamB, winner: newWinner };
}

// ── Initial State ──────────────────────────────────────────────────────────

const initialState = {
  phase: 'input' as LeaguePhase,
  players: [] as Player[],
  teams: [] as Team[],
  matches: [] as LeagueMatch[],
  champion: null,
  activeMatchId: null,
  isResting: false,
  restEndTime: null,
  remainingPlayers: [] as Player[],
  currentTeam: [] as Player[],
  finalTeams: [] as Team[],
  predefinedPairs: [] as Player[][],
  forcedNextResult: '',
  isSavingToFirebase: false,
  firebaseSaveError: null,
  firebaseSaveSuccess: false,
};

// ── Store ──────────────────────────────────────────────────────────────────

export const useLeagueStore = create<LeagueState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ── Input Phase ────────────────────────────────────────────────────

      addPlayer: (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          players: [...state.players, { id: uuidv4(), name: trimmed }],
        }));
      },

      removePlayer: (id: string) => {
        set((state) => ({
          players: state.players.filter((p) => p.id !== id),
        }));
      },

      updatePlayer: (id: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) return;

        set((state) => {
          // 1. Update daftar pemain global
          const updatedPlayers = state.players.map((p) =>
            p.id === id ? { ...p, name: trimmed } : p,
          );

          // 2. Update semua tim
          const updatedTeams = state.teams.map((t) =>
            updatePlayerInTeam(t, id, trimmed),
          );

          // 3. Update semua pertandingan (teamA, teamB, winner) secara immutable
          const updatedMatches = state.matches.map((m) =>
            updatePlayerInMatch(m, id, trimmed),
          );

          // 4. Update champion jika pemain tersebut bagian dari tim juara
          const updatedChampion = state.champion
            ? updatePlayerInTeam(state.champion, id, trimmed)
            : null;

          // 5. Update finalTeams (drafting phase)
          const updatedFinalTeams = state.finalTeams.map((t) =>
            updatePlayerInTeam(t, id, trimmed),
          );

          // 6. Update currentTeam (drafting phase)
          const updatedCurrentTeam = state.currentTeam.map((p) =>
            p.id === id ? { ...p, name: trimmed } : p,
          );

          return {
            players: updatedPlayers,
            teams: updatedTeams,
            matches: updatedMatches,
            champion: updatedChampion,
            finalTeams: updatedFinalTeams,
            currentTeam: updatedCurrentTeam,
          };
        });
      },

      // ── Drafting Phase ─────────────────────────────────────────────────

      startDrafting: () => {
        const { players } = get();
        if (players.length < 4 || players.length % 2 !== 0) return;

        const pairs = generateCustomTeams([...players]);
        
        // remainingPlayers diacak HANYA untuk tampilan roda putar (biar posisinya ngacak)
        const shuffled = fisherYatesShuffle([...players]);

        set({
          phase: 'drafting',
          remainingPlayers: shuffled,
          currentTeam: [],
          finalTeams: [],
          predefinedPairs: pairs,
          forcedNextResult: '',
        });
      },

      drawPlayer: (playerId: string) => {
        const state = get();
        const player = state.remainingPlayers.find((p) => p.id === playerId);
        if (!player) return;

        const newRemaining = state.remainingPlayers.filter((p) => p.id !== playerId);
        const newCurrentTeam = [...state.currentTeam, player];
        const newFinalTeams = [...state.finalTeams];

        if (newCurrentTeam.length === 2) {
          newFinalTeams.push({
            id: uuidv4(),
            name: '',
            players: [newCurrentTeam[0], newCurrentTeam[1]],
          });
          newCurrentTeam.length = 0;
        }

        set({
          remainingPlayers: newRemaining,
          currentTeam: newCurrentTeam,
          finalTeams: newFinalTeams,
        });
      },

      finalizeDrafting: () => {
        const { finalTeams } = get();
        if (finalTeams.length === 0) return;

        const shuffledTeams = fisherYatesShuffle([...finalTeams]);

        // Beri nama tim: Tim A, Tim B, ...
        const teams: Team[] = shuffledTeams.map((team, idx) => ({
          ...team,
          name: `Tim ${String.fromCharCode(65 + idx)}`,
        }));

        // Generate jadwal liga round-robin
        const matches = generateLeagueSchedule(teams);

        set({
          teams,
          matches,
          phase: 'league',
          champion: null,
          activeMatchId: null,
          firebaseSaveSuccess: false,
          firebaseSaveError: null,
        });
      },

      // ── League Phase ───────────────────────────────────────────────────

      openMatch: (matchId: string) => {
        const match = get().matches.find((m) => m.id === matchId);
        if (!match || match.status === 'finished') return;

        set((state) => ({
          activeMatchId: matchId,
          matches: state.matches.map((m) =>
            m.id === matchId ? { ...m, status: 'ongoing' } : m,
          ),
        }));
      },

      closeMatch: () => {
        set({ activeMatchId: null });
      },

      incrementScore: (side: 'A' | 'B') => {
        const { activeMatchId } = get();
        if (!activeMatchId) return;

        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== activeMatchId) return m;
            // Jika sudah ada pemenang, jangan tambah poin lagi
            if (m.winner) return m;

            const newScoreA = side === 'A' ? m.scoreA + 1 : m.scoreA;
            const newScoreB = side === 'B' ? m.scoreB + 1 : m.scoreB;
            const winnerSide = checkWinner(newScoreA, newScoreB);

            const winner =
              winnerSide === 'A' ? m.teamA
              : winnerSide === 'B' ? m.teamB
              : null;

            return {
              ...m,
              scoreA: newScoreA,
              scoreB: newScoreB,
              winner,
              status: winner ? 'finished' : 'ongoing',
            };
          }),
        }));
      },

      decrementScore: (side: 'A' | 'B') => {
        const { activeMatchId } = get();
        if (!activeMatchId) return;

        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== activeMatchId) return m;
            // Tombol [-] tetap bisa diklik meski ada pemenang
            // agar bisa mengoreksi skor yang salah

            const newScoreA = side === 'A' ? Math.max(0, m.scoreA - 1) : m.scoreA;
            const newScoreB = side === 'B' ? Math.max(0, m.scoreB - 1) : m.scoreB;
            const winnerSide = checkWinner(newScoreA, newScoreB);

            const winner =
              winnerSide === 'A' ? m.teamA
              : winnerSide === 'B' ? m.teamB
              : null;

            // Jika sebelumnya sudah finish tapi sekarang tidak ada pemenang lagi,
            // kembalikan status ke 'ongoing' (unlock match)
            const newStatus = winner ? 'finished' : 'ongoing';

            return {
              ...m,
              scoreA: newScoreA,
              scoreB: newScoreB,
              winner,
              status: newStatus,
            };
          }),
        }));
      },

      saveMatch: () => {
        const { activeMatchId, matches } = get();
        if (!activeMatchId) return;

        const match = matches.find((m) => m.id === activeMatchId);
        if (!match || !match.winner) return;

        // Cek apakah semua pertandingan sudah selesai
        const updatedMatches = matches.map((m) =>
          m.id === activeMatchId ? { ...m, status: 'finished' as const } : m,
        );
        const allFinished = updatedMatches.every((m) => m.status === 'finished');

        if (allFinished) {
          // Liga selesai — tentukan juara berdasarkan klasemen
          const standings = computeStandings(get().teams, updatedMatches);
          const champion = standings[0]
            ? get().teams.find((t) => t.id === standings[0].teamId) ?? null
            : null;

          set({
            matches: updatedMatches,
            activeMatchId: null,
            champion,
            phase: 'finished',
            isResting: false,
            restEndTime: null,
          });
        } else {
          set({
            matches: updatedMatches,
            activeMatchId: null,
            isResting: true,
            restEndTime: Date.now() + 5 * 60 * 1000, // 5 menit istirahat
          });
        }
      },

      skipRest: () => {
        set({ isResting: false, restEndTime: null });
      },

      // ── End of Season ──────────────────────────────────────────────────

      endLeagueAndSaveChampion: async () => {
        const { champion } = get();
        if (!champion) return;

        set({ isSavingToFirebase: true, firebaseSaveError: null });

        try {
          await saveChampions(champion.players);
          set({ isSavingToFirebase: false, firebaseSaveSuccess: true });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Gagal menyimpan ke Firebase';
          set({ isSavingToFirebase: false, firebaseSaveError: message });
        }
      },

      // ── Utility ────────────────────────────────────────────────────────

      resetLeague: () => {
        set(initialState);
      },

      getActiveMatch: () => {
        const { activeMatchId, matches } = get();
        if (!activeMatchId) return null;
        return matches.find((m) => m.id === activeMatchId) ?? null;
      },

      getStandings: () => {
        const { teams, matches } = get();
        return computeStandings(teams, matches);
      },

      getUpcomingMatches: () => {
        const { matches } = get();
        return matches
          .filter((m) => m.status === 'pending')
          .sort((a, b) => a.round - b.round || a.position - b.position);
      },

      getPendingCount: () => {
        return get().matches.filter((m) => m.status === 'pending').length;
      },
    }),
    {
      name: 'badminton-league-storage',
      partialize: (state) => ({
        phase: state.phase,
        players: state.players,
        teams: state.teams,
        matches: state.matches,
        champion: state.champion,
        firebaseSaveSuccess: state.firebaseSaveSuccess,
      }),
    },
  ),
);

// ── computeStandings (pure function, digunakan internal & oleh komponen) ───

export function computeStandings(
  teams: Team[],
  matches: LeagueMatch[],
): TeamStanding[] {
  const map = new Map<string, TeamStanding>();

  // Inisialisasi semua tim dengan nilai 0
  for (const team of teams) {
    map.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      players: team.players,
      played: 0,
      won: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      leaguePoints: 0,
    });
  }

  // Hitung statistik dari semua pertandingan yang sudah selesai
  for (const m of matches) {
    if (m.status !== 'finished') continue;

    const sA = map.get(m.teamA.id);
    const sB = map.get(m.teamB.id);
    if (!sA || !sB) continue;

    sA.played++;
    sB.played++;
    sA.pointsFor += m.scoreA;
    sA.pointsAgainst += m.scoreB;
    sB.pointsFor += m.scoreB;
    sB.pointsAgainst += m.scoreA;

    if (m.winner?.id === m.teamA.id) {
      sA.won++;
      sA.leaguePoints += 2;
      sB.lost++;
    } else if (m.winner?.id === m.teamB.id) {
      sB.won++;
      sB.leaguePoints += 2;
      sA.lost++;
    }
  }

  // Urutkan: poin terbanyak → selisih poin terbesar → poin masuk terbanyak
  return Array.from(map.values()).sort((a, b) => {
    if (b.leaguePoints !== a.leaguePoints) return b.leaguePoints - a.leaguePoints;
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    if (diffB !== diffA) return diffB - diffA;
    return b.pointsFor - a.pointsFor;
  });
}

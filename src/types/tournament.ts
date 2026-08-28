// ============================================================
// tournament.ts – Tipe data inti untuk turnamen bulu tangkis
// ============================================================

/** Satu pemain individu */
export interface Player {
  id: string;
  name: string;
}

/** Tim berisi tepat 2 pemain (format 2v2) */
export interface Team {
  id: string;
  /** Nama tim otomatis: "Tim A", "Tim B", dst. */
  name: string;
  players: [Player, Player];
}

/** Status sebuah pertandingan */
export type MatchStatus = 'pending' | 'ongoing' | 'finished';

/** Posisi slot tim dalam sebuah match */
export type TeamSlot = 'A' | 'B';

/** Jenis bracket */
export type BracketType = 'upper' | 'lower' | 'grand_final';

/**
 * Satu pertandingan di dalam bracket.
 * nextMatchWinnerId  → match yang menerima pemenang match ini
 * nextMatchLoserId   → match yang menerima pecundang match ini (hanya upper bracket)
 * nextWinnerSlot     → slot A atau B di match tujuan pemenang
 * nextLoserSlot      → slot A atau B di match tujuan pecundang
 */
export interface Match {
  id: string;
  /** Ronde ke-berapa dalam bracketnya */
  round: number;
  /** Urutan match dalam ronde tersebut */
  position: number;
  bracket: BracketType;
  teamA: Team | null;
  teamB: Team | null;
  scoreA: number;
  scoreB: number;
  winner: Team | null;
  loser: Team | null;
  status: MatchStatus;
  // Routing pemenang
  nextMatchWinnerId: string | null;
  nextWinnerSlot: TeamSlot | null;
  // Routing pecundang (dari upper → lower)
  nextMatchLoserId: string | null;
  nextLoserSlot: TeamSlot | null;
}

/** Fase keseluruhan turnamen */
export type TournamentPhase = 'input' | 'bracket' | 'finished';

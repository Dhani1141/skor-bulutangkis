// ============================================================
// league.ts – Tipe data inti untuk Sistem Liga Round-Robin
// ============================================================

// ── Entitas Dasar ─────────────────────────────────────────────────────────

/** Satu pemain individu */
export interface Player {
  id: string;
  name: string;
}

/** Tim berisi tepat 2 pemain (format ganda 2v2) */
export interface Team {
  id: string;
  /** Nama tim otomatis: "Tim A", "Tim B", dst. */
  name: string;
  players: [Player, Player];
}

// ── Pertandingan ───────────────────────────────────────────────────────────

/** Status sebuah pertandingan */
export type MatchStatus = 'pending' | 'ongoing' | 'finished';

/** Satu pertandingan dalam jadwal liga */
export interface LeagueMatch {
  id: string;
  /** Nomor ronde dalam liga (1-based) */
  round: number;
  /** Posisi/urutan dalam ronde tersebut (1-based) */
  position: number;
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  winner: Team | null;
  status: MatchStatus;
}

// ── Klasemen ──────────────────────────────────────────────────────────────

/** Data baris klasemen untuk satu tim */
export interface TeamStanding {
  teamId: string;
  teamName: string;
  players: [Player, Player];
  /** Jumlah pertandingan yang sudah dimainkan */
  played: number;
  /** Jumlah kemenangan */
  won: number;
  /** Jumlah kekalahan */
  lost: number;
  /** Total poin yang dicetak (Points For) */
  pointsFor: number;
  /** Total poin yang kemasukan (Points Against) */
  pointsAgainst: number;
  /** Poin liga: 2 per menang, 0 per kalah */
  leaguePoints: number;
}

// ── Liga ──────────────────────────────────────────────────────────────────

/** Fase keseluruhan aplikasi */
export type LeaguePhase = 'input' | 'drafting' | 'league' | 'finished';

// ── Hall of Fame ──────────────────────────────────────────────────────────

/** Entri satu pemain di Firestore collection `hall_of_fame` */
export interface HallOfFameEntry {
  /** Nama pemain (digunakan sebagai key unik) */
  name: string;
  /** Total gelar juara yang pernah diraih */
  championships_won: number;
  /** Timestamp terakhir kali meraih gelar (ISO string) */
  last_won_at: string;
}

// ============================================================
// bracketGenerator.ts – Generator Double Elimination Bracket
// Mendukung 2–8 tim (4–16 pemain, 2 pemain per tim)
// ============================================================

import { Match, Team } from '@/types/tournament';

/**
 * Menghasilkan struktur Double Elimination Bracket lengkap.
 *
 * Struktur DE Bracket:
 * ┌─────────────────────────────────────────────────────┐
 * │  UPPER BRACKET                                      │
 * │  Round 1 → Round 2 → ... → Upper Final             │
 * │             ↓ loser                                 │
 * │  LOWER BRACKET                                      │
 * │  LR1 → LR2 → ... → Lower Final                    │
 * │                        ↓ winner                     │
 * │  GRAND FINAL (Upper champ vs Lower champ)           │
 * └─────────────────────────────────────────────────────┘
 *
 * @param teams - Array tim yang sudah diacak
 * @returns Array Match yang merepresentasikan seluruh bracket
 */
export function generateDoubleEliminationBracket(teams: Team[]): Match[] {
  const n = teams.length;
  if (n < 2) throw new Error('Minimal 2 tim diperlukan');

  // Pad jumlah tim ke pangkat 2 terdekat (untuk bracket yang bersih)
  const bracketSize = nextPowerOf2(n);
  const paddedTeams: (Team | null)[] = [...teams];
  while (paddedTeams.length < bracketSize) paddedTeams.push(null);

  const matches: Match[] = [];

  // ── UPPER BRACKET ─────────────────────────────────────────────────────────
  // Ronde 1 Upper: pasangkan tim (1vs8, 2vs7, 3vs6, 4vs5 untuk bracket 8 tim)
  // Untuk simplisitas kita pakai pasangan berurutan: [0,1], [2,3], [4,5], [6,7]
  const upperR1Matches: Match[] = [];
  for (let i = 0; i < bracketSize; i += 2) {
    const m: Match = {
      id: `U1-${Math.floor(i / 2) + 1}`,
      round: 1,
      position: Math.floor(i / 2) + 1,
      bracket: 'upper',
      teamA: paddedTeams[i] ?? null,
      teamB: paddedTeams[i + 1] ?? null,
      scoreA: 0,
      scoreB: 0,
      winner: null,
      loser: null,
      status: (paddedTeams[i] !== null && paddedTeams[i + 1] !== null) ? 'pending' : 'pending',
      nextMatchWinnerId: null,
      nextWinnerSlot: null,
      nextMatchLoserId: null,
      nextLoserSlot: null,
    };
    // Auto-advance jika salah satu slot null (bye)
    if (paddedTeams[i] === null && paddedTeams[i + 1] !== null) {
      m.winner = paddedTeams[i + 1];
      m.status = 'finished';
    } else if (paddedTeams[i] !== null && paddedTeams[i + 1] === null) {
      m.winner = paddedTeams[i];
      m.status = 'finished';
    }
    matches.push(m);
    upperR1Matches.push(m);
  }

  // Ronde-ronde Upper Bracket berikutnya
  let prevUpperRound = upperR1Matches;
  let upperRoundNum = 2;
  const upperRounds: Match[][] = [upperR1Matches];

  while (prevUpperRound.length > 1) {
    const nextRoundMatches: Match[] = [];
    for (let i = 0; i < prevUpperRound.length; i += 2) {
      const m: Match = {
        id: `U${upperRoundNum}-${Math.floor(i / 2) + 1}`,
        round: upperRoundNum,
        position: Math.floor(i / 2) + 1,
        bracket: 'upper',
        teamA: null,
        teamB: null,
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
      matches.push(m);
      nextRoundMatches.push(m);

      // Hubungkan ronde sebelumnya ke ronde ini
      prevUpperRound[i].nextMatchWinnerId = m.id;
      prevUpperRound[i].nextWinnerSlot = 'A';
      if (i + 1 < prevUpperRound.length) {
        prevUpperRound[i + 1].nextMatchWinnerId = m.id;
        prevUpperRound[i + 1].nextWinnerSlot = 'B';
      }
    }
    upperRounds.push(nextRoundMatches);
    prevUpperRound = nextRoundMatches;
    upperRoundNum++;
  }

  // prevUpperRound[0] adalah Upper Final (pemenang masuk Grand Final)
  const upperFinal = prevUpperRound[0];

  // ── LOWER BRACKET ─────────────────────────────────────────────────────────
  // LR1: pecundang dari Upper R1 masuk ke LR1
  // Untuk bracketSize=8: 4 match upper R1 → 4 pecundang → 2 match LR1
  // Setiap ronde LB:
  //   Ronde ganjil (L1, L3, ...): pecundang dari UB ronde berikutnya vs survivor LB
  //   Ronde genap (L2, L4, ...): survivor LB vs survivor LB

  const lowerRounds: Match[][] = [];
  let lowerRoundNum = 1;

  // LR1: pecundang Upper R1 main sesama
  const lbR1Matches: Match[] = [];
  for (let i = 0; i < upperR1Matches.length; i += 2) {
    const m: Match = {
      id: `L${lowerRoundNum}-${Math.floor(i / 2) + 1}`,
      round: lowerRoundNum,
      position: Math.floor(i / 2) + 1,
      bracket: 'lower',
      teamA: null, // diisi oleh pecundang U1-i
      teamB: null, // diisi oleh pecundang U1-(i+1)
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
    matches.push(m);
    lbR1Matches.push(m);

    // Routing pecundang dari Upper R1 → LR1
    upperR1Matches[i].nextMatchLoserId = m.id;
    upperR1Matches[i].nextLoserSlot = 'A';
    if (i + 1 < upperR1Matches.length) {
      upperR1Matches[i + 1].nextMatchLoserId = m.id;
      upperR1Matches[i + 1].nextLoserSlot = 'B';
    }
  }
  lowerRounds.push(lbR1Matches);
  lowerRoundNum++;

  // Ronde LB berikutnya bergantian:
  // - Ronde genap: survivor LB vs survivor LB (tidak ada infus dari UB)
  // - Ronde ganjil (≥3): pecundang dari UB ronde selanjutnya vs survivor LB
  let prevLBRound = lbR1Matches;
  let upperRoundIdx = 1; // index ronde upper berikutnya yang akan drop pecundang ke LB

  while (prevLBRound.length > 1 || (upperRoundIdx < upperRounds.length - 1)) {
    // LR genap: survivor LB vs survivor LB
    const evenMatches: Match[] = [];
    for (let i = 0; i < prevLBRound.length; i += 2) {
      const m: Match = {
        id: `L${lowerRoundNum}-${Math.floor(i / 2) + 1}`,
        round: lowerRoundNum,
        position: Math.floor(i / 2) + 1,
        bracket: 'lower',
        teamA: null,
        teamB: null,
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
      matches.push(m);
      evenMatches.push(m);
      prevLBRound[i].nextMatchWinnerId = m.id;
      prevLBRound[i].nextWinnerSlot = 'A';
      if (i + 1 < prevLBRound.length) {
        prevLBRound[i + 1].nextMatchWinnerId = m.id;
        prevLBRound[i + 1].nextWinnerSlot = 'B';
      }
    }
    lowerRounds.push(evenMatches);
    lowerRoundNum++;
    prevLBRound = evenMatches;

    if (prevLBRound.length <= 1) break;

    // LR ganjil (≥3): pecundang dari UB ronde berikutnya masuk
    if (upperRoundIdx < upperRounds.length - 1) {
      const ubRoundToDrop = upperRounds[upperRoundIdx];
      upperRoundIdx++;
      const oddMatches: Match[] = [];
      for (let i = 0; i < prevLBRound.length; i++) {
        const m: Match = {
          id: `L${lowerRoundNum}-${i + 1}`,
          round: lowerRoundNum,
          position: i + 1,
          bracket: 'lower',
          teamA: null, // survivor LB
          teamB: null, // pecundang UB
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
        matches.push(m);
        oddMatches.push(m);
        prevLBRound[i].nextMatchWinnerId = m.id;
        prevLBRound[i].nextWinnerSlot = 'A';
        if (i < ubRoundToDrop.length) {
          ubRoundToDrop[i].nextMatchLoserId = m.id;
          ubRoundToDrop[i].nextLoserSlot = 'B';
        }
      }
      lowerRounds.push(oddMatches);
      lowerRoundNum++;
      prevLBRound = oddMatches;
    }
  }

  // prevLBRound[0] adalah Lower Final (pemenang masuk Grand Final)
  const lowerFinal = prevLBRound[0];

  // ── GRAND FINAL ───────────────────────────────────────────────────────────
  const grandFinal: Match = {
    id: 'GF',
    round: 1,
    position: 1,
    bracket: 'grand_final',
    teamA: null, // pemenang Upper Final
    teamB: null, // pemenang Lower Final
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
  matches.push(grandFinal);

  upperFinal.nextMatchWinnerId = grandFinal.id;
  upperFinal.nextWinnerSlot = 'A';
  lowerFinal.nextMatchWinnerId = grandFinal.id;
  lowerFinal.nextWinnerSlot = 'B';

  // Jika hanya 2 tim: skip ronde-ronde dan langsung GF
  // (kasus ini sudah dihandle karena Upper R1 dengan 1 match
  // akan langsung menjadi Upper Final, dan LB tidak ada)

  // Populate tim yang sudah pasti (dari bye) ke match berikutnya
  applyAutoAdvance(matches);

  return matches;
}

/** Menerapkan auto-advance untuk match dengan bye (salah satu tim null) */
function applyAutoAdvance(matches: Match[]): void {
  const matchMap = new Map(matches.map((m) => [m.id, m]));

  for (const match of matches) {
    if (match.status === 'finished' && match.winner) {
      advanceTeam(matchMap, match);
    }
  }
}

/** Memindahkan pemenang/pecundang ke match berikutnya */
export function advanceTeam(
  matchMap: Map<string, Match>,
  finishedMatch: Match
): void {
  const { winner, loser, nextMatchWinnerId, nextWinnerSlot, nextMatchLoserId, nextLoserSlot } =
    finishedMatch;

  if (winner && nextMatchWinnerId) {
    const nextWinMatch = matchMap.get(nextMatchWinnerId);
    if (nextWinMatch) {
      if (nextWinnerSlot === 'A') nextWinMatch.teamA = winner;
      else nextWinMatch.teamB = winner;
      // Ubah status jadi pending jika kedua tim sudah ada
      if (nextWinMatch.teamA && nextWinMatch.teamB) nextWinMatch.status = 'pending';
    }
  }

  if (loser && nextMatchLoserId) {
    const nextLoseMatch = matchMap.get(nextMatchLoserId);
    if (nextLoseMatch) {
      if (nextLoserSlot === 'A') nextLoseMatch.teamA = loser;
      else nextLoseMatch.teamB = loser;
      if (nextLoseMatch.teamA && nextLoseMatch.teamB) nextLoseMatch.status = 'pending';
    }
  }
}

/** Mengembalikan pangkat 2 terdekat yang ≥ n */
function nextPowerOf2(n: number): number {
  if (n <= 1) return 1;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/** Mengekstrak ronde-ronde dari array match berdasarkan bracket type */
export function groupMatchesByRound(
  matches: Match[],
  bracket: 'upper' | 'lower' | 'grand_final'
): Match[][] {
  const filtered = matches.filter((m) => m.bracket === bracket);
  const maxRound = Math.max(...filtered.map((m) => m.round), 0);
  const rounds: Match[][] = [];
  for (let r = 1; r <= maxRound; r++) {
    const roundMatches = filtered
      .filter((m) => m.round === r)
      .sort((a, b) => a.position - b.position);
    if (roundMatches.length > 0) rounds.push(roundMatches);
  }
  return rounds;
}

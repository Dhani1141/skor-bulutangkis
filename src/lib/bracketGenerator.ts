// ============================================================
// bracketGenerator.ts – Double Elimination Bracket Generator
// Algoritma: alternating Consolidation + Infusion rounds
//
// Struktur Lower Bracket yang BENAR untuk N tim:
//   LR1 (consolidation): losers UR1 main sesama
//   LR2 (infusion):      UR2 losers vs LR1 survivors
//   LR3 (consolidation): LR2 survivors main sesama (jika lebih dari 1)
//   LR4 (infusion):      UR3 losers vs LR3 survivors
//   ... dst sampai 1 survivor → Lower Final
//   Grand Final: Upper Final winner vs Lower Final winner
// ============================================================

import { Match, Team, BracketType, TeamSlot } from '@/types/tournament';

// ── Helper: buat satu match object ────────────────────────────────────────

function makeMatch(
  id: string,
  round: number,
  position: number,
  bracket: BracketType,
  teamA: Team | null,
  teamB: Team | null,
): Match {
  return {
    id, round, position, bracket,
    teamA, teamB,
    scoreA: 0, scoreB: 0,
    winner: null, loser: null,
    status: 'pending',
    nextMatchWinnerId: null, nextWinnerSlot: null,
    nextMatchLoserId:  null, nextLoserSlot:  null,
  };
}

// ── Helper: pangkat 2 terdekat ≥ n ────────────────────────────────────────

function nextPowerOf2(n: number): number {
  if (n <= 1) return 2;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ══════════════════════════════════════════════════════════════════════════

export function generateDoubleEliminationBracket(teams: Team[]): Match[] {
  const n = teams.length;
  if (n < 2) throw new Error('Minimal 2 tim diperlukan');

  const matches: Match[] = [];

  switch (n) {
    case 2: {
      matches.push(makeMatch('GF-1', 1, 1, 'grand_final', teams[0], teams[1]));
      matches.push(makeMatch('GF-2', 2, 1, 'grand_final', teams[0], teams[1]));
      matches.push(makeMatch('GF-3', 3, 1, 'grand_final', teams[0], teams[1]));
      break;
    }
    case 3: {
      const m1 = makeMatch('U1-1', 1, 1, 'upper', teams[1], teams[2]);
      const m2 = makeMatch('U2-1', 2, 1, 'upper', teams[0], null);
      const m3 = makeMatch('L1-1', 1, 1, 'lower', null, null);
      const gf = makeMatch('GF', 1, 1, 'grand_final', null, null);

      m1.nextMatchWinnerId = m2.id; m1.nextWinnerSlot = 'B';
      m1.nextMatchLoserId = m3.id; m1.nextLoserSlot = 'A';

      m2.nextMatchWinnerId = gf.id; m2.nextWinnerSlot = 'A';
      m2.nextMatchLoserId = m3.id; m2.nextLoserSlot = 'B';

      m3.nextMatchWinnerId = gf.id; m3.nextWinnerSlot = 'B';

      matches.push(m1, m2, m3, gf);
      break;
    }
    case 4: {
      const m1 = makeMatch('U1-1', 1, 1, 'upper', teams[0], teams[1]);
      const m2 = makeMatch('U1-2', 1, 2, 'upper', teams[2], teams[3]);
      const m3 = makeMatch('U2-1', 2, 1, 'upper', null, null);
      const m4 = makeMatch('L1-1', 1, 1, 'lower', null, null);
      const m5 = makeMatch('L2-1', 2, 1, 'lower', null, null);
      const gf = makeMatch('GF', 1, 1, 'grand_final', null, null);

      m1.nextMatchWinnerId = m3.id; m1.nextWinnerSlot = 'A';
      m1.nextMatchLoserId = m4.id; m1.nextLoserSlot = 'A';
      
      m2.nextMatchWinnerId = m3.id; m2.nextWinnerSlot = 'B';
      m2.nextMatchLoserId = m4.id; m2.nextLoserSlot = 'B';

      m3.nextMatchWinnerId = gf.id; m3.nextWinnerSlot = 'A';
      m3.nextMatchLoserId = m5.id; m3.nextLoserSlot = 'B';

      m4.nextMatchWinnerId = m5.id; m4.nextWinnerSlot = 'A';
      m5.nextMatchWinnerId = gf.id; m5.nextWinnerSlot = 'B';

      matches.push(m1, m2, m3, m4, m5, gf);
      break;
    }
    case 5: {
      const u1_1 = makeMatch('U1-1', 1, 1, 'upper', teams[3], teams[4]);
      const u2_1 = makeMatch('U2-1', 2, 1, 'upper', teams[0], teams[1]);
      const u2_2 = makeMatch('U2-2', 2, 2, 'upper', teams[2], null);
      const u3_1 = makeMatch('U3-1', 3, 1, 'upper', null, null);
      
      const l1_1 = makeMatch('L1-1', 1, 1, 'lower', null, null);
      const l2_1 = makeMatch('L2-1', 2, 1, 'lower', null, null);
      const l3_1 = makeMatch('L3-1', 3, 1, 'lower', null, null);
      const gf = makeMatch('GF', 1, 1, 'grand_final', null, null);

      u1_1.nextMatchWinnerId = u2_2.id; u1_1.nextWinnerSlot = 'B';
      u1_1.nextMatchLoserId = l1_1.id; u1_1.nextLoserSlot = 'B';

      u2_1.nextMatchWinnerId = u3_1.id; u2_1.nextWinnerSlot = 'A';
      u2_1.nextMatchLoserId = l2_1.id; u2_1.nextLoserSlot = 'B';

      u2_2.nextMatchWinnerId = u3_1.id; u2_2.nextWinnerSlot = 'B';
      u2_2.nextMatchLoserId = l1_1.id; u2_2.nextLoserSlot = 'A';

      u3_1.nextMatchWinnerId = gf.id; u3_1.nextWinnerSlot = 'A';
      u3_1.nextMatchLoserId = l3_1.id; u3_1.nextLoserSlot = 'B';

      l1_1.nextMatchWinnerId = l2_1.id; l1_1.nextWinnerSlot = 'A';
      l2_1.nextMatchWinnerId = l3_1.id; l2_1.nextWinnerSlot = 'A';
      l3_1.nextMatchWinnerId = gf.id; l3_1.nextWinnerSlot = 'B';

      matches.push(u1_1, u2_1, u2_2, u3_1, l1_1, l2_1, l3_1, gf);
      break;
    }
    case 6: {
      const u1_1 = makeMatch('U1-1', 1, 1, 'upper', teams[2], teams[3]);
      const u1_2 = makeMatch('U1-2', 1, 2, 'upper', teams[4], teams[5]);
      
      const u2_1 = makeMatch('U2-1', 2, 1, 'upper', teams[0], null);
      const u2_2 = makeMatch('U2-2', 2, 2, 'upper', teams[1], null);
      
      const u3_1 = makeMatch('U3-1', 3, 1, 'upper', null, null);
      
      const l1_1 = makeMatch('L1-1', 1, 1, 'lower', null, null);
      const l2_1 = makeMatch('L2-1', 2, 1, 'lower', null, null);
      const l3_1 = makeMatch('L3-1', 3, 1, 'lower', null, null);
      const l4_1 = makeMatch('L4-1', 4, 1, 'lower', null, null);
      const gf = makeMatch('GF', 1, 1, 'grand_final', null, null);

      u1_1.nextMatchWinnerId = u2_1.id; u1_1.nextWinnerSlot = 'B';
      u1_1.nextMatchLoserId = l1_1.id; u1_1.nextLoserSlot = 'A';
      
      u1_2.nextMatchWinnerId = u2_2.id; u1_2.nextWinnerSlot = 'B';
      u1_2.nextMatchLoserId = l1_1.id; u1_2.nextLoserSlot = 'B';

      u2_1.nextMatchWinnerId = u3_1.id; u2_1.nextWinnerSlot = 'A';
      u2_1.nextMatchLoserId = l2_1.id; u2_1.nextLoserSlot = 'B';
      
      u2_2.nextMatchWinnerId = u3_1.id; u2_2.nextWinnerSlot = 'B';
      u2_2.nextMatchLoserId = l3_1.id; u2_2.nextLoserSlot = 'B';

      u3_1.nextMatchWinnerId = gf.id; u3_1.nextWinnerSlot = 'A';
      u3_1.nextMatchLoserId = l4_1.id; u3_1.nextLoserSlot = 'B';

      l1_1.nextMatchWinnerId = l2_1.id; l1_1.nextWinnerSlot = 'A';
      l2_1.nextMatchWinnerId = l3_1.id; l2_1.nextWinnerSlot = 'A';
      l3_1.nextMatchWinnerId = l4_1.id; l3_1.nextWinnerSlot = 'A';
      l4_1.nextMatchWinnerId = gf.id; l4_1.nextWinnerSlot = 'B';

      matches.push(u1_1, u1_2, u2_1, u2_2, u3_1, l1_1, l2_1, l3_1, l4_1, gf);
      break;
    }
    case 7: {
      const u1_1 = makeMatch('U1-1', 1, 1, 'upper', teams[1], teams[2]);
      const u1_2 = makeMatch('U1-2', 1, 2, 'upper', teams[3], teams[4]);
      const u1_3 = makeMatch('U1-3', 1, 3, 'upper', teams[5], teams[6]);

      const u2_1 = makeMatch('U2-1', 2, 1, 'upper', teams[0], null);
      const u2_2 = makeMatch('U2-2', 2, 2, 'upper', null, null);

      const u3_1 = makeMatch('U3-1', 3, 1, 'upper', null, null);

      const l1_1 = makeMatch('L1-1', 1, 1, 'lower', null, null);
      const l2_1 = makeMatch('L2-1', 2, 1, 'lower', null, null);
      const l2_2 = makeMatch('L2-2', 2, 2, 'lower', null, null);
      const l3_1 = makeMatch('L3-1', 3, 1, 'lower', null, null);
      const l4_1 = makeMatch('L4-1', 4, 1, 'lower', null, null);
      const gf = makeMatch('GF', 1, 1, 'grand_final', null, null);

      u1_1.nextMatchWinnerId = u2_1.id; u1_1.nextWinnerSlot = 'B';
      u1_1.nextMatchLoserId = l2_2.id; u1_1.nextLoserSlot = 'B';

      u1_2.nextMatchWinnerId = u2_2.id; u1_2.nextWinnerSlot = 'A';
      u1_2.nextMatchLoserId = l1_1.id; u1_2.nextLoserSlot = 'A';

      u1_3.nextMatchWinnerId = u2_2.id; u1_3.nextWinnerSlot = 'B';
      u1_3.nextMatchLoserId = l1_1.id; u1_3.nextLoserSlot = 'B';

      u2_1.nextMatchWinnerId = u3_1.id; u2_1.nextWinnerSlot = 'A';
      u2_1.nextMatchLoserId = l2_2.id; u2_1.nextLoserSlot = 'A';

      u2_2.nextMatchWinnerId = u3_1.id; u2_2.nextWinnerSlot = 'B';
      u2_2.nextMatchLoserId = l2_1.id; u2_2.nextLoserSlot = 'A';

      u3_1.nextMatchWinnerId = gf.id; u3_1.nextWinnerSlot = 'A';
      u3_1.nextMatchLoserId = l4_1.id; u3_1.nextLoserSlot = 'B';

      l1_1.nextMatchWinnerId = l2_1.id; l1_1.nextWinnerSlot = 'B';
      
      l2_1.nextMatchWinnerId = l3_1.id; l2_1.nextWinnerSlot = 'A';
      l2_2.nextMatchWinnerId = l3_1.id; l2_2.nextWinnerSlot = 'B';
      
      l3_1.nextMatchWinnerId = l4_1.id; l3_1.nextWinnerSlot = 'A';
      
      l4_1.nextMatchWinnerId = gf.id; l4_1.nextWinnerSlot = 'B';

      matches.push(u1_1, u1_2, u1_3, u2_1, u2_2, u3_1, l1_1, l2_1, l2_2, l3_1, l4_1, gf);
      break;
    }
    case 8: {
      const u1_1 = makeMatch('U1-1', 1, 1, 'upper', teams[0], teams[1]);
      const u1_2 = makeMatch('U1-2', 1, 2, 'upper', teams[2], teams[3]);
      const u1_3 = makeMatch('U1-3', 1, 3, 'upper', teams[4], teams[5]);
      const u1_4 = makeMatch('U1-4', 1, 4, 'upper', teams[6], teams[7]);

      const u2_1 = makeMatch('U2-1', 2, 1, 'upper', null, null);
      const u2_2 = makeMatch('U2-2', 2, 2, 'upper', null, null);
      
      const u3_1 = makeMatch('U3-1', 3, 1, 'upper', null, null);

      const l1_1 = makeMatch('L1-1', 1, 1, 'lower', null, null);
      const l1_2 = makeMatch('L1-2', 1, 2, 'lower', null, null);
      
      const l2_1 = makeMatch('L2-1', 2, 1, 'lower', null, null);
      const l2_2 = makeMatch('L2-2', 2, 2, 'lower', null, null);
      
      const l3_1 = makeMatch('L3-1', 3, 1, 'lower', null, null);
      
      const l4_1 = makeMatch('L4-1', 4, 1, 'lower', null, null);
      const gf = makeMatch('GF', 1, 1, 'grand_final', null, null);

      u1_1.nextMatchWinnerId = u2_1.id; u1_1.nextWinnerSlot = 'A';
      u1_1.nextMatchLoserId = l1_1.id; u1_1.nextLoserSlot = 'A';

      u1_2.nextMatchWinnerId = u2_1.id; u1_2.nextWinnerSlot = 'B';
      u1_2.nextMatchLoserId = l1_1.id; u1_2.nextLoserSlot = 'B';

      u1_3.nextMatchWinnerId = u2_2.id; u1_3.nextWinnerSlot = 'A';
      u1_3.nextMatchLoserId = l1_2.id; u1_3.nextLoserSlot = 'A';

      u1_4.nextMatchWinnerId = u2_2.id; u1_4.nextWinnerSlot = 'B';
      u1_4.nextMatchLoserId = l1_2.id; u1_4.nextLoserSlot = 'B';

      u2_1.nextMatchWinnerId = u3_1.id; u2_1.nextWinnerSlot = 'A';
      u2_1.nextMatchLoserId = l2_2.id; u2_1.nextLoserSlot = 'A';

      u2_2.nextMatchWinnerId = u3_1.id; u2_2.nextWinnerSlot = 'B';
      u2_2.nextMatchLoserId = l2_1.id; u2_2.nextLoserSlot = 'A';

      u3_1.nextMatchWinnerId = gf.id; u3_1.nextWinnerSlot = 'A';
      u3_1.nextMatchLoserId = l4_1.id; u3_1.nextLoserSlot = 'B';

      l1_1.nextMatchWinnerId = l2_1.id; l1_1.nextWinnerSlot = 'B';
      l1_2.nextMatchWinnerId = l2_2.id; l1_2.nextWinnerSlot = 'B';

      l2_1.nextMatchWinnerId = l3_1.id; l2_1.nextWinnerSlot = 'A';
      l2_2.nextMatchWinnerId = l3_1.id; l2_2.nextWinnerSlot = 'B';

      l3_1.nextMatchWinnerId = l4_1.id; l3_1.nextWinnerSlot = 'A';

      l4_1.nextMatchWinnerId = gf.id; l4_1.nextWinnerSlot = 'B';

      matches.push(u1_1, u1_2, u1_3, u1_4, u2_1, u2_2, u3_1, l1_1, l1_2, l2_1, l2_2, l3_1, l4_1, gf);
      break;
    }
    default:
      throw new Error('Hanya mendukung 2 sampai 8 tim');
  }

  // Set initial status to pending for matches that have both teams (except for Bo3 GF-2 and GF-3)
  for (const m of matches) {
    if (m.teamA !== null && m.teamB !== null) {
      if (m.id === 'GF-2' || m.id === 'GF-3') continue;
      m.status = 'pending';
    }
  }

  return matches;
}

// ══════════════════════════════════════════════════════════════════════════
// AUTO-ADVANCE HELPERS
// ══════════════════════════════════════════════════════════════════════════

function applyInitialAutoAdvance(matches: Match[]): void {
  const map = new Map(matches.map(m => [m.id, m]));
  
  // 1. Advance teams from matches that are already finished (e.g. UR1 bye matches)
  for (const m of Array.from(map.values())) {
    if (m.status === 'finished' && m.winner) {
      advanceTeam(map, m);
    }
  }

  // 2. Run the cleanup loop to handle double-byes and walkovers rippling through
  let cleanupNeeded = true;
  while (cleanupNeeded) {
    cleanupNeeded = runAutoAdvanceCleanup(map);
  }
}

// ── advanceTeam: pindahkan pemenang/pecundang ke match berikutnya ─────────

export function advanceTeam(
  map: Map<string, Match>,
  finished: Match,
): void {
  const { winner, loser, nextMatchWinnerId, nextWinnerSlot, nextMatchLoserId, nextLoserSlot } = finished;

  if (winner && nextMatchWinnerId) {
    const next = map.get(nextMatchWinnerId);
    if (next && next.status !== 'finished') {
      if (nextWinnerSlot === 'A') next.teamA = winner;
      else                        next.teamB = winner;
      if (next.teamA && next.teamB) next.status = 'pending';
    }
  }

  if (loser && nextMatchLoserId) {
    const next = map.get(nextMatchLoserId);
    if (next && next.status !== 'finished') {
      if (nextLoserSlot === 'A') next.teamA = loser;
      else                       next.teamB = loser;
      if (next.teamA && next.teamB) next.status = 'pending';
    }
  }
}

// ── findSlotSource: cari match yang mengisi slot tertentu ─────────────────

export function findSlotSource(
  map: Map<string, Match>,
  targetId: string,
  slot: TeamSlot,
): Match | null {
  for (const m of map.values()) {
    if (m.nextMatchWinnerId === targetId && m.nextWinnerSlot === slot) return m;
    if (m.nextMatchLoserId  === targetId && m.nextLoserSlot  === slot) return m;
  }
  return null;
}

// ── runAutoAdvanceCleanup: auto-advance match dengan 1 tim saja
//    ketika slot kosong dipastikan tidak akan pernah terisi (bye/walkover)
//
//    Contoh: L1-1 (Tim A vs null) → null-nya dari bye U1-2 yang
//    sudah finish tanpa loser → Tim A langsung menang L1-1 otomatis
// ─────────────────────────────────────────────────────────────────────────

export function runAutoAdvanceCleanup(map: Map<string, Match>): boolean {
  let changed = false;

  for (const m of Array.from(map.values())) {
    if (m.status === 'finished') continue;

    const hasA = m.teamA !== null;
    const hasB = m.teamB !== null;

    if (!hasA && !hasB) {
      // Cek apakah KEDUA source sudah finished dan menghasilkan null (double-bye)
      const srcA = findSlotSource(map, m.id, 'A');
      const srcB = findSlotSource(map, m.id, 'B');

      const isSrcADead = srcA && srcA.status === 'finished' && 
        ((srcA.nextMatchLoserId === m.id && srcA.nextLoserSlot === 'A' && srcA.loser === null) || 
         (srcA.nextMatchWinnerId === m.id && srcA.nextWinnerSlot === 'A' && srcA.winner === null));
         
      const isSrcBDead = srcB && srcB.status === 'finished' && 
        ((srcB.nextMatchLoserId === m.id && srcB.nextLoserSlot === 'B' && srcB.loser === null) || 
         (srcB.nextMatchWinnerId === m.id && srcB.nextWinnerSlot === 'B' && srcB.winner === null));

      if (isSrcADead && isSrcBDead) {
        m.winner = null;
        m.loser = null;
        m.status = 'finished';
        advanceTeam(map, m);
        changed = true;
      }
      continue;
    }

    if (hasA && !hasB) {
      // Cek apakah slot B tidak akan pernah terisi
      const src = findSlotSource(map, m.id, 'B');
      if (src && src.status === 'finished') {
        const isByeLoser  = src.nextMatchLoserId  === m.id && src.nextLoserSlot  === 'B' && src.loser  === null;
        const isByeWinner = src.nextMatchWinnerId === m.id && src.nextWinnerSlot === 'B' && src.winner === null;
        if (isByeLoser || isByeWinner) {
          m.winner = m.teamA!;
          m.loser  = null;
          m.status = 'finished';
          advanceTeam(map, m);
          changed = true;
        }
      }
    }

    if (!hasA && hasB) {
      const src = findSlotSource(map, m.id, 'A');
      if (src && src.status === 'finished') {
        const isByeLoser  = src.nextMatchLoserId  === m.id && src.nextLoserSlot  === 'A' && src.loser  === null;
        const isByeWinner = src.nextMatchWinnerId === m.id && src.nextWinnerSlot === 'A' && src.winner === null;
        if (isByeLoser || isByeWinner) {
          m.winner = m.teamB!;
          m.loser  = null;
          m.status = 'finished';
          advanceTeam(map, m);
          changed = true;
        }
      }
    }
  }

  return changed;
}

// ── groupMatchesByRound ────────────────────────────────────────────────────

export function groupMatchesByRound(
  matches: Match[],
  bracket: 'upper' | 'lower' | 'grand_final',
): Match[][] {
  const filtered = matches.filter(m => m.bracket === bracket);
  const maxRound = Math.max(...filtered.map(m => m.round), 0);
  const rounds: Match[][] = [];
  for (let r = 1; r <= maxRound; r++) {
    const round = filtered
      .filter(m => m.round === r)
      .sort((a, b) => a.position - b.position);
    if (round.length > 0) rounds.push(round);
  }
  return rounds;
}

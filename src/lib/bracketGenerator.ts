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

  const bracketSize = nextPowerOf2(n);
  const numByes = bracketSize - n;
  
  // Distribute BYEs evenly so there are no "null vs null" matches
  const padded: (Team | null)[] = [];
  let teamIdx = 0;
  const numMatchesRound1 = bracketSize / 2;
  
  for (let i = 0; i < numMatchesRound1; i++) {
    // Slot A gets a real team
    padded.push(teams[teamIdx++]);
    
    // Slot B gets a BYE if we still have BYEs to distribute, otherwise a real team
    if (i < numByes) {
      padded.push(null);
    } else {
      padded.push(teams[teamIdx++]);
    }
  }

  const matches: Match[] = [];
  let lbRound = 1;

  // ── Upper Bracket Round 1 ──────────────────────────────────────────────

  const ur1: Match[] = [];
  for (let i = 0; i < bracketSize; i += 2) {
    const tA = padded[i];
    const tB = padded[i + 1] ?? null;
    const pos = i / 2 + 1;
    const m = makeMatch(`U1-${pos}`, 1, pos, 'upper', tA, tB);

    // Bye: auto-selesaikan jika salah satu tim null
    if (tA && !tB) { m.winner = tA; m.loser = null; m.status = 'finished'; }
    else if (!tA && tB) { m.winner = tB; m.loser = null; m.status = 'finished'; }

    matches.push(m);
    ur1.push(m);
  }

  // ── Upper Bracket ronde berikutnya ────────────────────────────────────

  const upperRounds: Match[][] = [ur1];
  let prevUR   = ur1;
  let ubRoundN = 2;

  while (prevUR.length > 1) {
    const round: Match[] = [];
    for (let i = 0; i < prevUR.length; i += 2) {
      const pos = i / 2 + 1;
      const m = makeMatch(`U${ubRoundN}-${pos}`, ubRoundN, pos, 'upper', null, null);
      matches.push(m);
      round.push(m);

      prevUR[i].nextMatchWinnerId = m.id;
      prevUR[i].nextWinnerSlot   = 'A';
      if (i + 1 < prevUR.length) {
        prevUR[i + 1].nextMatchWinnerId = m.id;
        prevUR[i + 1].nextWinnerSlot   = 'B';
      }
    }
    upperRounds.push(round);
    prevUR = round;
    ubRoundN++;
  }

  const upperFinal = prevUR[0];

  // ── Lower Bracket ──────────────────────────────────────────────────────
  // LR1 (Consolidation): losers dari UR1 main sesama

  const lr1: Match[] = [];
  for (let i = 0; i < ur1.length; i += 2) {
    const pos = i / 2 + 1;
    const m = makeMatch(`L${lbRound}-${pos}`, lbRound, pos, 'lower', null, null);
    matches.push(m);
    lr1.push(m);

    ur1[i].nextMatchLoserId = m.id;
    ur1[i].nextLoserSlot   = 'A';
    if (i + 1 < ur1.length) {
      ur1[i + 1].nextMatchLoserId = m.id;
      ur1[i + 1].nextLoserSlot   = 'B';
    }
  }
  lbRound++;
  let prevLB = lr1;

  // Alternating Infusion + Consolidation untuk sisa ronde Upper
  for (let ubIdx = 1; ubIdx < upperRounds.length; ubIdx++) {
    const ubRound = upperRounds[ubIdx];

    // ── Infusion: UR losers bergabung dengan LB survivors ──
    const infusion: Match[] = [];
    for (let i = 0; i < prevLB.length; i++) {
      const m = makeMatch(`L${lbRound}-${i + 1}`, lbRound, i + 1, 'lower', null, null);
      matches.push(m);
      infusion.push(m);

      // LB survivor → slot A
      prevLB[i].nextMatchWinnerId = m.id;
      prevLB[i].nextWinnerSlot   = 'A';

      // UR loser → slot B
      if (i < ubRound.length) {
        ubRound[i].nextMatchLoserId = m.id;
        ubRound[i].nextLoserSlot   = 'B';
      }
    }
    lbRound++;
    prevLB = infusion;

    // ── Consolidation: LB survivors main sesama
    //    (hanya jika masih ada ronde UB lagi setelah ini)
    if (ubIdx < upperRounds.length - 1 && prevLB.length > 1) {
      const consol: Match[] = [];
      for (let i = 0; i < prevLB.length; i += 2) {
        const pos = i / 2 + 1;
        const m = makeMatch(`L${lbRound}-${pos}`, lbRound, pos, 'lower', null, null);
        matches.push(m);
        consol.push(m);

        prevLB[i].nextMatchWinnerId = m.id;
        prevLB[i].nextWinnerSlot   = 'A';
        if (i + 1 < prevLB.length) {
          prevLB[i + 1].nextMatchWinnerId = m.id;
          prevLB[i + 1].nextWinnerSlot   = 'B';
        }
      }
      lbRound++;
      prevLB = consol;
    }
  }

  const lowerFinal = prevLB[0];

  // ── Grand Final ────────────────────────────────────────────────────────

  const gf = makeMatch('GF', 1, 1, 'grand_final', null, null);
  matches.push(gf);

  upperFinal.nextMatchWinnerId = gf.id;
  upperFinal.nextWinnerSlot   = 'A';
  lowerFinal.nextMatchWinnerId = gf.id;
  lowerFinal.nextWinnerSlot   = 'B';

  // Apply auto-advance awal (untuk bye matches)
  applyInitialAutoAdvance(matches);

  return matches;
}

// ══════════════════════════════════════════════════════════════════════════
// AUTO-ADVANCE HELPERS
// ══════════════════════════════════════════════════════════════════════════

/** Auto-advance awal saat bracket di-generate (hanya untuk bye matches) */
function applyInitialAutoAdvance(matches: Match[]): void {
  const map = new Map(matches.map(m => [m.id, m]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const m of Array.from(map.values())) {
      if (m.status === 'finished' && m.winner) {
        advanceTeam(map, m);
        changed = true;
      }
    }
    // Stop setelah satu pass penuh jika tidak ada perubahan baru
    changed = false;
    for (const m of Array.from(map.values())) {
      if (m.status === 'finished' && m.winner && m.nextMatchWinnerId) {
        const next = map.get(m.nextMatchWinnerId);
        if (next) {
          const slot = m.nextWinnerSlot;
          if ((slot === 'A' && next.teamA === null) || (slot === 'B' && next.teamB === null)) {
            advanceTeam(map, m);
            changed = true;
          }
        }
      }
    }
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
    if (!hasA && !hasB) continue; // Kedua slot kosong – belum waktunya

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

// ============================================================
// leagueScheduler.ts – Generator Jadwal Liga Round-Robin
// Algoritma: Circle Method (rotasi lingkaran) + Anti-Fatigue Sort
// ============================================================
//
// CARA KERJA:
// 1. Untuk N tim (genap): ada N-1 ronde, tiap ronde N/2 pertandingan.
//    Satu tim "dipaku" di posisi 0, sisanya dirotasi setiap ronde.
//    Hasilnya: setiap tim bertemu semua tim lain tepat 1x.
//
// 2. Untuk N tim (ganjil): tambahkan 1 tim "BYE" sehingga menjadi
//    N+1 (genap), lalu jalankan algoritma genap. Tim yang bertemu
//    BYE mendapat istirahat (pertandingan itu dibuang).
//
// 3. Anti-Fatigue Sort: Dalam setiap ronde, urutkan ulang pertandingan
//    sehingga tidak ada tim yang main dua kali berturut-turut
//    antar ronde sebelumnya dan ronde sekarang.
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import type { Team, LeagueMatch } from '@/types/league';

// ── Tipe internal untuk rotasi ────────────────────────────────────────────

const BYE_ID = '__BYE__';

// ── Fungsi utama: hasilkan jadwal penuh ───────────────────────────────────

/**
 * Menghasilkan jadwal liga round-robin lengkap.
 * Setiap tim bertanding melawan semua tim lain tepat satu kali.
 * Jadwal dirotasi untuk meminimalkan kelelahan berturut-turut.
 *
 * @param teams - Array tim yang akan berkompetisi (min 3 tim)
 * @returns Array LeagueMatch yang sudah diurutkan per ronde
 */
export function generateLeagueSchedule(teams: Team[]): LeagueMatch[] {
  if (teams.length < 2) {
    throw new Error('Minimal 2 tim diperlukan untuk membuat jadwal liga.');
  }

  // Jika ganjil, tambahkan slot BYE agar algoritma circle bisa berjalan
  const isOdd = teams.length % 2 !== 0;
  const slots: string[] = teams.map((t) => t.id);
  if (isOdd) slots.push(BYE_ID);

  const n = slots.length; // Selalu genap setelah normalisasi
  const numRounds = n - 1;
  const matchesPerRound = n / 2;

  // Buat map id → Team untuk lookup cepat
  const teamMap = new Map<string, Team>(teams.map((t) => [t.id, t]));

  const allMatches: LeagueMatch[] = [];
  let matchCounter = 1;

  // Jalankan circle rotation untuk setiap ronde
  for (let round = 1; round <= numRounds; round++) {
    const roundMatches: LeagueMatch[] = [];

    for (let i = 0; i < matchesPerRound; i++) {
      const idA = slots[i];
      const idB = slots[n - 1 - i];

      // Lewati pertandingan yang melibatkan BYE
      if (idA === BYE_ID || idB === BYE_ID) continue;

      const teamA = teamMap.get(idA)!;
      const teamB = teamMap.get(idB)!;

      roundMatches.push({
        id: `M${String(matchCounter).padStart(2, '0')}`,
        round,
        position: roundMatches.length + 1,
        teamA,
        teamB,
        scoreA: 0,
        scoreB: 0,
        winner: null,
        status: 'pending',
      });

      matchCounter++;
    }

    // Rotasi slots: elemen ke-1 sampai ke-n pindah 1 posisi ke kanan.
    // Elemen ke-0 (fixed pin) tidak berubah.
    const fixed = slots[0];
    const rest = slots.slice(1);
    rest.unshift(rest.pop()!);
    slots[0] = fixed;
    for (let i = 0; i < rest.length; i++) slots[i + 1] = rest[i];

    allMatches.push(...roundMatches);
  }

  // Terapkan anti-fatigue sort untuk meminimalkan tim bermain berturut-turut
  return applyAntiFatigueSort(allMatches, numRounds);
}

// ── Anti-Fatigue Sort ─────────────────────────────────────────────────────

/**
 * Mengurutkan ulang pertandingan DALAM setiap ronde agar tidak ada tim
 * yang bermain dua kali berturut-turut (di akhir ronde N dan awal ronde N+1).
 *
 * Strategi: Untuk setiap ronde, coba tempatkan pertandingan yang tim-timnya
 * paling lama tidak bermain lebih awal dalam urutan.
 */
function applyAntiFatigueSort(
  matches: LeagueMatch[],
  numRounds: number,
): LeagueMatch[] {
  // Kelompokkan pertandingan per ronde
  const rounds: LeagueMatch[][] = [];
  for (let r = 1; r <= numRounds; r++) {
    rounds.push(matches.filter((m) => m.round === r));
  }

  // Lacak pertandingan terakhir setiap tim (indeks global)
  const lastPlayedAt = new Map<string, number>();
  let globalIndex = 0;

  const result: LeagueMatch[] = [];

  for (let ri = 0; ri < rounds.length; ri++) {
    const roundMatches = [...rounds[ri]];
    const sortedRound: LeagueMatch[] = [];

    // Greedy: pilih pertandingan yang kedua timnya paling lama tidak bermain
    const remaining = [...roundMatches];

    while (remaining.length > 0) {
      let bestScore = -Infinity;
      let bestIdx = 0;

      for (let i = 0; i < remaining.length; i++) {
        const m = remaining[i];
        const lastA = lastPlayedAt.get(m.teamA.id) ?? -Infinity;
        const lastB = lastPlayedAt.get(m.teamB.id) ?? -Infinity;
        // Score = seberapa lama kedua tim ini menganggur (lebih lama = lebih baik)
        const score = (globalIndex - lastA) + (globalIndex - lastB);

        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      const chosen = remaining.splice(bestIdx, 1)[0];
      lastPlayedAt.set(chosen.teamA.id, globalIndex);
      lastPlayedAt.set(chosen.teamB.id, globalIndex);
      globalIndex++;

      // Perbarui posisi dalam ronde setelah diurutkan ulang
      sortedRound.push({ ...chosen, position: sortedRound.length + 1 });
    }

    result.push(...sortedRound);
  }

  return result;
}

// ── Utilitas ──────────────────────────────────────────────────────────────

/**
 * Menghitung total ronde dalam liga untuk N tim.
 * Untuk N tim (genap) = N-1 ronde.
 * Untuk N tim (ganjil) = N ronde (karena ada 1 bye per ronde).
 */
export function getTotalRounds(numTeams: number): number {
  return numTeams % 2 === 0 ? numTeams - 1 : numTeams;
}

/**
 * Menghitung total pertandingan dalam liga untuk N tim.
 * Rumus: N*(N-1)/2
 */
export function getTotalMatches(numTeams: number): number {
  return (numTeams * (numTeams - 1)) / 2;
}

// ============================================================
// scoringLogic.ts – Aturan skor BWF (1 Set)
// ============================================================

/**
 * Memeriksa apakah ada pemenang berdasarkan skor saat ini.
 *
 * Aturan BWF 1 Set:
 * 1. NORMAL WIN : Tim pertama yang mencapai 21 poin DAN unggul ≥ 2 angka menang.
 * 2. DEUCE (JUS): Jika skor 20-20, permainan dilanjutkan sampai salah satu tim
 *                 unggul tepat 2 angka (misal 22-20, 23-21, dst.).
 * 3. SUDDEN DEATH: Jika skor mencapai 29-29, tim pertama yang mencetak poin
 *                  ke-30 (skor 30-29) adalah pemenang — tidak ada deuce lagi.
 *
 * @param scoreA - Skor tim A
 * @param scoreB - Skor tim B
 * @returns 'A' jika tim A menang, 'B' jika tim B menang, null jika belum ada pemenang
 */
export function checkWinner(scoreA: number, scoreB: number): 'A' | 'B' | null {
  // ── Aturan Sudden Death (Batas Maksimal 30 poin) ──────────────────────────
  // Jika salah satu tim mencapai 30, ia langsung menang (30-29)
  if (scoreA >= 30) return 'A';
  if (scoreB >= 30) return 'B';

  // ── Aturan Normal Win & Deuce ─────────────────────────────────────────────
  // Tim menang jika: skor ≥ 21 DAN selisih ≥ 2 angka
  // Ini mencakup semua kasus:
  //   - Normal win  : 21-0 s/d 21-19
  //   - Deuce win   : 22-20, 23-21, 24-22, ..., 29-27
  if (scoreA >= 21 && scoreA - scoreB >= 2) return 'A';
  if (scoreB >= 21 && scoreB - scoreA >= 2) return 'B';

  // Belum ada pemenang
  return null;
}

/**
 * Memeriksa apakah permainan sedang dalam kondisi Deuce/Jus.
 * Kondisi deuce terjadi ketika kedua tim sudah mencapai skor 20 atau lebih,
 * dan selisih skor ≤ 1 (belum ada yang unggul 2 angka).
 */
export function isDeuce(scoreA: number, scoreB: number): boolean {
  return scoreA >= 20 && scoreB >= 20 && Math.abs(scoreA - scoreB) <= 1 && scoreA < 30 && scoreB < 30;
}

/**
 * Memeriksa apakah permainan sedang dalam kondisi Sudden Death (skor 29-29).
 */
export function isSuddenDeath(scoreA: number, scoreB: number): boolean {
  return scoreA === 29 && scoreB === 29;
}

/**
 * Mengembalikan status teks yang informatif untuk ditampilkan di papan skor.
 */
export function getMatchStatusText(scoreA: number, scoreB: number): string {
  if (isSuddenDeath(scoreA, scoreB)) return '⚡ SUDDEN DEATH! Satu poin menentukan!';
  if (isDeuce(scoreA, scoreB)) return '🔥 DEUCE! Butuh selisih 2 poin!';
  const winner = checkWinner(scoreA, scoreB);
  if (winner === 'A') return '🏆 Tim A Menang!';
  if (winner === 'B') return '🏆 Tim B Menang!';
  return '';
}

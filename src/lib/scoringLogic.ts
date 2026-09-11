// ============================================================
// scoringLogic.ts – Aturan Skor Liga (Batas 30 Poin)
// ============================================================

/**
 * Memeriksa apakah ada pemenang berdasarkan skor saat ini.
 *
 * Aturan Liga (1 Set, Target 30 Poin):
 * - Tim pertama yang MENCAPAI 30 poin adalah pemenang.
 * - Tidak ada deuce atau aturan selisih — murni balapan ke-30.
 *
 * @param scoreA - Skor tim A
 * @param scoreB - Skor tim B
 * @returns 'A' jika tim A menang, 'B' jika tim B menang, null jika belum ada pemenang
 */
export function checkWinner(scoreA: number, scoreB: number): 'A' | 'B' | null {
  if (scoreA >= 30) return 'A';
  if (scoreB >= 30) return 'B';
  return null;
}

/**
 * Mengembalikan status teks yang informatif untuk ditampilkan di papan skor.
 */
export function getMatchStatusText(scoreA: number, scoreB: number): string {
  if (scoreA === 29 || scoreB === 29) {
    return '⚡ MATCH POINT! Satu poin lagi menentukan!';
  }
  const winner = checkWinner(scoreA, scoreB);
  if (winner === 'A') return '🏆 Tim A Menang!';
  if (winner === 'B') return '🏆 Tim B Menang!';
  return '';
}

/**
 * Apakah salah satu tim sedang dalam kondisi "match point" (skor 29)?
 */
export function isMatchPoint(scoreA: number, scoreB: number): boolean {
  return (scoreA === 29 || scoreB === 29) && checkWinner(scoreA, scoreB) === null;
}

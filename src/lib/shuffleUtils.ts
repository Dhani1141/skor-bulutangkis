// ============================================================
// shuffleUtils.ts – Algoritma acak Fisher-Yates
// ============================================================

/**
 * Mengacak array secara in-place menggunakan algoritma Fisher-Yates.
 * Algoritma ini memastikan setiap permutasi memiliki probabilitas
 * yang sama (perfectly unbiased shuffle).
 *
 * @param array - Array yang akan diacak (dimodifikasi in-place)
 * @returns Array yang sudah diacak (referensi yang sama)
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array]; // buat salinan agar tidak memodifikasi aslinya
  for (let i = arr.length - 1; i > 0; i--) {
    // Pilih indeks acak dari 0 hingga i (inklusif)
    const j = Math.floor(Math.random() * (i + 1));
    // Tukar elemen di posisi i dan j
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Memecah array menjadi kelompok-kelompok berukuran `size`.
 * Contoh: chunkArray([1,2,3,4,5,6], 2) → [[1,2],[3,4],[5,6]]
 *
 * @param array - Array sumber
 * @param size  - Ukuran setiap kelompok
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ============================================================
// hallOfFame.ts – Firestore Service untuk Hall of Fame
// Collection: 'hall_of_fame'
// Document ID: nama pemain (lowercase, trimmed)
// ============================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  query,
  orderBy,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Player, HallOfFameEntry } from '@/types/league';

const COLLECTION = 'hall_of_fame';

/**
 * Menghasilkan Document ID yang konsisten dari nama pemain.
 * Lowercase + trim agar "Kunyuk" dan "kunyuk" dianggap sama.
 */
function toDocId(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_');
}

// ── saveChampions ──────────────────────────────────────────────────────────

/**
 * Simpan atau perbarui data juara di Firestore.
 * - Jika pemain sudah ada → increment `championships_won`
 * - Jika belum ada → buat dokumen baru dengan `championships_won: 1`
 *
 * @param players - Array 2 pemain dari tim juara
 */
export async function saveChampions(players: Player[]): Promise<void> {
  const now = new Date().toISOString();

  const promises = players.map(async (player) => {
    const docId = toDocId(player.name);
    const docRef = doc(db, COLLECTION, docId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      // Pemain sudah ada → increment championship dan perbarui timestamp
      await updateDoc(docRef, {
        championships_won: increment(1),
        last_won_at: now,
      });
    } else {
      // Pemain baru → buat dokumen baru
      await setDoc(docRef, {
        name: player.name.trim(),
        championships_won: 1,
        last_won_at: now,
      } satisfies HallOfFameEntry);
    }
  });

  await Promise.all(promises);
}

// ── getLeaderboard ─────────────────────────────────────────────────────────

/**
 * Ambil seluruh data Hall of Fame dari Firestore,
 * diurutkan berdasarkan `championships_won` descending.
 *
 * @returns Array HallOfFameEntry yang sudah diurutkan
 */
export async function getLeaderboard(): Promise<HallOfFameEntry[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy('championships_won', 'desc'),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      name: data.name as string,
      championships_won: data.championships_won as number,
      last_won_at: data.last_won_at as string,
    } satisfies HallOfFameEntry;
  });
}

// ── deleteFromHallOfFame ───────────────────────────────────────────────────

/**
 * Hapus pemain dari Hall of Fame secara permanen.
 * 
 * @param playerName - Nama pemain yang akan dihapus
 */
export async function deleteFromHallOfFame(playerName: string): Promise<void> {
  const docId = toDocId(playerName);
  const docRef = doc(db, COLLECTION, docId);
  await deleteDoc(docRef);
}

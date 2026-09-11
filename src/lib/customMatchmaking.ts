import { Player } from '@/types/league';

// Definisi Konstanta
const SEEDS = ['tio', 'bagas', 'rafi', 'diccy'];
const VIP_ALIASES = ['dhani', 'dani', 'kunyuk'];

// Bobot VIP Matchmaking
const VIP_WEIGHTS: Record<string, number> = {
  tio: 35,
  bagas: 32,
  rafi: 33,
  diccy: 31,
};

/**
 * Mengacak array secara in-place menggunakan Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Menghasilkan tim berdasarkan aturan Custom Matchmaking:
 * 1. Seed (Unggulan) dipisah ke tim berbeda.
 * 2. VIP (dhani/dani/kunyuk) mendapat pasangan Seed dengan sistem bobot.
 * 3. Sisanya diacak.
 */
export function generateCustomTeams(players: Player[]): Player[][] {
  const pairs: Player[][] = [];
  const pool = [...players];

  // 1. Identifikasi & Ekstrak Seed dan VIP
  const presentSeeds = pool.filter((p) => SEEDS.includes(p.name.toLowerCase()));
  const presentVipIndex = pool.findIndex((p) => VIP_ALIASES.includes(p.name.toLowerCase()));
  
  let vipPlayer: Player | null = null;
  if (presentVipIndex !== -1) {
    vipPlayer = pool.splice(presentVipIndex, 1)[0];
  }

  // Keluarkan seeds dari pool
  presentSeeds.forEach((seed) => {
    const idx = pool.findIndex((p) => p.id === seed.id);
    if (idx !== -1) pool.splice(idx, 1);
  });

  // Siapkan "ember" tim sebanyak jumlah pasangan (total pemain / 2)
  const totalTeams = Math.floor(players.length / 2);
  const teams: Player[][] = Array.from({ length: totalTeams }, () => []);

  // 2. Tempatkan Seed di tim yang berbeda-beda
  for (let i = 0; i < presentSeeds.length; i++) {
    teams[i % totalTeams].push(presentSeeds[i]);
  }

  // 3. Pasangkan VIP dengan Seed (menggunakan Weighted Random)
  if (vipPlayer) {
    // Ambil nama-nama seed yang BENAR-BENAR ada dan BELUM memiliki 2 anggota
    // Secara logika, seed saat ini baru punya 1 anggota (dirinya sendiri)
    const availableSeedTeams = teams.filter(
      (t) => t.length === 1 && SEEDS.includes(t[0].name.toLowerCase())
    );

    if (availableSeedTeams.length > 0) {
      // Hitung total bobot dari seed yang tersedia
      let totalWeight = 0;
      const weightMap: { team: Player[]; weight: number }[] = [];

      for (const team of availableSeedTeams) {
        const seedName = team[0].name.toLowerCase();
        const w = VIP_WEIGHTS[seedName] || 0;
        totalWeight += w;
        weightMap.push({ team, weight: w });
      }

      // Random 1 hingga totalWeight
      let randomVal = Math.floor(Math.random() * totalWeight) + 1;
      let selectedTeam: Player[] | null = null;

      for (const item of weightMap) {
        randomVal -= item.weight;
        if (randomVal <= 0) {
          selectedTeam = item.team;
          break;
        }
      }

      // Jika karena suatu hal gagal, fallback ke tim pertama
      if (!selectedTeam) selectedTeam = availableSeedTeams[0];

      selectedTeam.push(vipPlayer);
    } else {
      // Jika tidak ada seed sama sekali, jadikan VIP anggota pertama di tim yang kosong
      const emptyTeam = teams.find((t) => t.length === 0);
      if (emptyTeam) emptyTeam.push(vipPlayer);
      else pool.push(vipPlayer); // fallback ekstrim
    }
  }

  // 4. Acak sisa pemain (filler) dan masukkan ke slot tim yang masih kosong
  const shuffledFillers = shuffleArray(pool);
  
  for (const filler of shuffledFillers) {
    // Cari tim yang anggotanya kurang dari 2
    const targetTeam = teams.find((t) => t.length < 2);
    if (targetTeam) {
      targetTeam.push(filler);
    }
  }

  // 5. Kembalikan array pasangan (di-shuffle agar urutan tim tidak selalu sama)
  return shuffleArray(teams);
}

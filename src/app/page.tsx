'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/store/tournamentStore';

/**
 * Root page – redirect ke halaman yang sesuai berdasarkan fase turnamen.
 * - 'input'    → /input
 * - 'bracket'  → /bracket
 * - 'finished' → /bracket
 */
export default function RootPage() {
  const router = useRouter();
  const phase = useTournamentStore((s) => s.phase);

  useEffect(() => {
    if (phase === 'bracket' || phase === 'finished') {
      router.replace('/bracket');
    } else {
      router.replace('/input');
    }
  }, [phase, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

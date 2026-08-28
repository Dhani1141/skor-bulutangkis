'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Player } from '@/types/tournament';

interface SpinWheelProps {
  players: Player[];
  targetPlayerId: string | null; // Set to non-null to start spinning
  onFinish: () => void;
}

export default function SpinWheel({ players, targetPlayerId, onFinish }: SpinWheelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const DUPLICATIONS = 20;
  const ITEM_HEIGHT = 64; // px (h-16)

  useEffect(() => {
    if (targetPlayerId && players.length > 0) {
      const targetIndex = players.findIndex(p => p.id === targetPlayerId);
      if (targetIndex === -1) {
        return;
      }
      
      const targetAbsoluteIndex = (players.length * (DUPLICATIONS - 3)) + targetIndex;
      const targetScroll = targetAbsoluteIndex * ITEM_HEIGHT;
      
      if (containerRef.current) {
        // Reset to top immediately without animation
        containerRef.current.style.transition = 'none';
        containerRef.current.style.transform = `translateY(0px)`;
        
        // Force reflow
        void containerRef.current.offsetHeight;
        
        // Spin!
        containerRef.current.style.transition = 'transform 3.5s cubic-bezier(0.1, 0.7, 0.1, 1)';
        containerRef.current.style.transform = `translateY(-${targetScroll}px)`;
        
        setTimeout(() => {
          onFinish();
        }, 3600); // slightly longer than 3.5s to allow settle
      }
    }
  }, [targetPlayerId, players]); // eslint-disable-line react-hooks/exhaustive-deps

  // If players list is empty, just show empty state
  if (players.length === 0) {
    return (
      <div className="relative w-full h-[192px] overflow-hidden rounded-2xl flex items-center justify-center" 
           style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)' }}>
        <span style={{ color: '#444' }}>Tidak ada pemain</span>
      </div>
    );
  }

  const displayList = Array(DUPLICATIONS).fill(players).flat();

  return (
    <div className="relative w-full h-[192px] overflow-hidden rounded-2xl" 
         style={{ border: '1px solid rgba(0,212,255,0.3)', background: 'rgba(13,13,13,0.9)' }}>
      
      {/* Target highlight box (Center) */}
      <div className="absolute inset-x-0 top-[64px] h-[64px] z-10 pointer-events-none"
           style={{ 
             background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent)',
             borderTop: '1px solid rgba(0,212,255,0.5)',
             borderBottom: '1px solid rgba(0,212,255,0.5)',
             boxShadow: '0 0 20px rgba(0,212,255,0.2)'
           }} 
      />

      {/* Shadow overlays for depth */}
      <div className="absolute inset-x-0 top-0 h-[64px] z-10 pointer-events-none"
           style={{ background: 'linear-gradient(to bottom, rgba(13,13,13,1), transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-[64px] z-10 pointer-events-none"
           style={{ background: 'linear-gradient(to top, rgba(13,13,13,1), transparent)' }} />
      
      {/* Scrollable list */}
      <div 
        ref={containerRef}
        className="absolute inset-x-0 top-[64px] w-full" 
      >
        {displayList.map((p, i) => (
           <div key={`${p.id}-${i}`} className="h-[64px] flex items-center justify-center text-3xl font-black text-white uppercase tracking-wider" 
                style={{ textShadow: '0 0 15px rgba(255,255,255,0.3)' }}>
             {p.name}
           </div>
        ))}
      </div>
    </div>
  );
}

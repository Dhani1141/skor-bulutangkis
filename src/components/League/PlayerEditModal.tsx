'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useLeagueStore } from '@/store/leagueStore';

interface PlayerEditModalProps {
  playerId: string;
  currentName: string;
  onClose: () => void;
}

/**
 * Modal inline untuk mengedit nama pemain.
 * Perubahan langsung dipropagasi ke seluruh state (matches, teams, standings).
 */
export default function PlayerEditModal({
  playerId,
  currentName,
  onClose,
}: PlayerEditModalProps) {
  const updatePlayer = useLeagueStore((s) => s.updatePlayer);
  const [value, setValue] = useState(currentName);
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Nama tidak boleh kosong');
      return;
    }
    if (trimmed.length > 30) {
      setError('Nama maksimal 30 karakter');
      return;
    }
    updatePlayer(playerId, trimmed);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: '#1a1f26',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h3 className="text-sm font-bold text-white tracking-wide">Edit Nama Pemain</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white transition"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">
              Nama Baru
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              autoFocus
              maxLength={30}
              placeholder={currentName}
              className="w-full bg-[#111418] border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF]/50 transition"
              style={{
                borderColor: error ? '#FF3131' : 'rgba(255,255,255,0.1)',
              }}
            />
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
          </div>

          <div
            className="rounded-lg px-3 py-2 text-[11px]"
            style={{ background: 'rgba(0,212,255,0.06)', color: '#888' }}
          >
            💡 Perubahan nama akan langsung diperbarui di seluruh jadwal, skor yang sedang
            berlangsung, dan klasemen — tanpa mereset data pertandingan.
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-5 pb-5"
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-400 transition hover:text-white"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition hover:opacity-90"
            style={{
              background: 'rgba(0,212,255,0.15)',
              border: '1px solid rgba(0,212,255,0.4)',
              color: '#00D4FF',
            }}
          >
            <Check className="w-4 h-4" />
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

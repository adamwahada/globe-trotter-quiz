import { useCallback } from 'react';
import { getFirebaseIdToken } from '@/utils/firebaseToken';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dzzeaesctendsggfdxra.supabase.co';
const BANS_FN = `${SUPABASE_URL}/functions/v1/admin-bans`;

export interface BanInfo {
  id: string;
  ban_type: '1day' | '3days' | '7days' | 'permanent';
  expires_at: string | null;
  reason: string | null;
  banned_at: string;
}

export function formatBanMessage(ban: BanInfo): string {
  if (ban.ban_type === 'permanent') {
    return 'You have been permanently banned from this platform.';
  }
  if (ban.expires_at) {
    const expires = new Date(ban.expires_at);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / 3600000);
    const diffDays = Math.ceil(diffMs / 86400000);
    const dateStr = expires.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (diffDays > 1) {
      return `You are banned for ${diffDays} more day${diffDays !== 1 ? 's' : ''}. You can play again on ${dateStr}.`;
    }
    return `You are banned for ${diffHours} more hour${diffHours !== 1 ? 's' : ''}. You can play again at ${expires.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
  }
  return 'You are currently banned from this platform.';
}

export async function checkUserBan(userId: string): Promise<BanInfo | null> {
  try {
    const res = await fetch(`${BANS_FN}?action=check-ban&user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.ban || null;
  } catch {
    return null;
  }
}

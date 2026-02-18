import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, Gamepad2 } from 'lucide-react';
import { getFirebaseIdToken } from '@/utils/firebaseToken';

interface UserStats {
  totalUsers: number;
  usersLast7Days: number;
  usersLastDay: number;
  totalGames: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getFirebaseIdToken();
        if (!token) return;

        const res = await fetch(`https://dzzeaesctendsggfdxra.supabase.co/functions/v1/admin-dashboard?action=user-stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          setStats(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-primary' },
    { label: 'Active (7 days)', value: stats?.usersLast7Days ?? 0, icon: Calendar, color: 'text-success' },
    { label: 'Active (24h)', value: stats?.usersLastDay ?? 0, icon: Clock, color: 'text-info' },
    { label: 'Total Games', value: stats?.totalGames ?? 0, icon: Gamepad2, color: 'text-warning' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-display text-foreground mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8">Overview of World Quiz activity</p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-4" />
              <div className="h-8 bg-muted rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <div key={card.label} className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className={`text-3xl font-display ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

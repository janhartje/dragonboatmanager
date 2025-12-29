'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, Tent, Calendar, Ship, Home, Mail, TrendingUp } from 'lucide-react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import PageTransition from '@/components/ui/PageTransition';
import DragonLogo from '@/components/ui/DragonLogo';
import Link from 'next/link';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { Monitor, Send } from 'lucide-react'; // Add missing icons

interface DashboardStats {
  counts: {
    users: number;
    teams: number;
    events: number;
    paddlers: number;
    openInvites: number;
    activeSessions: number;
    sentEmails: number;
    pendingEmails: number;
    failedEmails: number;
  };
  recent: {
    teams: { id: string; name: string; createdAt: string }[];
    events: { id: string; title: string; team: { name: string } | null; createdAt: string }[];
    users: { id: string; name: string | null; email: string | null; createdAt: string }[];
  };
  history: {
    teams: {
        days: { date: string; count: number }[];
        months: { date: string; count: number }[];
    };
    users: {
        days: { date: string; count: number }[];
        months: { date: string; count: number }[];
    };
  };
}

export default function AdminDashboard() {
  const { status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Independent resolution states
  const [teamResolution, setTeamResolution] = useState<'days' | 'months'>('days');
  const [userResolution, setUserResolution] = useState<'days' | 'months'>('days');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // No query param needed anymore, API returns all data
        const res = await fetch('/api/admin/stats');
        if (!res.ok) {
          if (res.status === 403 || res.status === 401) {
              router.push('/app');
              return;
          }
          throw new Error('Failed to fetch stats');
        }
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError('Error loading dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 p-2 md:p-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <Header 
            title="Admin Dashboard"
            logo={
                <Link href="/app" className="cursor-pointer hover:opacity-80 transition-opacity">
                  <DragonLogo className="w-10 h-10" />
                </Link>
            }
            leftAction={
                <button 
                  onClick={() => router.push('/app')} 
                  className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
                  aria-label="Back to App"
                >
                  <Home size={20} />
                </button>
            }
          />
          
          {(loading || status === 'loading') ? (
            <DashboardSkeleton />
          ) : (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard 
                  label="Total Users" 
                  value={stats?.counts.users} 
                  icon={<Users className="w-6 h-6 text-blue-500" />} 
                />
                <StatsCard 
                  label="Total Teams" 
                  value={stats?.counts.teams} 
                  icon={<Ship className="w-6 h-6 text-indigo-500" />} 
                />
                <StatsCard 
                  label="Total Events" 
                  value={stats?.counts.events} 
                  icon={<Calendar className="w-6 h-6 text-pink-500" />} 
                />
                <StatsCard 
                  label="Total Paddlers" 
                  value={stats?.counts.paddlers} 
                  icon={<Tent className="w-6 h-6 text-emerald-500" />} 
                />
                <StatsCard 
                  label="Open Invites" 
                  value={stats?.counts.openInvites} 
                  icon={<Mail className="w-6 h-6 text-amber-500" />} 
                />
                <StatsCard 
                  label="Active Sessions" 
                  value={stats?.counts.activeSessions} 
                  icon={<Monitor className="w-6 h-6 text-teal-500" />} 
                />
                <StatsCard 
                  label="Sent Emails" 
                  value={stats?.counts.sentEmails} 
                  icon={<Send className="w-6 h-6 text-purple-500" />} 
                />
                <StatsCard 
                  label="Queued Emails" 
                  value={stats?.counts.pendingEmails} 
                  icon={<Mail className="w-6 h-6 text-yellow-500" />} 
                />
                 {(stats?.counts.failedEmails ?? 0) > 0 && (
                    <StatsCard 
                    label="Failed Emails" 
                    value={stats?.counts.failedEmails} 
                    icon={<Mail className="w-6 h-6 text-red-500" />} 
                    />
                 )}
              </div>

              {/* Growth Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Team Growth */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Team Growth
                        </h2>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                        <button
                            onClick={() => setTeamResolution('days')}
                            className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${teamResolution === 'days' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            30D
                        </button>
                        <button
                            onClick={() => setTeamResolution('months')}
                            className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${teamResolution === 'months' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            6M
                        </button>
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.history.teams[teamResolution]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            if (teamResolution === 'months') {
                                return date.toLocaleDateString('default', { month: 'short' });
                            }
                            return date.toLocaleDateString('default', { day: '2-digit', month: '2-digit' });
                          }}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748B', fontSize: 12 }}
                          dy={10}
                          minTickGap={30}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748B', fontSize: 12 }}
                          allowDecimals={false}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          cursor={{ fill: 'transparent' }}
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* User Growth */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        User Growth
                        </h2>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                        <button
                            onClick={() => setUserResolution('days')}
                            className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${userResolution === 'days' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            30D
                        </button>
                        <button
                            onClick={() => setUserResolution('months')}
                            className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${userResolution === 'months' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            6M
                        </button>
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.history.users[userResolution]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis 
                          dataKey="date" 
                           tickFormatter={(value) => {
                            const date = new Date(value);
                             if (userResolution === 'months') {
                                return date.toLocaleDateString('default', { month: 'short' });
                            }
                            return date.toLocaleDateString('default', { day: '2-digit', month: '2-digit' });
                          }}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748B', fontSize: 12 }}
                          dy={10}
                          minTickGap={30}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748B', fontSize: 12 }}
                          allowDecimals={false}
                        />
                         <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          cursor={{ fill: 'transparent' }}
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Teams */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                    Recent Teams
                  </h2>
                  <div className="space-y-4">
                    {stats?.recent.teams.map((team) => (
                      <div key={team.id} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{team.name}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(team.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {stats?.recent.teams.length === 0 && (
                      <p className="text-sm text-slate-500">No teams found.</p>
                    )}
                  </div>
                </div>

                {/* Recent Events */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                    Recent Events
                  </h2>
                  <div className="space-y-4">
                    {stats?.recent.events.map((event) => (
                      <div key={event.id} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                            {event.title}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                            {event.team?.name || 'Unknown Team'}
                            </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(event.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {stats?.recent.events.length === 0 && (
                      <p className="text-sm text-slate-500">No events found.</p>
                    )}
                  </div>
                </div>

                 {/* Recent Users */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Users className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      Recent Users
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {stats?.recent.users.map((user) => (
                      <div key={user.id} className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {user.name || 'Unnamed User'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {user.email}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {stats?.recent.users.length === 0 && (
                      <p className="text-sm text-slate-500">No users found.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <Footer />
        </div>
      </div>
    </PageTransition>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 h-24"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[...Array(2)].map((_, i) => (
           <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 h-80"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[...Array(3)].map((_, i) => (
           <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 h-64"></div>
        ))}
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon }: { label: string, value: number | undefined, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
      <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {value !== undefined ? value.toLocaleString() : '-'}
        </p>
      </div>
    </div>
  );
}

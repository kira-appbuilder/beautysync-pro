import React, { useState, useEffect } from 'react';
import { Calendar, Users, DollarSign, Clock, TrendingUp, Star, Bell, Settings } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { checkEntitlements } from '../../lib/revenuecat';

function Dashboard({ language, setCurrentView, showPaywall }) {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    todayRevenue: 0,
    totalClients: 0,
    monthlyGrowth: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    checkProStatus();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (!auth.currentUser) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Today's appointments
      const appointmentsRef = collection(db, 'appointments');
      const todayAppointmentsQuery = query(
        appointmentsRef,
        where('userId', '==', auth.currentUser.uid),
        where('date', '>=', today),
        where('date', '<', tomorrow)
      );
      const todayAppointments = await getDocs(todayAppointmentsQuery);

      // Calculate today's revenue
      let todayRevenue = 0;
      todayAppointments.forEach(doc => {
        const data = doc.data();
        todayRevenue += data.price || 0;
      });

      // Total clients
      const clientsRef = collection(db, 'clients');
      const clientsQuery = query(
        clientsRef,
        where('userId', '==', auth.currentUser.uid)
      );
      const clients = await getDocs(clientsQuery);

      // Recent activity
      const recentQuery = query(
        appointmentsRef,
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recent = await getDocs(recentQuery);
      const recentData = recent.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setStats({
        todayAppointments: todayAppointments.size,
        todayRevenue,
        totalClients: clients.size,
        monthlyGrowth: 12.5 // Mock data for demo
      });
      setRecentActivity(recentData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkProStatus = async () => {
    const hasEntitlement = await checkEntitlements();
    setIsPro(hasEntitlement);
  };

  const handleProFeature = (feature) => {
    if (!isPro) {
      showPaywall();
      return;
    }
    setCurrentView(feature);
  };

  const text = {
    en: {
      title: 'Dashboard',
      subtitle: 'Beauty flows through data.',
      today: 'Today',
      appointments: 'Appointments',
      revenue: 'Revenue',
      clients: 'Total Clients',
      growth: 'Monthly Growth',
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      newAppointment: 'New Appointment',
      addClient: 'Add Client',
      analytics: 'Analytics',
      inventory: 'Inventory',
      noActivity: 'No recent activity',
      proFeature: 'Pro Feature'
    },
    ja: {
      title: 'ダッシュボード',
      subtitle: 'データに宿る美しさ。',
      today: '今日',
      appointments: '予約',
      revenue: '売上',
      clients: '総顧客数',
      growth: '月間成長率',
      recentActivity: '最近のアクティビティ',
      quickActions: 'クイックアクション',
      newAppointment: '新しい予約',
      addClient: '顧客追加',
      analytics: '分析',
      inventory: '在庫管理',
      noActivity: '最近のアクティビティはありません',
      proFeature: 'プロ機能'
    }
  };

  const t = text[language];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center">
        <div className="animate-pulse text-[rgba(245,240,250,0.45)]">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0f] relative overflow-hidden">
      {/* Background glow */}
      <div 
        className="absolute top-[-120px] left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(240, 122, 106, 0.08) 0%, transparent 70%)'
        }}
      />
      <div 
        className="absolute bottom-[-120px] right-[-120px] w-[400px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(158, 196, 168, 0.06) 0%, transparent 70%)'
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-[fadeInUp_0.6s_ease_both]">
          <div 
            className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4"
            style={{ color: 'rgba(240, 122, 106, 0.7)' }}
          >
            BeautySync Pro
          </div>
          <h1 
            className="text-5xl font-light mb-3"
            style={{ 
              fontFamily: 'Cormorant Garamond, serif',
              color: 'rgba(245, 240, 250, 0.92)'
            }}
          >
            {t.title}
          </h1>
          <p 
            className="text-lg font-light"
            style={{ color: 'rgba(245, 240, 250, 0.45)' }}
          >
            {t.subtitle}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: t.appointments, value: stats.todayAppointments, icon: Calendar, suffix: '' },
            { label: `${t.today} ${t.revenue}`, value: stats.todayRevenue, icon: DollarSign, prefix: '$' },
            { label: t.clients, value: stats.totalClients, icon: Users, suffix: '' },
            { label: t.growth, value: stats.monthlyGrowth, icon: TrendingUp, suffix: '%' }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={index}
                className="p-6 rounded-2xl border-[0.5px] transition-all duration-300 hover:border-[rgba(240,122,106,0.45)] animate-[fadeInUp_0.6s_ease_both]"
                style={{
                  background: 'rgba(240, 122, 106, 0.04)',
                  borderColor: 'rgba(240, 122, 106, 0.18)',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <IconComponent size={24} style={{ color: 'rgba(240, 122, 106, 0.7)' }} />
                  <div 
                    className="font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1 rounded-full border-[0.5px]"
                    style={{
                      background: 'rgba(240, 122, 106, 0.06)',
                      borderColor: 'rgba(240, 122, 106, 0.15)',
                      color: 'rgba(240, 122, 106, 0.5)'
                    }}
                  >
                    {t.today}
                  </div>
                </div>
                <div className="text-2xl font-light mb-2" style={{ color: 'rgba(245, 240, 250, 0.92)' }}>
                  {stat.prefix}{stat.value}{stat.suffix}
                </div>
                <div className="text-sm" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-12 animate-[fadeInUp_0.6s_ease_0.4s_both]">
          <div 
            className="font-mono text-[10px] uppercase tracking-[0.25em] mb-6 text-center"
            style={{ color: 'rgba(158, 196, 168, 0.7)' }}
          >
            {t.quickActions}
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: t.newAppointment, icon: Calendar, action: () => setCurrentView('appointments') },
              { label: t.addClient, icon: Users, action: () => setCurrentView('clients') },
              { label: t.analytics, icon: TrendingUp, action: () => handleProFeature('analytics'), isPro: true },
              { label: t.inventory, icon: Settings, action: () => handleProFeature('inventory'), isPro: true }
            ].map((action, index) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className="group flex items-center gap-3 px-6 py-3 rounded-full border-[0.5px] transition-all duration-200 hover:-translate-y-1 active:scale-98"
                  style={{
                    background: 'rgba(158, 196, 168, 0.1)',
                    borderColor: 'rgba(158, 196, 168, 0.35)',
                    color: 'rgba(158, 196, 168, 0.9)'
                  }}
                >
                  <IconComponent size={16} />
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em]">
                    {action.label}
                  </span>
                  {action.isPro && !isPro && (
                    <div 
                      className="font-mono text-[8px] uppercase tracking-[0.2em] px-2 py-1 rounded-full border-[0.5px]"
                      style={{
                        background: 'rgba(240, 122, 106, 0.1)',
                        borderColor: 'rgba(240, 122, 106, 0.3)',
                        color: 'rgba(240, 122, 106, 0.7)'
                      }}
                    >
                      PRO
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="animate-[fadeInUp_0.6s_ease_0.5s_both]">
          <div 
            className="font-mono text-[10px] uppercase tracking-[0.25em] mb-6 text-center"
            style={{ color: 'rgba(240, 122, 106, 0.7)' }}
          >
            {t.recentActivity}
          </div>
          <div 
            className="p-8 rounded-2xl border-[0.5px]"
            style={{
              background: 'rgba(245, 240, 250, 0.02)',
              borderColor: 'rgba(245, 240, 250, 0.1)'
            }}
          >
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={activity.id}
                    className="relative pl-4 pb-4 border-l-[2px] overflow-hidden"
                    style={{
                      borderImage: 'linear-gradient(to bottom, rgba(158, 196, 168, 0.4), rgba(240, 122, 106, 0.4)) 1'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium" style={{ color: 'rgba(245, 240, 250, 0.92)' }}>
                        {activity.clientName} - {activity.service}
                      </div>
                      <div 
                        className="font-mono text-[10px] uppercase tracking-[0.15em]"
                        style={{ color: 'rgba(245, 240, 250, 0.45)' }}
                      >
                        {activity.date ? new Date(activity.date.seconds * 1000).toLocaleDateString() : 'Recently'}
                      </div>
                    </div>
                    <div className="text-sm" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                      ${activity.price} • {activity.status || 'Completed'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                {t.noActivity}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
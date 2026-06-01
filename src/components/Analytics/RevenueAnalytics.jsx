import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, DollarSign, Users, Calendar, Lock, Filter, Download, AlertCircle } from 'lucide-react';
import { checkEntitlements } from '../../lib/revenuecat';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const RevenueAnalytics = ({ onShowPaywall }) => {
  const [isProUser, setIsProUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    totalClients: 0,
    totalAppointments: 0,
    averageTicket: 0,
    dailyRevenue: [],
    treatmentBreakdown: [],
    clientRetention: 0
  });

  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        const hasEntitlement = await checkEntitlements();
        setIsProUser(hasEntitlement);
        
        if (hasEntitlement) {
          await fetchAnalyticsData();
        } else {
          // Generate demo data for free users
          generateDemoData();
        }
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
        generateDemoData();
      } finally {
        setLoading(false);
      }
    };

    initializeAnalytics();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90);
      
      // Fetch appointments within date range
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('date', '>=', startOfDay(startDate)),
        where('date', '<=', endOfDay(endDate)),
        where('status', '==', 'completed')
      );
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const appointments = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate metrics
      const totalRevenue = appointments.reduce((sum, apt) => sum + (apt.price || 0), 0);
      const totalAppointments = appointments.length;
      const uniqueClients = new Set(appointments.map(apt => apt.clientId)).size;
      const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;
      
      // Generate daily revenue data
      const dailyData = {};
      appointments.forEach(apt => {
        const day = format(apt.date.toDate(), 'yyyy-MM-dd');
        dailyData[day] = (dailyData[day] || 0) + (apt.price || 0);
      });
      
      const dailyRevenue = Object.entries(dailyData).map(([date, revenue]) => ({
        date: format(new Date(date), 'MMM dd'),
        revenue
      }));
      
      // Treatment breakdown
      const treatmentData = {};
      appointments.forEach(apt => {
        const treatment = apt.treatment || 'Other';
        treatmentData[treatment] = (treatmentData[treatment] || 0) + (apt.price || 0);
      });
      
      const treatmentBreakdown = Object.entries(treatmentData).map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / totalRevenue) * 100)
      }));
      
      setAnalyticsData({
        totalRevenue,
        totalClients: uniqueClients,
        totalAppointments,
        averageTicket,
        dailyRevenue,
        treatmentBreakdown,
        clientRetention: 85 // This would be calculated from repeat bookings
      });
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    }
  };

  const generateDemoData = () => {
    const demoRevenue = Array.from({ length: 30 }, (_, i) => ({
      date: format(subDays(new Date(), 29 - i), 'MMM dd'),
      revenue: Math.floor(Math.random() * 2000) + 500
    }));
    
    setAnalyticsData({
      totalRevenue: 45000,
      totalClients: 156,
      totalAppointments: 234,
      averageTicket: 192.31,
      dailyRevenue: demoRevenue,
      treatmentBreakdown: [
        { name: 'Haircut & Style', value: 18000, percentage: 40 },
        { name: 'Color Treatment', value: 13500, percentage: 30 },
        { name: 'Facial', value: 9000, percentage: 20 },
        { name: 'Manicure', value: 4500, percentage: 10 }
      ],
      clientRetention: 78
    });
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => (
    <div className="analytics-stat-card">
      <div className="analytics-stat-header">
        <Icon className="analytics-stat-icon" />
        <span className="analytics-stat-label">{title}</span>
      </div>
      <div className="analytics-stat-value">{value}</div>
      {subtitle && <div className="analytics-stat-subtitle">{subtitle}</div>}
      {trend && (
        <div className={`analytics-trend ${trend > 0 ? 'positive' : 'negative'}`}>
          <TrendingUp className="trend-icon" />
          {Math.abs(trend)}% vs last period
        </div>
      )}
    </div>
  );

  const PremiumOverlay = ({ children }) => (
    <div className="premium-overlay">
      {children}
      <div className="premium-blur" />
      <div className="premium-lock">
        <Lock size={24} />
        <p>Professional プランでアンロック</p>
        <button className="unlock-button" onClick={onShowPaywall}>
          Upgrade Now
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner" />
        <p>Analytics Loading...</p>
      </div>
    );
  }

  return (
    <div className="revenue-analytics">
      {/* Background Glow */}
      <div className="analytics-glow-top" />
      <div className="analytics-glow-bottom" />
      
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">Revenue Analytics</h1>
          <p className="analytics-subtitle">売上の真実。データが語る物語。</p>
        </div>
        
        <div className="analytics-controls">
          <div className="date-filter">
            <span className="filter-label">Period</span>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="filter-select"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          
          {isProUser && (
            <button className="export-button">
              <Download size={16} />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="analytics-stats-grid">
        <StatCard
          title="Total Revenue"
          value={`¥${analyticsData.totalRevenue.toLocaleString()}`}
          subtitle={`${analyticsData.totalAppointments} appointments`}
          icon={DollarSign}
          trend={12.5}
        />
        <StatCard
          title="Active Clients"
          value={analyticsData.totalClients}
          subtitle="Unique customers"
          icon={Users}
          trend={8.2}
        />
        <StatCard
          title="Average Ticket"
          value={`¥${Math.round(analyticsData.averageTicket)}`}
          subtitle="Per appointment"
          icon={TrendingUp}
          trend={-2.1}
        />
        <StatCard
          title="Retention Rate"
          value={`${analyticsData.clientRetention}%`}
          subtitle="Client return rate"
          icon={Calendar}
          trend={5.3}
        />
      </div>

      {/* Revenue Trend Chart */}
      <div className="analytics-section">
        <div className="section-header">
          <h3>Revenue Trend</h3>
          <span className="section-meta">Daily revenue performance</span>
        </div>
        
        <div className={`chart-container ${!isProUser ? 'premium-locked' : ''}`}>
          {isProUser ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.dailyRevenue}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f07a6a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f07a6a" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(240, 122, 106, 0.1)" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(11, 11, 15, 0.95)',
                    border: '1px solid rgba(240, 122, 106, 0.3)',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f07a6a" 
                  fillOpacity={1} 
                  fill="url(#revenueGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <PremiumOverlay>
              <div style={{ height: '300px', background: 'rgba(240, 122, 106, 0.05)' }} />
            </PremiumOverlay>
          )}
        </div>
      </div>

      {/* Treatment Breakdown */}
      <div className="analytics-section">
        <div className="section-header">
          <h3>Treatment Performance</h3>
          <span className="section-meta">Revenue by service type</span>
        </div>
        
        <div className={`chart-row ${!isProUser ? 'premium-locked' : ''}`}>
          <div className="chart-container">
            {isProUser ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analyticsData.treatmentBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                  >
                    {analyticsData.treatmentBreakdown.map((entry, index) => {
                      const colors = ['#f07a6a', '#9ec4a8', '#c9a8e0', '#f5c87a'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <PremiumOverlay>
                <div style={{ height: '250px', background: 'rgba(158, 196, 168, 0.05)' }} />
              </PremiumOverlay>
            )}
          </div>
          
          <div className="treatment-list">
            {analyticsData.treatmentBreakdown.map((treatment, index) => (
              <div key={treatment.name} className="treatment-item">
                <div className="treatment-info">
                  <span className="treatment-name">{treatment.name}</span>
                  <span className="treatment-revenue">¥{treatment.value.toLocaleString()}</span>
                </div>
                <div className="treatment-percentage">{treatment.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Free User CTA */}
      {!isProUser && (
        <div className="analytics-upgrade-cta">
          <div className="cta-content">
            <AlertCircle className="cta-icon" />
            <div>
              <h3>Unlock Advanced Analytics</h3>
              <p>Get detailed insights, custom reports, and predictive analytics with BeautySync Pro.</p>
            </div>
            <button className="cta-button" onClick={onShowPaywall}>
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .revenue-analytics {
          position: relative;
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 24px;
          min-height: 100vh;
          background: #0b0b0f;
          color: rgba(245, 240, 250, 0.92);
        }

        .analytics-glow-top {
          position: absolute;
          top: -120px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(ellipse, rgba(240, 122, 106, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .analytics-glow-bottom {
          position: absolute;
          bottom: -120px;
          right: -200px;
          width: 500px;
          height: 500px;
          background: radial-gradient(ellipse, rgba(158, 196, 168, 0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .analytics-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 24px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 2px solid rgba(240, 122, 106, 0.2);
          border-top: 2px solid #f07a6a;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 48px;
          animation: fadeInUp 0.6s ease both;
        }

        .analytics-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px;
          font-weight: 300;
          letter-spacing: -0.02em;
          margin: 0;
          background: linear-gradient(135deg, rgba(245, 240, 250, 0.92), rgba(240, 122, 106, 0.8));
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .analytics-subtitle {
          font-family: 'Zen Kaku Gothic New', sans-serif;
          font-size: 16px;
          color: rgba(245, 240, 250, 0.45);
          margin: 8px 0 0 0;
          font-style: italic;
        }

        .analytics-controls {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .date-filter {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(240, 122, 106, 0.7);
        }

        .filter-select {
          background: rgba(240, 122, 106, 0.04);
          border: 0.5px solid rgba(240, 122, 106, 0.18);
          border-radius: 8px;
          padding: 8px 12px;
          color: rgba(245, 240, 250, 0.92);
          font-size: 14px;
          outline: none;
        }

        .filter-select:focus {
          border-color: rgba(240, 122, 106, 0.45);
        }

        .export-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(240, 122, 106, 0.1);
          border: 0.5px solid rgba(240, 122, 106, 0.35);
          border-radius: 40px;
          padding: 10px 20px;
          color: #f07a6a;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }

        .export-button:hover {
          background: rgba(240, 122, 106, 0.18);
          border-color: rgba(240, 122, 106, 0.6);
          transform: translateY(-1px);
        }

        .analytics-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
          animation: fadeInUp 0.6s ease 0.15s both;
        }

        .analytics-stat-card {
          background: rgba(240, 122, 106, 0.04);
          border: 0.5px solid rgba(240, 122, 106, 0.18);
          border-radius: 16px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .analytics-stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom, #f07a6a, #9ec4a8);
          opacity: 0.4;
        }

        .analytics-stat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .analytics-stat-icon {
          width: 20px;
          height: 20px;
          color: rgba(240, 122, 106, 0.7);
        }

        .analytics-stat-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(245, 240, 250, 0.45);
        }

        .analytics-stat-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 300;
          color: rgba(245, 240, 250, 0.92);
          margin-bottom: 8px;
        }

        .analytics-stat-subtitle {
          font-size: 14px;
          color: rgba(245, 240, 250, 0.45);
          margin-bottom: 12px;
        }

        .analytics-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
        }

        .analytics-trend.positive {
          color: #9ec4a8;
        }

        .analytics-trend.negative {
          color: #f07a6a;
        }

        .trend-icon {
          width: 12px;
          height: 12px;
        }

        .analytics-section {
          margin-bottom: 48px;
          animation: fadeInUp 0.6s ease 0.3s both;
        }

        .section-header {
          margin-bottom: 24px;
        }

        .section-header h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 300;
          margin: 0 0 8px 0;
          color: rgba(245, 240, 250, 0.92);
        }

        .section-meta {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(245, 240, 250, 0.45);
        }

        .chart-container {
          background: rgba(158, 196, 168, 0.04);
          border: 0.5px solid rgba(158, 196, 168, 0.18);
          border-radius: 16px;
          padding: 24px;
          position: relative;
        }

        .chart-row {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 24px;
        }

        .premium-overlay {
          position: relative;
        }

        .premium-blur {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          backdrop-filter: blur(8px);
          background: rgba(11, 11, 15, 0.6);
          border-radius: 16px;
        }

        .premium-lock {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 10;
        }

        .premium-lock svg {
          color: rgba(240, 122, 106, 0.7);
          margin-bottom: 16px;
        }

        .premium-lock p {
          font-size: 14px;
          color: rgba(245, 240, 250, 0.45);
          margin: 0 0 16px 0;
        }

        .unlock-button {
          background: rgba(240, 122, 106, 0.1);
          border: 0.5px solid rgba(240, 122, 106, 0.35);
          border-radius: 40px;
          padding: 10px 24px;
          color: #f07a6a;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }

        .unlock-button:hover {
          background: rgba(240, 122, 106, 0.18);
          border-color: rgba(240, 122, 106, 0.6);
          transform: translateY(-1px);
        }

        .treatment-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .treatment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: rgba(240, 122, 106, 0.02);
          border: 0.5px solid rgba(240, 122, 106, 0.1);
          border-radius: 8px;
        }

        .treatment-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .treatment-name {
          font-size: 14px;
          color: rgba(245, 240, 250, 0.92);
        }

        .treatment-revenue {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: rgba(245, 240, 250, 0.45);
        }

        .treatment-percentage {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          color: #f07a6a;
        }

        .analytics-upgrade-cta {
          background: rgba(240, 122, 106, 0.04);
          border: 0.5px solid rgba(240, 122, 106, 0.18);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          margin-top: 48px;
        }

        .cta-content {
          display: flex;
          align-items: center;
          gap: 24px;
          max-width: 600px;
          margin: 0 auto;
        }

        .cta-icon {
          width: 40px;
          height: 40px;
          color: rgba(240, 122, 106, 0.7);
          flex-shrink: 0;
        }

        .cta-content h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          margin: 0 0 8px 0;
          color: rgba(245, 240, 250, 0.92);
        }

        .cta-content p {
          font-size: 14px;
          color: rgba(245, 240, 250, 0.45);
          margin: 0;
          text-align: left;
        }

        .cta-button {
          background: rgba(240, 122, 106, 0.1);
          border: 0.5px solid rgba(240, 122, 106, 0.35);
          border-radius: 40px;
          padding: 12px 32px;
          color: #f07a6a;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .cta-button:hover {
          background: rgba(240, 122, 106, 0.18);
          border-color: rgba(240, 122, 106, 0.6);
          transform: translateY(-1px);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .analytics-header {
            flex-direction: column;
            gap: 24px;
            align-items: flex-start;
          }

          .analytics-controls {
            width: 100%;
            justify-content: space-between;
          }

          .chart-row {
            grid-template-columns: 1fr;
          }

          .cta-content {
            flex-direction: column;
            text-align: center;
          }

          .cta-content p {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default RevenueAnalytics;
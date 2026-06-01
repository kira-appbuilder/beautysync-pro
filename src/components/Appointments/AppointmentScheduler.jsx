import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, DollarSign, Plus, Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { checkEntitlements } from '../../lib/revenuecat';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';

function AppointmentScheduler({ language, showPaywall }) {
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff] = useState([
    { id: '1', name: 'Sarah Johnson', skills: ['Haircut', 'Color', 'Styling'] },
    { id: '2', name: 'Maria Garcia', skills: ['Nails', 'Spa', 'Facial'] },
    { id: '3', name: 'Emily Chen', skills: ['Massage', 'Spa', 'Waxing'] }
  ]);
  const [services] = useState([
    { id: '1', name: 'Haircut & Style', duration: 60, price: 85 },
    { id: '2', name: 'Hair Color', duration: 120, price: 150 },
    { id: '3', name: 'Manicure', duration: 45, price: 35 },
    { id: '4', name: 'Facial Treatment', duration: 90, price: 110 },
    { id: '5', name: 'Deep Tissue Massage', duration: 75, price: 95 }
  ]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newAppointment, setNewAppointment] = useState({
    clientId: '',
    staffId: '',
    serviceId: '',
    date: '',
    time: '',
    notes: '',
    reminderEnabled: true
  });

  useEffect(() => {
    loadAppointments();
    loadClients();
    checkProStatus();
  }, [currentWeek]);

  const loadAppointments = async () => {
    try {
      if (!auth.currentUser) return;

      const appointmentsRef = collection(db, 'appointments');
      const appointmentsQuery = query(
        appointmentsRef,
        where('userId', '==', auth.currentUser.uid),
        orderBy('date')
      );
      const snapshot = await getDocs(appointmentsQuery);
      const appointmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      if (!auth.currentUser) return;

      const clientsRef = collection(db, 'clients');
      const clientsQuery = query(
        clientsRef,
        where('userId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(clientsQuery);
      const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const checkProStatus = async () => {
    const hasEntitlement = await checkEntitlements();
    setIsPro(hasEntitlement);
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    
    if (!isPro && appointments.length >= 10) {
      showPaywall();
      return;
    }

    try {
      const selectedClient = clients.find(c => c.id === newAppointment.clientId);
      const selectedService = services.find(s => s.id === newAppointment.serviceId);
      const selectedStaff = staff.find(s => s.id === newAppointment.staffId);
      
      const appointmentDate = new Date(`${newAppointment.date}T${newAppointment.time}`);
      
      await addDoc(collection(db, 'appointments'), {
        ...newAppointment,
        userId: auth.currentUser.uid,
        clientName: selectedClient?.name || '',
        service: selectedService?.name || '',
        staffName: selectedStaff?.name || '',
        duration: selectedService?.duration || 60,
        price: selectedService?.price || 0,
        date: appointmentDate,
        status: 'scheduled',
        createdAt: new Date()
      });

      setNewAppointment({
        clientId: '',
        staffId: '',
        serviceId: '',
        date: '',
        time: '',
        notes: '',
        reminderEnabled: true
      });
      setShowAddForm(false);
      loadAppointments();
    } catch (error) {
      console.error('Error adding appointment:', error);
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getAppointmentsForDay = (day) => {
    return appointments.filter(apt => {
      if (!apt.date) return false;
      const aptDate = apt.date.seconds ? new Date(apt.date.seconds * 1000) : new Date(apt.date);
      return isSameDay(aptDate, day);
    }).sort((a, b) => {
      const timeA = a.date.seconds ? new Date(a.date.seconds * 1000) : new Date(a.date);
      const timeB = b.date.seconds ? new Date(b.date.seconds * 1000) : new Date(b.date);
      return timeA - timeB;
    });
  };

  const text = {
    en: {
      title: 'Appointment Scheduler',
      subtitle: 'Time becomes art when managed with precision.',
      addAppointment: 'New Appointment',
      client: 'Client',
      service: 'Service',
      staff: 'Staff Member',
      date: 'Date',
      time: 'Time',
      notes: 'Notes',
      reminders: 'SMS Reminders',
      save: 'Schedule',
      cancel: 'Cancel',
      today: 'Today',
      thisWeek: 'This Week',
      prevWeek: 'Previous Week',
      nextWeek: 'Next Week',
      scheduled: 'Scheduled',
      completed: 'Completed',
      cancelled: 'Cancelled',
      freeLimit: 'Free plan allows up to 10 appointments per month'
    },
    ja: {
      title: '予約スケジューラー',
      subtitle: '精密に管理された時間は芸術となる。',
      addAppointment: '新規予約',
      client: '顧客',
      service: 'サービス',
      staff: 'スタッフ',
      date: '日付',
      time: '時間',
      notes: 'メモ',
      reminders: 'SMS通知',
      save: '予約する',
      cancel: 'キャンセル',
      today: '今日',
      thisWeek: '今週',
      prevWeek: '前週',
      nextWeek: '次週',
      scheduled: '予約済み',
      completed: '完了',
      cancelled: 'キャンセル',
      freeLimit: '無料プランでは月10件まで'
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

  const weekDays = getWeekDays();

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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-[fadeInUp_0.6s_ease_both]">
          <div 
            className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4"
            style={{ color: 'rgba(240, 122, 106, 0.7)' }}
          >
            Schedule Management
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

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 animate-[fadeInUp_0.6s_ease_0.15s_both]">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <button
              onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
              className="px-4 py-2 rounded-full border-[0.5px] transition-all duration-200 hover:-translate-y-1"
              style={{
                background: 'rgba(245, 240, 250, 0.04)',
                borderColor: 'rgba(245, 240, 250, 0.18)',
                color: 'rgba(245, 240, 250, 0.45)'
              }}
            >
              ←
            </button>
            <div 
              className="font-mono text-[12px] uppercase tracking-[0.15em] px-4 py-2"
              style={{ color: 'rgba(245, 240, 250, 0.92)' }}
            >
              {format(weekDays[0], 'MMM dd')} - {format(weekDays[6], 'MMM dd, yyyy')}
            </div>
            <button
              onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
              className="px-4 py-2 rounded-full border-[0.5px] transition-all duration-200 hover:-translate-y-1"
              style={{
                background: 'rgba(245, 240, 250, 0.04)',
                borderColor: 'rgba(245, 240, 250, 0.18)',
                color: 'rgba(245, 240, 250, 0.45)'
              }}
            >
              →
            </button>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-3 px-6 py-3 rounded-full border-[0.5px] transition-all duration-200 hover:-translate-y-1 active:scale-98"
            style={{
              background: 'rgba(240, 122, 106, 0.1)',
              borderColor: 'rgba(240, 122, 106, 0.35)',
              color: 'rgba(240, 122, 106, 0.9)'
            }}
          >
            <Plus size={16} />
            <span className="font-mono text-[11px] uppercase tracking-[0.15em]">
              {t.addAppointment}
            </span>
          </button>
        </div>

        {/* Free Plan Limit */}
        {!isPro && (
          <div 
            className="p-4 rounded-2xl border-[0.5px] mb-6 animate-[fadeInUp_0.6s_ease_0.2s_both]"
            style={{
              background: 'rgba(240, 122, 106, 0.04)',
              borderColor: 'rgba(240, 122, 106, 0.18)'
            }}
          >
            <div className="text-center text-sm" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
              {t.freeLimit} ({appointments.length}/10)
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-4 animate-[fadeInUp_0.6s_ease_0.3s_both]">
          {weekDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={index}
                className="min-h-[400px] p-4 rounded-2xl border-[0.5px] transition-all duration-300"
                style={{
                  background: isToday ? 'rgba(240, 122, 106, 0.04)' : 'rgba(158, 196, 168, 0.02)',
                  borderColor: isToday ? 'rgba(240, 122, 106, 0.25)' : 'rgba(158, 196, 168, 0.12)'
                }}
              >
                {/* Day Header */}
                <div className="text-center mb-4">
                  <div 
                    className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1"
                    style={{ color: 'rgba(245, 240, 250, 0.45)' }}
                  >
                    {format(day, 'EEE')}
                  </div>
                  <div 
                    className={`text-xl font-light ${isToday ? 'text-[rgba(240,122,106,0.9)]' : 'text-[rgba(245,240,250,0.92)]'}`}
                  >
                    {format(day, 'd')}
                  </div>
                  {isToday && (
                    <div 
                      className="font-mono text-[8px] uppercase tracking-[0.2em] mt-1"
                      style={{ color: 'rgba(240, 122, 106, 0.7)' }}
                    >
                      {t.today}
                    </div>
                  )}
                </div>

                {/* Appointments */}
                <div className="space-y-3">
                  {dayAppointments.map((appointment, aptIndex) => {
                    const aptTime = appointment.date.seconds ? 
                      new Date(appointment.date.seconds * 1000) : 
                      new Date(appointment.date);
                    
                    return (
                      <div 
                        key={appointment.id}
                        className="p-3 rounded-xl border-[0.5px] relative overflow-hidden animate-[fadeIn_0.4s_ease]"
                        style={{
                          background: 'rgba(158, 196, 168, 0.06)',
                          borderColor: 'rgba(158, 196, 168, 0.2)',
                          animationDelay: `${aptIndex * 0.1}s`
                        }}
                      >
                        {/* Status indicator */}
                        <div 
                          className="absolute top-0 left-0 w-[2px] h-full"
                          style={{
                            background: appointment.status === 'completed' ? 
                              'rgba(158, 196, 168, 0.8)' : 
                              appointment.status === 'cancelled' ? 
                              'rgba(240, 122, 106, 0.8)' : 
                              'rgba(240, 122, 106, 0.6)'
                          }}
                        />
                        
                        <div className="ml-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock size={12} style={{ color: 'rgba(158, 196, 168, 0.7)' }} />
                            <span 
                              className="font-mono text-[10px] uppercase tracking-[0.15em]"
                              style={{ color: 'rgba(245, 240, 250, 0.92)' }}
                            >
                              {format(aptTime, 'HH:mm')}
                            </span>
                          </div>
                          
                          <div className="text-sm font-medium mb-1" style={{ color: 'rgba(245, 240, 250, 0.92)' }}>
                            {appointment.clientName}
                          </div>
                          
                          <div className="text-xs mb-2" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                            {appointment.service}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div 
                              className="font-mono text-[10px] uppercase tracking-[0.1em]"
                              style={{ color: 'rgba(158, 196, 168, 0.7)' }}
                            >
                              {appointment.staffName}
                            </div>
                            {appointment.reminderEnabled && (
                              <Bell size={10} style={{ color: 'rgba(240, 122, 106, 0.5)' }} />
                            )}
                          </div>
                          
                          <div className="mt-2 text-right">
                            <span 
                              className="font-mono text-[10px] font-medium"
                              style={{ color: 'rgba(245, 240, 250, 0.92)' }}
                            >
                              ${appointment.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Appointment Modal */}
        {showAddForm && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddForm(false)}
          >
            <div 
              className="w-full max-w-lg p-8 rounded-2xl border-[0.5px] animate-[fadeIn_0.3s_ease] max-h-[90vh] overflow-y-auto"
              style={{
                background: '#0b0b0f',
                borderColor: 'rgba(240, 122, 106, 0.35)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 
                className="text-2xl font-light mb-6"
                style={{ 
                  fontFamily: 'Cormorant Garamond, serif',
                  color: 'rgba(245, 240, 250, 0.92)'
                }}
              >
                {t.addAppointment}
              </h3>
              
              <form onSubmit={handleAddAppointment} className="space-y-6">
                {/* Client Selection */}
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                    {t.client}
                  </label>
                  <select
                    required
                    value={newAppointment.clientId}
                    onChange={(e) => setNewAppointment({...newAppointment, clientId: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-[0.5px] bg-transparent transition-all duration-300 focus:outline-none"
                    style={{
                      background: 'rgba(240, 122, 106, 0.04)',
                      borderColor: 'rgba(240, 122, 106, 0.18)',
                      color: 'rgba(245, 240, 250, 0.92)'
                    }}
                  >
                    <option value="">Select a client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id} style={{ background: '#0b0b0f' }}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Selection */}
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                    {t.service}
                  </label>
                  <select
                    required
                    value={newAppointment.serviceId}
                    onChange={(e) => setNewAppointment({...newAppointment, serviceId: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-[0.5px] bg-transparent transition-all duration-300 focus:outline-none"
                    style={{
                      background: 'rgba(240, 122, 106, 0.04)',
                      borderColor: 'rgba(240, 122, 106, 0.18)',
                      color: 'rgba(245, 240, 250, 0.92)'
                    }}
                  >
                    <option value="">Select a service...</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id} style={{ background: '#0b0b0f' }}>
                        {service.name} - ${service.price} ({service.duration}min)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Staff Selection */}
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                    {t.staff}
                  </label>
                  <select
                    required
                    value={newAppointment.staffId}
                    onChange={(e) => setNewAppointment({...newAppointment, staffId: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-[0.5px] bg-transparent transition-all duration-300 focus:outline-none"
                    style={{
                      background: 'rgba(240, 122, 106, 0.04)',
                      borderColor: 'rgba(240, 122, 106, 0.18)',
                      color: 'rgba(245, 240, 250, 0.92)'
                    }}
                  >
                    <option value="">Select staff member...</option>
                    {staff.map(member => (
                      <option key={member.id} value={member.id} style={{ background: '#0b0b0f' }}>
                        {member.name} - {member.skills.join(', ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                      {t.date}
                    </label>
                    <input
                      type="date"
                      required
                      value={newAppointment.date}
                      onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-[0.5px] bg-transparent transition-all duration-300 focus:outline-none"
                      style={{
                        background: 'rgba(240, 122, 106, 0.04)',
                        borderColor: 'rgba(240, 122, 106, 0.18)',
                        color: 'rgba(245, 240, 250, 0.92)'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                      {t.time}
                    </label>
                    <input
                      type="time"
                      required
                      value={newAppointment.time}
                      onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-[0.5px] bg-transparent transition-all duration-300 focus:outline-none"
                      style={{
                        background: 'rgba(240, 122, 106, 0.04)',
                        borderColor: 'rgba(240, 122, 106, 0.18)',
                        color: 'rgba(245, 240, 250, 0.92)'
                      }}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm mb-2" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                    {t.notes}
                  </label>
                  <textarea
                    rows={3}
                    value={newAppointment.notes}
                    onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-[0.5px] bg-transparent transition-all duration-300 focus:outline-none resize-none"
                    style={{
                      background: 'rgba(240, 122, 106, 0.04)',
                      borderColor: 'rgba(240, 122, 106, 0.18)',
                      color: 'rgba(245, 240, 250, 0.92)'
                    }}
                  />
                </div>

                {/* SMS Reminders */}
                {isPro && (
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="reminders"
                      checked={newAppointment.reminderEnabled}
                      onChange={(e) => setNewAppointment({...newAppointment, reminderEnabled: e.target.checked})}
                      className="w-4 h-4 rounded border-[0.5px]"
                      style={{ accentColor: 'rgba(240, 122, 106, 0.8)' }}
                    />
                    <label htmlFor="reminders" className="text-sm" style={{ color: 'rgba(245, 240, 250, 0.92)' }}>
                      {t.reminders}
                    </label>
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
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-full border-[0.5px] transition-all duration-200 hover:-translate-y-1"
                    style={{
                      background: 'rgba(240, 122, 106, 0.1)',
                      borderColor: 'rgba(240, 122, 106, 0.35)',
                      color: 'rgba(240, 122, 106, 0.9)'
                    }}
                  >
                    <span className="font-mono text-[11px] uppercase tracking-[0.15em]">
                      {t.save}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-3 rounded-full border-[0.5px] transition-all duration-200 hover:-translate-y-1"
                    style={{
                      background: 'rgba(245, 240, 250, 0.04)',
                      borderColor: 'rgba(245, 240, 250, 0.18)',
                      color: 'rgba(245, 240, 250, 0.45)'
                    }}
                  >
                    <span className="font-mono text-[11px] uppercase tracking-[0.15em]">
                      {t.cancel}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppointmentScheduler;
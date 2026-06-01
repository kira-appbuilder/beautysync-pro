import React, { useState, useEffect } from 'react';
import { Search, UserPlus, User, Phone, Mail, Calendar, Star, MapPin, Edit2, Trash2 } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { checkEntitlements } from '../../lib/revenuecat';

function ClientManager({ language, showPaywall }) {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    preferences: '',
    notes: ''
  });

  useEffect(() => {
    loadClients();
    checkProStatus();
  }, []);

  const loadClients = async () => {
    try {
      if (!auth.currentUser) return;

      const clientsRef = collection(db, 'clients');
      const clientsQuery = query(
        clientsRef,
        where('userId', '==', auth.currentUser.uid),
        orderBy('name')
      );
      const snapshot = await getDocs(clientsQuery);
      const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkProStatus = async () => {
    const hasEntitlement = await checkEntitlements();
    setIsPro(hasEntitlement);
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    
    if (!isPro && clients.length >= 5) {
      showPaywall();
      return;
    }

    try {
      await addDoc(collection(db, 'clients'), {
        ...newClient,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        totalVisits: 0,
        lastVisit: null
      });

      setNewClient({ name: '', email: '', phone: '', preferences: '', notes: '' });
      setShowAddForm(false);
      loadClients();
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteDoc(doc(db, 'clients', clientId));
        loadClients();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

  const text = {
    en: {
      title: 'Client Management',
      subtitle: 'Every client tells a story of transformation.',
      search: 'Search clients...',
      addClient: 'Add New Client',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      preferences: 'Preferences',
      notes: 'Notes',
      save: 'Save Client',
      cancel: 'Cancel',
      visits: 'visits',
      lastVisit: 'Last visit',
      never: 'Never',
      freeLimit: 'Free plan allows up to 5 clients',
      upgradeForMore: 'Upgrade to Pro for unlimited clients'
    },
    ja: {
      title: '顧客管理',
      subtitle: '一人ひとりに変化の物語がある。',
      search: '顧客を検索...',
      addClient: '新規顧客追加',
      name: '名前',
      email: 'メール',
      phone: '電話番号',
      preferences: '好み',
      notes: 'メモ',
      save: '保存',
      cancel: 'キャンセル',
      visits: '来店回数',
      lastVisit: '最後の来店',
      never: 'なし',
      freeLimit: '無料プランでは5名まで',
      upgradeForMore: 'プロプランで無制限に'
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
          background: 'radial-gradient(ellipse, rgba(158, 196, 168, 0.08) 0%, transparent 70%)'
        }}
      />
      <div 
        className="absolute bottom-[-120px] right-[-120px] w-[400px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(240, 122, 106, 0.06) 0%, transparent 70%)'
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-[fadeInUp_0.6s_ease_both]">
          <div 
            className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4"
            style={{ color: 'rgba(158, 196, 168, 0.7)' }}
          >
            Client Database
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

        {/* Search and Add */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 animate-[fadeInUp_0.6s_ease_0.15s_both]">
          <div className="flex-1 relative">
            <Search 
              size={20} 
              className="absolute left-4 top-1/2 transform -translate-y-1/2" 
              style={{ color: 'rgba(158, 196, 168, 0.5)' }}
            />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-[0.5px] bg-transparent transition-all duration-300 focus:outline-none"
              style={{
                background: 'rgba(158, 196, 168, 0.04)',
                borderColor: 'rgba(158, 196, 168, 0.18)',
                color: 'rgba(245, 240, 250, 0.92)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(158, 196, 168, 0.45)';
                e.target.style.background = 'rgba(158, 196, 168, 0.06)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(158, 196, 168, 0.18)';
                e.target.style.background = 'rgba(158, 196, 168, 0.04)';
              }}
            />
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-3 px-6 py-4 rounded-full border-[0.5px] transition-all duration-200 hover:-translate-y-1 active:scale-98"
            style={{
              background: 'rgba(158, 196, 168, 0.1)',
              borderColor: 'rgba(158, 196, 168, 0.35)',
              color: 'rgba(158, 196, 168, 0.9)'
            }}
          >
            <UserPlus size={16} />
            <span className="font-mono text-[11px] uppercase tracking-[0.15em]">
              {t.addClient}
            </span>
          </button>
        </div>

        {/* Free Plan Limit Warning */}
        {!isPro && (
          <div 
            className="p-4 rounded-2xl border-[0.5px] mb-6 animate-[fadeInUp_0.6s_ease_0.2s_both]"
            style={{
              background: 'rgba(240, 122, 106, 0.04)',
              borderColor: 'rgba(240, 122, 106, 0.18)'
            }}
          >
            <div className="text-center">
              <div className="text-sm mb-2" style={{ color: 'rgba(245, 240, 250, 0.92)' }}>
                {t.freeLimit} ({clients.length}/5)
              </div>
              <div className="text-xs" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                {t.upgradeForMore}
              </div>
            </div>
          </div>
        )}

        {/* Add Client Form */}
        {showAddForm && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddForm(false)}
          >
            <div 
              className="w-full max-w-md p-8 rounded-2xl border-[0.5px] animate-[fadeIn_0.3s_ease]"
              style={{
                background: '#0b0b0f',
                borderColor: 'rgba(158, 196, 168, 0.35)'
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
                {t.addClient}
              </h3>
              <form onSubmit={handleAddClient} className="space-y-4">
                {[
                  { key: 'name', label: t.name, type: 'text' },
                  { key: 'email', label: t.email, type: 'email' },
                  { key: 'phone', label: t.phone, type: 'tel' },
                  { key: 'preferences', label: t.preferences, type: 'text' },
                  { key: 'notes', label: t.notes, type: 'textarea' }
                ].map(field => (
                  <div key={field.key}>
                    <label 
                      className="block text-sm mb-2"
                      style={{ color: 'rgba(245, 240, 250, 0.45)' }}
                    >
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        value={newClient[field.key]}
                        onChange={(e) => setNewClient({...newClient, [field.key]: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border-[0.5px] bg-transparent transition-all duration-300 focus:outline-none resize-none"
                        style={{
                          background: 'rgba(158, 196, 168, 0.04)',
                          borderColor: 'rgba(158, 196, 168, 0.18)',
                          color: 'rgba(245, 240, 250, 0.92)'
                        }}
                      />
                    ) : (
                      <input
                        type={field.type}
                        required={field.key === 'name'}
                        value={newClient[field.key]}
                        onChange={(e) => setNewClient({...newClient, [field.key]: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border-[0.5px] bg-transparent transition-all duration-300 focus:outline-none"
                        style={{
                          background: 'rgba(158, 196, 168, 0.04)',
                          borderColor: 'rgba(158, 196, 168, 0.18)',
                          color: 'rgba(245, 240, 250, 0.92)'
                        }}
                      />
                    )}
                  </div>
                ))}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-full border-[0.5px] transition-all duration-200 hover:-translate-y-1"
                    style={{
                      background: 'rgba(158, 196, 168, 0.1)',
                      borderColor: 'rgba(158, 196, 168, 0.35)',
                      color: 'rgba(158, 196, 168, 0.9)'
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

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client, index) => (
            <div 
              key={client.id}
              className="p-6 rounded-2xl border-[0.5px] transition-all duration-300 hover:border-[rgba(158,196,168,0.45)] group animate-[fadeInUp_0.6s_ease_both] relative overflow-hidden"
              style={{
                background: 'rgba(158, 196, 168, 0.04)',
                borderColor: 'rgba(158, 196, 168, 0.18)',
                animationDelay: `${index * 0.1}s`
              }}
            >
              {/* Left border accent */}
              <div 
                className="absolute top-0 left-0 w-[2px] h-full opacity-40"
                style={{
                  background: 'linear-gradient(to bottom, rgba(158, 196, 168, 1), rgba(240, 122, 106, 1))'
                }}
              />
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(158, 196, 168, 0.2)' }}
                  >
                    <User size={16} style={{ color: 'rgba(158, 196, 168, 0.8)' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium" style={{ color: 'rgba(245, 240, 250, 0.92)' }}>
                      {client.name}
                    </h3>
                    <div 
                      className="font-mono text-[10px] uppercase tracking-[0.15em]"
                      style={{ color: 'rgba(245, 240, 250, 0.45)' }}
                    >
                      {client.totalVisits || 0} {t.visits}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteClient(client.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-lg hover:bg-red-500/10"
                >
                  <Trash2 size={14} style={{ color: 'rgba(245, 240, 250, 0.45)' }} />
                </button>
              </div>

              <div className="space-y-3">
                {client.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={14} style={{ color: 'rgba(158, 196, 168, 0.7)' }} />
                    <span className="text-sm" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                      {client.email}
                    </span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={14} style={{ color: 'rgba(158, 196, 168, 0.7)' }} />
                    <span className="text-sm" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                      {client.phone}
                    </span>
                  </div>
                )}
                {client.preferences && (
                  <div className="flex items-start gap-3">
                    <Star size={14} style={{ color: 'rgba(158, 196, 168, 0.7)' }} className="mt-0.5" />
                    <span className="text-sm" style={{ color: 'rgba(245, 240, 250, 0.45)' }}>
                      {client.preferences}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t-[0.5px]" style={{ borderColor: 'rgba(158, 196, 168, 0.1)' }}>
                <div className="flex items-center gap-2">
                  <Calendar size={12} style={{ color: 'rgba(158, 196, 168, 0.5)' }} />
                  <span 
                    className="font-mono text-[10px] uppercase tracking-[0.15em]"
                    style={{ color: 'rgba(245, 240, 250, 0.2)' }}
                  >
                    {t.lastVisit}: {client.lastVisit ? new Date(client.lastVisit.seconds * 1000).toLocaleDateString() : t.never}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div 
            className="text-center py-12"
            style={{ color: 'rgba(245, 240, 250, 0.45)' }}
          >
            {searchQuery ? 'No clients found matching your search.' : 'No clients yet. Add your first client to get started!'}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientManager;
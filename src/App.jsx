import React, { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import revenueCatService from './lib/revenuecat'

// Components
import AuthManager from './components/Auth/AuthManager'
import Dashboard from './components/Dashboard/Dashboard'
import ClientManager from './components/Clients/ClientManager'
import AppointmentScheduler from './components/Appointments/AppointmentScheduler'
import RevenueAnalytics from './components/Analytics/RevenueAnalytics'
import PaywallModal from './components/Subscription/PaywallModal'

// Icons
import { 
  Globe,
  MessageCircle, 
  AlertTriangle,
  Calendar,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Crown
} from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState('en')
  const [isPro, setIsPro] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')

  // Feedback & Error States
  const [showFeedback, setShowFeedback] = useState(false)
  const [showErrorReport, setShowErrorReport] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [errorReport, setErrorReport] = useState('')

  // Language content
  const content = {
    en: {
      title: 'BeautySync Pro',
      subtitle: 'Comprehensive salon management platform',
      tagline: '美しさを管理する。あなたのサロンのために。',
      nav: {
        dashboard: 'Dashboard',
        clients: 'Clients',
        appointments: 'Appointments',
        analytics: 'Analytics'
      },
      feedback: 'Send Feedback',
      reportError: 'Report Error',
      submit: 'Submit',
      cancel: 'Cancel',
      upgrade: 'Upgrade to Pro',
      signOut: 'Sign Out'
    },
    ja: {
      title: 'BeautySync Pro',
      subtitle: '総合的なサロン管理プラットフォーム',
      tagline: 'Managing beauty. For your salon.',
      nav: {
        dashboard: 'ダッシュボード',
        clients: 'お客様',
        appointments: '予約',
        analytics: '分析'
      },
      feedback: 'フィードバック',
      reportError: 'エラー報告',
      submit: '送信',
      cancel: 'キャンセル',
      upgrade: 'Pro版にアップグレード',
      signOut: 'サインアウト'
    }
  }

  const t = content[language]

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          await revenueCatService.initialize(user.uid)
          const entitlements = await revenueCatService.checkEntitlements()
          setIsPro(entitlements.isPro)
        } catch (error) {
          console.error('RevenueCat initialization failed:', error)
          setIsPro(false)
        }
      } else {
        await revenueCatService.logout()
        setIsPro(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleProFeature = () => {
    if (!isPro) {
      setShowPaywall(true)
      return false
    }
    return true
  }

  const handleSubmitFeedback = (e) => {
    e.preventDefault()
    console.log('Feedback submitted:', feedback)
    setFeedback('')
    setShowFeedback(false)
  }

  const handleSubmitError = (e) => {
    e.preventDefault()
    console.log('Error reported:', errorReport)
    setErrorReport('')
    setShowErrorReport(false)
  }

  const handleSignOut = async () => {
    try {
      await revenueCatService.logout()
      await auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div className="loading-text">{t.title}</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <div className="app">
          <div className="glow-top"></div>
          <AuthManager language={language} setLanguage={setLanguage} />
          <div className="glow-bottom"></div>
        </div>
      </ErrorBoundary>
    )
  }

  const renderView = () => {
    switch (currentView) {
      case 'clients':
        return <ClientManager language={language} isPro={isPro} onProFeature={handleProFeature} />
      case 'appointments':
        return <AppointmentScheduler language={language} isPro={isPro} onProFeature={handleProFeature} />
      case 'analytics':
        return <RevenueAnalytics language={language} isPro={isPro} onProFeature={handleProFeature} />
      default:
        return <Dashboard language={language} isPro={isPro} onProFeature={handleProFeature} />
    }
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <div className="glow-top"></div>
        
        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            <div className="brand">
              <h1 className="brand-title">{t.title}</h1>
              <div className="brand-subtitle">{t.subtitle}</div>
              <div className="brand-tagline">{t.tagline}</div>
            </div>

            <div className="header-actions">
              {/* Language Toggle */}
              <button 
                className="pill-button" 
                onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}
              >
                <Globe className="icon" />
                {language === 'en' ? 'JA' : 'EN'}
              </button>

              {/* Pro Status */}
              {isPro ? (
                <div className="status-badge pro">
                  <Crown className="icon" />
                  Pro
                </div>
              ) : (
                <button 
                  className="pill-button upgrade"
                  onClick={() => setShowPaywall(true)}
                >
                  <Crown className="icon" />
                  {t.upgrade}
                </button>
              )}

              {/* Sign Out */}
              <button 
                className="pill-button"
                onClick={handleSignOut}
              >
                <LogOut className="icon" />
                {t.signOut}
              </button>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="app-nav">
          <div className="nav-content">
            <div className="nav-meta">Navigation</div>
            <div className="nav-buttons">
              <button 
                className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                <TrendingUp className="icon" />
                {t.nav.dashboard}
              </button>
              <button 
                className={`nav-button ${currentView === 'clients' ? 'active' : ''}`}
                onClick={() => setCurrentView('clients')}
              >
                <Users className="icon" />
                {t.nav.clients}
              </button>
              <button 
                className={`nav-button ${currentView === 'appointments' ? 'active' : ''}`}
                onClick={() => setCurrentView('appointments')}
              >
                <Calendar className="icon" />
                {t.nav.appointments}
              </button>
              <button 
                className={`nav-button ${currentView === 'analytics' ? 'active' : ''}`}
                onClick={() => setCurrentView('analytics')}
              >
                <TrendingUp className="icon" />
                {t.nav.analytics}
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="app-main">
          {renderView()}
        </main>

        {/* Fixed Elements */}
        <div className="fixed-widgets">
          <button 
            className="widget-button feedback"
            onClick={() => setShowFeedback(true)}
          >
            <MessageCircle className="icon" />
            {t.feedback}
          </button>
          
          <button 
            className="widget-button error"
            onClick={() => setShowErrorReport(true)}
          >
            <AlertTriangle className="icon" />
            {t.reportError}
          </button>
        </div>

        {/* Feedback Modal */}
        {showFeedback && (
          <div className="modal-overlay" onClick={() => setShowFeedback(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Send Feedback</h3>
              <form onSubmit={handleSubmitFeedback}>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Your feedback helps us improve..."
                  rows={4}
                  required
                />
                <div className="modal-actions">
                  <button type="button" className="pill-button" onClick={() => setShowFeedback(false)}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="pill-button primary">
                    {t.submit}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Error Report Modal */}
        {showErrorReport && (
          <div className="modal-overlay" onClick={() => setShowErrorReport(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Report Error</h3>
              <form onSubmit={handleSubmitError}>
                <textarea
                  value={errorReport}
                  onChange={(e) => setErrorReport(e.target.value)}
                  placeholder="Describe the error or issue..."
                  rows={4}
                  required
                />
                <div className="modal-actions">
                  <button type="button" className="pill-button" onClick={() => setShowErrorReport(false)}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="pill-button primary">
                    {t.submit}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Paywall Modal */}
        {showPaywall && (
          <PaywallModal 
            language={language}
            onClose={() => setShowPaywall(false)}
            onUpgrade={async () => {
              try {
                const entitlements = await revenueCatService.checkEntitlements()
                setIsPro(entitlements.isPro)
                setShowPaywall(false)
              } catch (error) {
                console.error('Failed to check entitlements after upgrade:', error)
              }
            }}
          />
        )}

        <div className="glow-bottom"></div>
      </div>
    </ErrorBoundary>
  )
}

export default App
import React, { useState, useEffect } from 'react';
import { X, Check, Star, Zap, Crown, Shield, TrendingUp, Users, Calendar, BarChart3 } from 'lucide-react';
import { getOfferings, purchasePackage } from '../../lib/revenuecat';

const PaywallModal = ({ isOpen, onClose, onPurchaseSuccess }) => {
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    if (isOpen) {
      fetchOfferings();
    }
  }, [isOpen]);

  const fetchOfferings = async () => {
    try {
      setLoading(true);
      const offerings = await getOfferings();
      setOfferings(offerings);
    } catch (error) {
      console.error('Failed to fetch offerings:', error);
      setError('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId) => {
    if (!offerings) return;
    
    try {
      setPurchasing(true);
      setError(null);
      
      const pkg = offerings.availablePackages.find(p => p.identifier === packageId);
      if (!pkg) throw new Error('Package not found');
      
      const success = await purchasePackage(pkg);
      
      if (success) {
        onPurchaseSuccess();
        onClose();
      } else {
        throw new Error('Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setError('Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const plans = {
    starter: {
      name: language === 'ja' ? 'スターター' : 'Starter',
      price: '$29',
      period: '/month',
      description: language === 'ja' ? '小規模サロンに最適' : 'Perfect for small salons',
      features: [
        language === 'ja' ? 'クライアント50名まで' : 'Up to 50 clients',
        language === 'ja' ? '基本的な予約管理' : 'Basic appointment scheduling',
        language === 'ja' ? '顧客プロフィール' : 'Client profiles',
        language === 'ja' ? 'メール通知' : 'Email notifications',
        language === 'ja' ? 'モバイルアプリ' : 'Mobile app access'
      ],
      icon: Users,
      color: '#9ec4a8',
      popular: false
    },
    professional: {
      name: language === 'ja' ? 'プロフェッショナル' : 'Professional',
      price: '$79',
      period: '/month',
      description: language === 'ja' ? '成長するビジネスのために' : 'For growing businesses',
      features: [
        language === 'ja' ? '無制限クライアント' : 'Unlimited clients',
        language === 'ja' ? 'SMS・LINE通知' : 'SMS & LINE notifications',
        language === 'ja' ? '売上分析' : 'Revenue analytics',
        language === 'ja' ? 'スタッフ管理' : 'Staff management',
        language === 'ja' ? '在庫追跡' : 'Inventory tracking',
        language === 'ja' ? '自動リマインダー' : 'Automated reminders'
      ],
      icon: TrendingUp,
      color: '#f07a6a',
      popular: true
    },
    enterprise: {
      name: language === 'ja' ? 'エンタープライズ' : 'Enterprise',
      price: '$149',
      period: '/month',
      description: language === 'ja' ? '複数店舗・高度な機能' : 'Multi-location & advanced features',
      features: [
        language === 'ja' ? '複数店舗対応' : 'Multi-location support',
        language === 'ja' ? 'API アクセス' : 'API access',
        language === 'ja' ? '高度な分析' : 'Advanced analytics',
        language === 'ja' ? '優先サポート' : 'Priority support',
        language === 'ja' ? 'カスタムレポート' : 'Custom reports',
        language === 'ja' ? 'データエクスポート' : 'Data export'
      ],
      icon: Crown,
      color: '#c9a8e0',
      popular: false
    }
  };

  const PlanCard = ({ planKey, plan, isSelected, onSelect }) => {
    const IconComponent = plan.icon;
    
    return (
      <div 
        className={`plan-card ${isSelected ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
        onClick={() => onSelect(planKey)}
      >
        {plan.popular && (
          <div className="popular-badge">
            <Star size={12} />
            <span>{language === 'ja' ? '人気' : 'Most Popular'}</span>
          </div>
        )}
        
        <div className="plan-icon" style={{ color: plan.color }}>
          <IconComponent size={24} />
        </div>
        
        <h3 className="plan-name">{plan.name}</h3>
        <p className="plan-description">{plan.description}</p>
        
        <div className="plan-price">
          <span className="price">{plan.price}</span>
          <span className="period">{plan.period}</span>
        </div>
        
        <div className="plan-features">
          {plan.features.map((feature, index) => (
            <div key={index} className="feature-item">
              <Check size={14} className="feature-check" style={{ color: plan.color }} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
        
        <button 
          className={`plan-button ${isSelected ? 'selected' : ''}`}
          style={{
            '--plan-color': plan.color,
            backgroundColor: isSelected ? `${plan.color}20` : 'transparent',
            borderColor: isSelected ? plan.color : `${plan.color}40`,
            color: isSelected ? plan.color : `${plan.color}80`
          }}
          onClick={(e) => {
            e.stopPropagation();
            handlePurchase(planKey);
          }}
          disabled={purchasing}
        >
          {purchasing && isSelected ? (
            <div className="button-spinner" />
          ) : (
            language === 'ja' ? '選択する' : 'Choose Plan'
          )}
        </button>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="paywall-overlay">
      <div className="paywall-modal">
        {/* Background Glow */}
        <div className="paywall-glow" />
        
        {/* Header */}
        <div className="paywall-header">
          <div>
            <h2 className="paywall-title">
              {language === 'ja' ? 'BeautySync Pro にアップグレード' : 'Upgrade to BeautySync Pro'}
            </h2>
            <p className="paywall-subtitle">
              {language === 'ja' ? 'サロンの可能性を最大化。あなたのビジネスが輝く時。' : 'Maximize your salon\'s potential. Transform your business.'}
            </p>
          </div>
          
          <div className="paywall-controls">
            <button 
              className="language-toggle"
              onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}
            >
              {language === 'ja' ? 'EN' : 'JA'}
            </button>
            <button className="close-button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="paywall-loading">
            <div className="loading-spinner" />
            <p>{language === 'ja' ? 'プランを読み込み中...' : 'Loading plans...'}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="paywall-error">
            <p>{error}</p>
            <button onClick={fetchOfferings} className="retry-button">
              {language === 'ja' ? 'リトライ' : 'Retry'}
            </button>
          </div>
        )}

        {/* Plans */}
        {!loading && !error && (
          <div className="paywall-content">
            <div className="plans-grid">
              {Object.entries(plans).map(([key, plan]) => (
                <PlanCard
                  key={key}
                  planKey={key}
                  plan={plan}
                  isSelected={selectedPlan === key}
                  onSelect={setSelectedPlan}
                />
              ))}
            </div>

            {/* Features Highlight */}
            <div className="features-highlight">
              <h4 className="features-title">
                {language === 'ja' ? 'すべてのプランに含まれる機能' : 'Included in all plans'}
              </h4>
              <div className="features-grid">
                <div className="feature-highlight">
                  <Shield size={20} />
                  <span>{language === 'ja' ? 'セキュアなデータ保護' : 'Secure data protection'}</span>
                </div>
                <div className="feature-highlight">
                  <Calendar size={20} />
                  <span>{language === 'ja' ? '24/7 システム稼働' : '24/7 system uptime'}</span>
                </div>
                <div className="feature-highlight">
                  <BarChart3 size={20} />
                  <span>{language === 'ja' ? 'リアルタイム同期' : 'Real-time sync'}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="paywall-footer">
              <p className="footer-text">
                {language === 'ja' 
                  ? 'いつでもキャンセル可能。最初の7日間は無料でお試し。' 
                  : 'Cancel anytime. 7-day free trial included.'}
              </p>
              <div className="footer-links">
                <a href="#" className="footer-link">{language === 'ja' ? '利用規約' : 'Terms of Service'}</a>
                <span>•</span>
                <a href="#" className="footer-link">{language === 'ja' ? 'プライバシー' : 'Privacy Policy'}</a>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .paywall-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(11, 11, 15, 0.95);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
          animation: fadeIn 0.3s ease;
        }

        .paywall-modal {
          position: relative;
          background: rgba(11, 11, 15, 0.98);
          border: 0.5px solid rgba(240, 122, 106, 0.18);
          border-radius: 24px;
          max-width: 1000px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 48px;
          animation: slideUp 0.4s ease;
        }

        .paywall-glow {
          position: absolute;
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          width: 500px;
          height: 500px;
          background: radial-gradient(ellipse, rgba(240, 122, 106, 0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .paywall-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 48px;
        }

        .paywall-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 42px;
          font-weight: 300;
          letter-spacing: -0.02em;
          margin: 0;
          background: linear-gradient(135deg, rgba(245, 240, 250, 0.92), rgba(240, 122, 106, 0.8));
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .paywall-subtitle {
          font-family: 'Zen Kaku Gothic New', sans-serif;
          font-size: 16px;
          color: rgba(245, 240, 250, 0.45);
          margin: 12px 0 0 0;
          font-style: italic;
          max-width: 500px;
        }

        .paywall-controls {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .language-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(158, 196, 168, 0.1);
          border: 0.5px solid rgba(158, 196, 168, 0.3);
          border-radius: 50%;
          color: #9ec4a8;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.2s;
        }

        .language-toggle:hover {
          background: rgba(158, 196, 168, 0.18);
          border-color: rgba(158, 196, 168, 0.6);
          transform: scale(1.05);
        }

        .close-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(245, 240, 250, 0.05);
          border: 0.5px solid rgba(245, 240, 250, 0.15);
          border-radius: 50%;
          color: rgba(245, 240, 250, 0.45);
          cursor: pointer;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: rgba(245, 240, 250, 0.1);
          border-color: rgba(245, 240, 250, 0.3);
          color: rgba(245, 240, 250, 0.8);
        }

        .paywall-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
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

        .paywall-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          gap: 24px;
          color: rgba(245, 240, 250, 0.45);
        }

        .retry-button {
          background: rgba(240, 122, 106, 0.1);
          border: 0.5px solid rgba(240, 122, 106, 0.35);
          border-radius: 40px;
          padding: 12px 24px;
          color: #f07a6a;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }

        .retry-button:hover {
          background: rgba(240, 122, 106, 0.18);
          border-color: rgba(240, 122, 106, 0.6);
          transform: translateY(-1px);
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .plan-card {
          background: rgba(240, 122, 106, 0.02);
          border: 0.5px solid rgba(240, 122, 106, 0.15);
          border-radius: 16px;
          padding: 32px 24px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }

        .plan-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom, transparent, var(--plan-color, #f07a6a), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .plan-card:hover::before,
        .plan-card.selected::before {
          opacity: 0.6;
        }

        .plan-card:hover {
          background: rgba(240, 122, 106, 0.04);
          border-color: rgba(240, 122, 106, 0.25);
          transform: translateY(-2px);
        }

        .plan-card.selected {
          background: rgba(240, 122, 106, 0.06);
          border-color: rgba(240, 122, 106, 0.35);
        }

        .plan-card.popular {
          border-color: rgba(240, 122, 106, 0.4);
          background: rgba(240, 122, 106, 0.04);
        }

        .popular-badge {
          position: absolute;
          top: -1px;
          right: 24px;
          background: linear-gradient(135deg, #f07a6a, #ff9a8a);
          color: white;
          padding: 6px 14px;
          border-radius: 0 0 8px 8px;
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .plan-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(240, 122, 106, 0.08);
          border-radius: 50%;
          margin-bottom: 24px;
        }

        .plan-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 300;
          margin: 0 0 8px 0;
          color: rgba(245, 240, 250, 0.92);
        }

        .plan-description {
          font-size: 14px;
          color: rgba(245, 240, 250, 0.45);
          margin: 0 0 24px 0;
          line-height: 1.5;
        }

        .plan-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 32px;
        }

        .price {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 300;
          color: rgba(245, 240, 250, 0.92);
        }

        .period {
          font-size: 14px;
          color: rgba(245, 240, 250, 0.45);
        }

        .plan-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: rgba(245, 240, 250, 0.92);
        }

        .feature-check {
          flex-shrink: 0;
        }

        .plan-button {
          width: 100%;
          background: rgba(240, 122, 106, 0.1);
          border: 0.5px solid rgba(240, 122, 106, 0.35);
          border-radius: 40px;
          padding: 14px 24px;
          color: #f07a6a;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .plan-button:hover {
          background: rgba(240, 122, 106, 0.18);
          border-color: rgba(240, 122, 106, 0.6);
          transform: translateY(-1px);
        }

        .plan-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .button-spinner {
          width: 16px;
          height: 16px;
          border: 1px solid rgba(240, 122, 106, 0.3);
          border-top: 1px solid #f07a6a;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        .features-highlight {
          background: rgba(158, 196, 168, 0.04);
          border: 0.5px solid rgba(158, 196, 168, 0.18);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 32px;
        }

        .features-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 300;
          margin: 0 0 24px 0;
          color: rgba(245, 240, 250, 0.92);
          text-align: center;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .feature-highlight {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: rgba(245, 240, 250, 0.92);
        }

        .feature-highlight svg {
          color: #9ec4a8;
        }

        .paywall-footer {
          text-align: center;
          border-top: 0.5px solid rgba(245, 240, 250, 0.1);
          padding-top: 24px;
        }

        .footer-text {
          font-size: 14px;
          color: rgba(245, 240, 250, 0.45);
          margin: 0 0 16px 0;
        }

        .footer-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .footer-link {
          color: rgba(240, 122, 106, 0.7);
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-link:hover {
          color: #f07a6a;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .paywall-modal {
            padding: 32px 24px;
            margin: 16px;
          }

          .paywall-header {
            flex-direction: column;
            gap: 24px;
            align-items: flex-start;
          }

          .paywall-controls {
            align-self: flex-end;
          }

          .paywall-title {
            font-size: 32px;
          }

          .plans-grid {
            grid-template-columns: 1fr;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .footer-links {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default PaywallModal;
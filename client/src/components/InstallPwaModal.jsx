import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Apple, 
  CheckCircle2, 
  X, 
  ExternalLink,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { 
  canPromptInstall, 
  promptPwaInstall, 
  isStandaloneApp, 
  isIOS, 
  isAndroid, 
  subscribePwaState 
} from '../pwaManager';

export default function InstallPwaModal({ onClose }) {
  const [canPrompt, setCanPrompt] = useState(canPromptInstall());
  const [isInstalled, setIsInstalled] = useState(isStandaloneApp());
  const [installing, setInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Default active tab based on detected platform
  const [activeTab, setActiveTab] = useState(() => {
    if (isIOS()) return 'ios';
    if (isAndroid()) return 'android';
    return 'desktop';
  });

  useEffect(() => {
    const unsubscribe = subscribePwaState((data) => {
      if (data.type === 'prompt_ready') {
        setCanPrompt(true);
      } else if (data.type === 'installed') {
        setIsInstalled(true);
        setInstallSuccess(true);
      } else if (data.type === 'choice' && data.outcome === 'accepted') {
        setInstallSuccess(true);
      }
    });
    return unsubscribe;
  }, []);

  const handleInstallClick = async () => {
    if (!canPrompt) return;
    setInstalling(true);
    try {
      const res = await promptPwaInstall();
      if (res.outcome === 'accepted') {
        setInstallSuccess(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInstalling(false);
      setCanPrompt(canPromptInstall());
    }
  };

  return (
    <div className="modal-overlay modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-card modal-content pwa-install-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)',
                padding: '6px'
              }}
            >
              <img 
                src="/icon.svg" 
                alt="App Icon" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  অ্যাপ ইনস্টল
                </h3>
                <span className="badge badge-indigo" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                  PWA App
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                ডিভাইসে সরাসরি ইনস্টল করে ব্যবহার করুন।
              </p>
            </div>
          </div>
          <button 
            className="icon-btn-ghost" 
            onClick={onClose}
            style={{ borderRadius: '50%', padding: '8px' }}
            title="বন্ধ"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px 24px', maxHeight: '78vh', overflowY: 'auto' }}>
          
          {/* Status Alert if Already Installed or Just Installed */}
          {isInstalled || installSuccess ? (
            <div 
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}
            >
              <CheckCircle2 size={28} color="#10b981" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.96rem' }}>
                  অ্যাপটি সফলভাবে ইনস্টল করা আছে!
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  হোম স্ক্রিন থেকে সরাসরি ব্যবহার করতে পারবেন।
                </div>
              </div>
            </div>
          ) : (
            /* Fast Install Action Card (If Chromium one-click prompt is ready) */
            canPrompt && (
              <div 
                style={{
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  borderRadius: '18px',
                  padding: '18px',
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={20} color="#818cf8" />
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#c7d2fe' }}>
                    ইনস্টল উপলব্ধ
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  নিচের বাটনে ক্লিক করে ইনস্টল করুন।
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleInstallClick}
                  disabled={installing}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: '14px',
                    boxShadow: '0 6px 18px rgba(79, 70, 229, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  <Download size={18} />
                  {installing ? 'ইনস্টল হচ্ছে...' : '📥 ইনস্টল করুন'}
                </button>
              </div>
            )
          )}

          {/* Value Props / Features Grid */}
          <div 
            className="pwa-features-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))',
              gap: '10px',
              marginBottom: '22px'
            }}
          >
            <div 
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '12px',
                textAlign: 'center'
              }}
            >
              <Zap size={22} color="#fbbf24" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ফুল-স্ক্রিন মোড
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                ব্রাউজার ইউআরএল বার মুক্ত
              </div>
            </div>

            <div 
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '12px',
                textAlign: 'center'
              }}
            >
              <ShieldCheck size={22} color="#10b981" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ১-ক্লিক অ্যাক্সেস
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                মোবাইল ও পিসির ডেস্কে
              </div>
            </div>

            <div 
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '12px',
                textAlign: 'center'
              }}
            >
              <Smartphone size={22} color="#818cf8" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ক্যাশ কাউন্টার
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                দ্রুত বারকোড ও সেলস
              </div>
            </div>
          </div>

          {/* Platform Instructions Selector */}
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              ইনস্টল করার নিয়ম:
            </div>
            
            <div 
              style={{
                display: 'flex',
                background: 'var(--bg-main)',
                padding: '4px',
                borderRadius: '14px',
                border: '1px solid var(--border-color)',
                marginBottom: '16px'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                style={{
                  flex: 1,
                  padding: '9px 10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'android' ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === 'android' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'android' ? 700 : 500,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                <Smartphone size={15} /> অ্যান্ড্রয়েড
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('desktop')}
                style={{
                  flex: 1,
                  padding: '9px 10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'desktop' ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === 'desktop' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'desktop' ? 700 : 500,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                <Monitor size={15} /> পিসি / ডেস্কটপ
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                style={{
                  flex: 1,
                  padding: '9px 10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'ios' ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === 'ios' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'ios' ? 700 : 500,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                <Apple size={15} /> আইফোন (iOS)
              </button>
            </div>

            {/* Instruction Tab Contents */}
            <div 
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '16px 18px',
                fontSize: '0.86rem',
                color: 'var(--text-primary)',
                lineHeight: 1.6
              }}
            >
              {activeTab === 'android' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div className="step-badge">১</div>
                    <div>
                      ক্রোম (Google Chrome) ব্রাউজারের উপরে ডানকোণে থাকা <strong>তিনটি ডট (⋮)</strong> মেনুতে চাপ দিন।
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div className="step-badge">২</div>
                    <div>
                      মেনু থেকে <strong>"Install app"</strong> বা <strong>"Add to Home screen"</strong> (হোম স্ক্রিনে যোগ করুন) অপশনটিতে চাপ দিন।
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div className="step-badge">৩</div>
                    <div>
                      কনফার্মেশন ডায়লগে <strong>"Install"</strong> বাটনে ট্যাপ করুন। কয়েক সেকেন্ডের মধ্যে আপনার ফোনে অ্যাপটি ইনস্টল হয়ে যাবে!
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'desktop' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div className="step-badge">১</div>
                    <div>
                      Chrome বা Microsoft Edge ব্রাউজারের উপরে এড্রেস বারের (URL bar) ডানপাশে একটি <strong>কম্পিউটার বা প্লাস আইকন (🖥️ বা ⊕)</strong> দেখতে পাবেন।
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div className="step-badge">২</div>
                    <div>
                      উক্ত আইকনে ক্লিক করে <strong>"Install Mijan CRM"</strong> চাপুন (অথবা ওপরের 'সরাসরি ইনস্টল করুন' বাটনে চাপুন)।
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div className="step-badge">৩</div>
                    <div>
                      ইনস্টল সম্পন্ন হলে অ্যাপটি আপনার Windows Desktop, Start Menu ও Taskbar-এ একটি পূর্ণাঙ্গ সফটওয়্যার উইন্ডো হিসেবে যুক্ত হবে!
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ios' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div className="step-badge">১</div>
                    <div>
                      Safari ব্রাউজারে অ্যাপটি খুলে নিচে থাকা <strong>Share (শেয়ার 📤)</strong> আইকনে চাপ দিন।
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div className="step-badge">২</div>
                    <div>
                      নিচে স্ক্রল করে <strong>"Add to Home Screen"</strong> (হোম স্ক্রিনে যোগ করুন ➕) নির্বাচন করুন।
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div className="step-badge">৩</div>
                    <div>
                      উপরে ডানকোণে থাকা <strong>"Add"</strong> বাটনে চাপ দিন। আপনার আইফোনের স্ক্রিনে 'মিজান CRM' অ্যাপ আইকন চলে আসবে।
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div 
          className="modal-footer" 
          style={{ 
            padding: '14px 24px', 
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            মিজান কম্পিউটার অ্যান্ড কসমেটিকস • অফিশিয়াল PWA
          </div>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{ borderRadius: '10px', padding: '8px 16px', fontSize: '0.86rem' }}
          >
            বন্ধ
          </button>
        </div>
      </div>
    </div>
  );
}

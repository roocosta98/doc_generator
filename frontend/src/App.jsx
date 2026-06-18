import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Home from './pages/Home';
import Templates from './pages/Templates';
import Documents from './pages/Documents';
import LandingPage from './pages/LandingPage';
import UserList from './pages/UserList';
import Auth from './pages/Auth';
import TermsOfUse from './pages/TermsOfUse';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Settings from './pages/Settings';
import Clauses from './pages/Clauses';
import { Sparkles, Home as HomeIcon, FileText, FileCheck, LogOut, User, Users, Settings as SettingsIcon, AlignLeft } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'templates', 'documents', ou 'users'
  const [preSelectedTemplateId, setPreSelectedTemplateId] = useState('');
  const [autoOpenGenerateModal, setAutoOpenGenerateModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('client');
  const [isInitializing, setIsInitializing] = useState(true);

  // Estados Globais de Modais Legais
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (error) throw error;
      if (data) {
        setUserRole(data.role);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar role do usuário:', err);
      setUserRole('client');
    }
  };

  // Escutar estado de autenticação no Mount
  useEffect(() => {
    // 1. Obter a sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchUserRole(u.id).finally(() => setIsInitializing(false));
      } else {
        setIsInitializing(false);
      }
    });

    // 2. Ouvir mudanças no estado do Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchUserRole(u.id);
      } else {
        setUserRole('client');
      }
      setIsInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Deseja realmente sair da plataforma?')) {
      await supabase.auth.signOut();
      setUser(null);
    }
  };

  // Carregador inicial durante verificação de cookies/sessão
  if (isInitializing) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-secondary)',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--bg-card-border)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <span>Inicializando ambiente de segurança...</span>
      </div>
    );
  }

  // Se não houver usuário logado, exibe a Landing Page ou Auth
  if (!user) {
    if (!showLogin) {
      return (
        <>
          <LandingPage 
            onGetStarted={() => setShowLogin(true)} 
            onShowTerms={() => setShowTerms(true)}
            onShowPrivacy={() => setShowPrivacy(true)}
          />
          {showTerms && <TermsOfUse onClose={() => setShowTerms(false)} />}
          {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
        </>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header className="navbar">
          <div className="navbar-container" style={{ justifyContent: 'space-between' }}>
            <div className="brand" style={{ fontSize: '24px', cursor: 'pointer' }} onClick={() => setShowLogin(false)}>
              <Sparkles size={26} color="var(--primary)" style={{ strokeWidth: 2.5 }} />
              <span>DocGenerator</span>
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px' }}
              onClick={() => setShowLogin(false)}
            >
              Voltar ao Início
            </button>
          </div>
        </header>
        <main style={{ flex: 1 }}>
          <Auth onAuthSuccess={(u) => setUser(u)} />
        </main>
        <footer style={{ borderTop: '1px solid var(--bg-card-border)', padding: '24px 20px', textAlign: 'center', backgroundColor: 'rgba(11, 15, 25, 0.4)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} DocGenerator Platform.
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '12px',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            flexWrap: 'wrap'
          }}>
            <span>Desenvolvido com</span>
            <span style={{
              display: 'inline-block',
              color: '#ef4444',
              animation: 'pulseHeart 1.2s infinite ease-in-out',
              fontSize: '14px',
              userSelect: 'none'
            }}>❤️</span>
            <span>por <strong style={{ color: '#fff', fontWeight: '700' }}>Rodrigo da Costa Tagashira</strong></span>
            <span>com todos os poderes do</span>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: '3px 8px',
              borderRadius: '10px',
              color: 'var(--primary)',
              fontWeight: '700',
              fontSize: '11px',
              animation: 'antigravityFloat 3s ease-in-out infinite',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)',
              userSelect: 'none'
            }}
            title="Defying gravity with Antigravity AI"
            >
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'inline-block', verticalAlign: 'middle' }}
              >
                <path d="M12 2L19 9L12 16L5 9L12 2Z" fill="url(#antigravityGradAppUnauth)" stroke="var(--primary)" strokeWidth="1.5" />
                <path d="M2 17C2 17 6 21 12 21C18 21 22 17 22 17" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 14C4 14 7 17 12 17C17 17 20 14 20 14" stroke="var(--secondary)" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="antigravityGradAppUnauth" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--secondary)" />
                  </linearGradient>
                </defs>
              </svg>
              <span style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Antigravity</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Dashboard Principal (Usuário Autenticado)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navbar Premium */}
      <header className="navbar">
        <div className="navbar-container">
          <div className="brand">
            <Sparkles size={22} color="var(--primary)" style={{ strokeWidth: 2.5 }} />
            <span>DocGenerator <span style={{ fontSize: '10px', color: 'var(--secondary)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px', fontWeight: 'bold' }}>PRO</span></span>
          </div>
          
          <nav className="nav-links">
            <button 
              className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('home');
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HomeIcon size={16} />
                <span>Início</span>
              </div>
            </button>
            <button 
              className={`nav-btn ${activeTab === 'templates' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('templates');
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} />
                <span>Modelos</span>
              </div>
            </button>
            <button 
              className={`nav-btn ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('documents');
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={16} />
                <span>Documentos</span>
              </div>
            </button>
            <button 
              className={`nav-btn ${activeTab === 'clauses' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('clauses');
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlignLeft size={16} />
                <span>Cláusulas</span>
              </div>
            </button>
            <button 
              className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('settings');
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SettingsIcon size={16} />
                <span>Configurações</span>
              </div>
            </button>
            {userRole === 'admin' && (
              <button 
                className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} />
                  <span>Usuários</span>
                </div>
              </button>
            )}
          </nav>

          {/* Menu de Perfil / Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              backgroundColor: 'rgba(255,255,255,0.03)', 
              padding: '6px 12px', 
              borderRadius: '20px',
              border: '1px solid var(--bg-card-border)',
              fontSize: '13px'
            }}>
              <User size={14} color="var(--primary)" />
              <span style={{ color: 'var(--text-secondary)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </span>
            </div>
            
            <button 
              className="btn btn-secondary" 
              style={{ padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.15)' }}
              onClick={handleLogout}
              title="Sair da plataforma"
            >
              <LogOut size={14} />
              <span style={{ fontSize: '13px' }}>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <Home 
            user={user} 
            userRole={userRole} 
            setActiveTab={setActiveTab} 
            setPreSelectedTemplateId={setPreSelectedTemplateId}
            setAutoOpenGenerateModal={setAutoOpenGenerateModal}
          />
        )}
        {activeTab === 'templates' && (
          <Templates 
            onEmitTemplate={(id) => {
              setPreSelectedTemplateId(id);
              setAutoOpenGenerateModal(true);
              setActiveTab('documents');
            }} 
          />
        )}
        {activeTab === 'documents' && (
          <Documents 
            preSelectedTemplateId={preSelectedTemplateId}
            setPreSelectedTemplateId={setPreSelectedTemplateId}
            autoOpenGenerateModal={autoOpenGenerateModal}
            setAutoOpenGenerateModal={setAutoOpenGenerateModal}
          />
        )}
        {activeTab === 'settings' && <Settings user={user} />}
        {activeTab === 'clauses' && <Clauses />}
        {activeTab === 'users' && <UserList />}
      </main>

      {/* Rodapé Elegante */}
      <footer style={{ borderTop: '1px solid var(--bg-card-border)', padding: '24px 20px', textAlign: 'center', backgroundColor: 'rgba(11, 15, 25, 0.4)' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          © {new Date().getFullYear()} DocGenerator Platform. Criado com React, Node.js e Supabase.
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          margin: '12px 0 16px 0',
          color: 'var(--text-secondary)',
          fontSize: '12px',
          flexWrap: 'wrap'
        }}>
          <span>Desenvolvido com</span>
          <span style={{
            display: 'inline-block',
            color: '#ef4444',
            animation: 'pulseHeart 1.2s infinite ease-in-out',
            fontSize: '14px',
            userSelect: 'none'
          }}>❤️</span>
          <span>por <strong style={{ color: '#fff', fontWeight: '700' }}>Rodrigo da Costa Tagashira</strong></span>
          <span>com todos os poderes do</span>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '3px 8px',
            borderRadius: '10px',
            color: 'var(--primary)',
            fontWeight: '700',
            fontSize: '11px',
            animation: 'antigravityFloat 3s ease-in-out infinite',
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)',
            userSelect: 'none'
          }}
          title="Defying gravity with Antigravity AI"
          >
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'inline-block', verticalAlign: 'middle' }}
            >
              <path d="M12 2L19 9L12 16L5 9L12 2Z" fill="url(#antigravityGradAppAuth)" stroke="var(--primary)" strokeWidth="1.5" />
              <path d="M2 17C2 17 6 21 12 21C18 21 22 17 22 17" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 14C4 14 7 17 12 17C17 17 20 14 20 14" stroke="var(--secondary)" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
              <defs>
                <linearGradient id="antigravityGradAppAuth" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--secondary)" />
                </linearGradient>
              </defs>
            </svg>
            <span style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Antigravity</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '11px', marginTop: '8px' }}>
          <button 
            onClick={() => setShowTerms(true)} 
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', transition: 'color 0.2s ease', fontSize: '11px' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Termos de Uso
          </button>
          <span style={{ color: 'rgba(255,255,255,0.05)' }}>|</span>
          <button 
            onClick={() => setShowPrivacy(true)} 
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', transition: 'color 0.2s ease', fontSize: '11px' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Política de Privacidade
          </button>
        </div>
      </footer>

      {/* Renderização de Modais Legais em Overlays de Alta Fidelidade */}
      {showTerms && (
        <TermsOfUse onClose={() => setShowTerms(false)} />
      )}
      {showPrivacy && (
        <PrivacyPolicy onClose={() => setShowPrivacy(false)} />
      )}
    </div>
  );
}

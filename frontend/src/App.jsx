import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import CreateTemplate from './pages/CreateTemplate';
import GenerateDocument from './pages/GenerateDocument';
import DocumentList from './pages/DocumentList';
import UserList from './pages/UserList';
import Auth from './pages/Auth';
import { Sparkles, FilePlus, FileCheck, History, LogOut, User, Users } from 'lucide-react';

const supabase = createClient(
  'https://raxmdrunbidfmlvsldnj.supabase.co',
  'sb_publishable_L-ktxwLir7iUTMCVF1Gaew_bI0kYbKT'
);

export default function App() {
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'generate', 'history', ou 'users'
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('client');
  const [isInitializing, setIsInitializing] = useState(true);

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

  // Se não houver usuário logado, exibe apenas a tela de Auth
  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header className="navbar">
          <div className="navbar-container" style={{ justifyContent: 'center' }}>
            <div className="brand" style={{ fontSize: '24px' }}>
              <Sparkles size={26} color="var(--primary)" style={{ strokeWidth: 2.5 }} />
              <span>DocGenerator</span>
            </div>
          </div>
        </header>
        <main style={{ flex: 1 }}>
          <Auth onAuthSuccess={(u) => setUser(u)} />
        </main>
        <footer style={{ borderTop: '1px solid var(--bg-card-border)', padding: '20px', textAlign: 'center', backgroundColor: 'rgba(11, 15, 25, 0.4)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} DocGenerator Platform.
          </p>
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
              className={`nav-btn ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FilePlus size={16} />
                <span>Criar Modelo</span>
              </div>
            </button>
            <button 
              className={`nav-btn ${activeTab === 'generate' ? 'active' : ''}`}
              onClick={() => setActiveTab('generate')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={16} />
                <span>Emitir Documento</span>
              </div>
            </button>
            <button 
              className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={16} />
                <span>Histórico</span>
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
        {activeTab === 'create' && <CreateTemplate />}
        {activeTab === 'generate' && <GenerateDocument />}
        {activeTab === 'history' && <DocumentList />}
        {activeTab === 'users' && <UserList />}
      </main>

      {/* Rodapé Elegante */}
      <footer style={{ borderTop: '1px solid var(--bg-card-border)', padding: '20px', textAlign: 'center', backgroundColor: 'rgba(11, 15, 25, 0.4)' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} DocGenerator Platform. Criado com React, Node.js e Supabase.
        </p>
      </footer>
    </div>
  );
}

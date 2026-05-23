import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Sparkles, Mail, Lock, UserPlus, LogIn, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import TermsOfUse from './TermsOfUse';
import PrivacyPolicy from './PrivacyPolicy';

const supabase = createClient(
  'https://raxmdrunbidfmlvsldnj.supabase.co',
  'sb_publishable_L-ktxwLir7iUTMCVF1Gaew_bI0kYbKT'
);

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true); // alternar entre login e cadastro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estados para Termos de Uso e Política de Privacidade
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Por favor, preencha todos os campos.' });
      return;
    }

    if (!isLogin && !acceptedTerms) {
      setMessage({ type: 'error', text: 'Você precisa aceitar os Termos de Uso e Política de Privacidade para continuar.' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (isLogin) {
        // Fluxo de Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) throw error;
        
        setMessage({ type: 'success', text: 'Login efetuado com sucesso! Redirecionando...' });
        if (onAuthSuccess) {
          setTimeout(() => onAuthSuccess(data.user), 1000);
        }
      } else {
        // Fluxo de Cadastro
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (error) throw error;

        // O Supabase por padrão envia e-mail de confirmação ou auto-confirma dependendo da config do console.
        if (data.session) {
          setMessage({ type: 'success', text: 'Conta criada e logada com sucesso!' });
          if (onAuthSuccess) {
            setTimeout(() => onAuthSuccess(data.user), 1000);
          }
        } else {
          setMessage({ 
            type: 'success', 
            text: 'Cadastro realizado! Por favor, verifique sua caixa de e-mail para confirmar a conta.' 
          });
        }
      }
    } catch (err) {
      console.error('❌ Erro de Auth:', err);
      setMessage({ 
        type: 'error', 
        text: err.message || 'Ocorreu um erro no processo de autenticação. Verifique os dados.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 120px)',
      padding: '24px'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        width: '100%',
        maxWidth: '440px'
      }}>
        <div className="card" style={{
          width: '100%',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}>
        {/* Detalhe de Brilho Superior */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '25%',
          right: '25%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--primary), var(--secondary), transparent)',
          filter: 'blur(1px)'
        }}></div>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--primary-glow)',
            color: 'var(--primary)',
            marginBottom: '16px'
          }}>
            <Sparkles size={24} style={{ strokeWidth: 2 }} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>
            {isLogin ? 'Bem-vindo de Volta' : 'Criar Sua Conta'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {isLogin 
              ? 'Acesse seus modelos e gerencie seus contratos dinâmicos.' 
              : 'Comece a automatizar documentos com identidade timbrada.'
            }
          </p>
        </div>

        {message.text && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: message.type === 'success' ? 'var(--success-glow)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            color: message.type === 'success' ? '#34d399' : '#f87171',
            marginBottom: '20px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            fontSize: '13px'
          }}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={12} /> Endereço de E-mail
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="exemplo@empresa.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={12} /> Senha Secreta
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {!isLogin && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '10px', 
              marginTop: '4px',
              backgroundColor: 'rgba(255,255,255,0.01)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              <input
                id="accept-terms-checkbox"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                required
                style={{ 
                  width: '18px', 
                  height: '18px', 
                  marginTop: '2px', 
                  accentColor: 'var(--primary)', 
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              />
              <label htmlFor="accept-terms-checkbox" style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', cursor: 'pointer' }}>
                Declaro que li e concordo com os{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    padding: 0, 
                    color: 'var(--primary)', 
                    textDecoration: 'underline', 
                    cursor: 'pointer', 
                    font: 'inherit', 
                    fontWeight: '700' 
                  }}
                >
                  Termos de Uso
                </button>{' '}
                e a{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    padding: 0, 
                    color: 'var(--primary)', 
                    textDecoration: 'underline', 
                    cursor: 'pointer', 
                    font: 'inherit', 
                    fontWeight: '700' 
                  }}
                >
                  Política de Privacidade
                </button>{' '}
                do DocGenerator.
              </label>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '46px', marginTop: '10px' }}
            disabled={isLoading || (!isLogin && !acceptedTerms)}
          >
            {isLoading ? (
              <>
                <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={18} /> Processando...
              </>
            ) : isLogin ? (
              <>
                <LogIn size={18} /> Entrar na Plataforma
              </>
            ) : (
              <>
                <UserPlus size={18} /> Cadastrar Nova Conta
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          borderTop: '1px solid var(--bg-card-border)',
          paddingTop: '20px',
          fontSize: '13px'
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? 'Novo por aqui?' : 'Já possui uma conta?'}
          </span>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: '700',
              marginLeft: '6px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            onClick={() => {
              setIsLogin(!isLogin);
              setAcceptedTerms(false);
              setMessage({ type: '', text: '' });
            }}
            disabled={isLoading}
          >
            {isLogin ? 'Criar uma conta' : 'Fazer login'}
          </button>
        </div>
      </div>

      {/* Credit developer signature with all the powers of Antigravity */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        color: 'var(--text-secondary)',
        fontSize: '12px',
        flexWrap: 'wrap',
        marginTop: '4px',
        animation: 'fadeIn 0.5s ease-out'
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
          gap: '5px',
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
            <path d="M12 2L19 9L12 16L5 9L12 2Z" fill="url(#antigravityGradAuth)" stroke="var(--primary)" strokeWidth="1.5" />
            <path d="M2 17C2 17 6 21 12 21C18 21 22 17 22 17" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 14C4 14 7 17 12 17C17 17 20 14 20 14" stroke="var(--secondary)" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
            <defs>
              <linearGradient id="antigravityGradAuth" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--secondary)" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Antigravity</span>
        </div>
      </div>
    </div>

      {/* Renderização de Modais Legais em Overlays de Alta Fidelidade */}
      {showTermsModal && (
        <TermsOfUse onClose={() => setShowTermsModal(false)} />
      )}
      {showPrivacyModal && (
        <PrivacyPolicy onClose={() => setShowPrivacyModal(false)} />
      )}
    </div>
  );
}

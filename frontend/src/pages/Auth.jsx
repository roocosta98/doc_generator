import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Sparkles, Mail, Lock, UserPlus, LogIn, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Por favor, preencha todos os campos.' });
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
      <div className="card" style={{
        maxWidth: '440px',
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

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '46px', marginTop: '10px' }}
            disabled={isLoading}
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
              setMessage({ type: '', text: '' });
            }}
            disabled={isLoading}
          >
            {isLogin ? 'Criar uma conta' : 'Fazer login'}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Shield, Key, Eye, EyeOff, Save, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function Settings({ user }) {
  const [zapsignToken, setZapsignToken] = useState('');
  const [zapsignEnv, setZapsignEnv] = useState('sandbox');
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('zapsign_api_token, zapsign_env')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setZapsignToken(data.zapsign_api_token || '');
        setZapsignEnv(data.zapsign_env || 'sandbox');
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setMessage({ type: 'error', text: 'Não foi possível carregar suas configurações do ZapSign.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          zapsign_api_token: zapsignToken.trim() || null,
          zapsign_env: zapsignEnv
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Configurações do ZapSign salvas com sucesso!' });
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setMessage({ type: 'error', text: err.message || 'Falha ao salvar as configurações.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--bg-card-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          marginBottom: '8px', 
          background: 'linear-gradient(135deg, #fff, #94a3b8)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent' 
        }}>
          Configurações da Conta
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Configure suas credenciais externas e integre a sua própria assinatura digital.
        </p>
      </div>

      {message.text && (
        <div style={{
          padding: '14px 16px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: message.type === 'success' ? 'var(--success-glow)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: message.type === 'success' ? '#34d399' : '#f87171',
          marginBottom: '24px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          fontSize: '13px'
        }}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="card" style={{ boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: '25%',
          right: '25%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--primary), var(--secondary), transparent)',
        }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Integração com ZapSign</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              Insira sua API Token da ZapSign para que os contratos sejam emitidos em sua própria conta.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={12} /> ZapSign API Token
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showToken ? 'text' : 'password'}
                className="input-field"
                placeholder="Ex: 5b6c2d...-4e...-....-..."
                value={zapsignToken}
                onChange={(e) => setZapsignToken(e.target.value)}
                style={{ paddingRight: '46px' }}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
              Você pode encontrar o seu token no painel do ZapSign em <strong>Configurações > API > Chave de API</strong>.
            </p>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={12} /> Ambiente do ZapSign (Env)
            </label>
            <select
              className="input-field"
              value={zapsignEnv}
              onChange={(e) => setZapsignEnv(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="sandbox">Sandbox (Ambiente de Testes Grátis)</option>
              <option value="production">Produção (Assinaturas Reais / Validade Jurídica)</option>
            </select>
          </div>

          <div style={{ 
            backgroundColor: 'rgba(99, 102, 241, 0.04)', 
            border: '1px solid rgba(99, 102, 241, 0.15)', 
            borderRadius: 'var(--radius-sm)', 
            padding: '16px', 
            fontSize: '13px', 
            color: 'var(--text-secondary)',
            lineHeight: '1.6'
          }}>
            <strong>Nota Importante:</strong> Ao cadastrar sua chave, todas as assinaturas digitais criadas pelos seus documentos utilizarão a sua conta no ZapSign. Certifique-se de escolher o ambiente adequado (Sandbox ou Produção) de acordo com o plano ativo em sua conta.
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ height: '46px', width: '100%' }}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={18} /> Salvando...
              </>
            ) : (
              <>
                <Save size={18} /> Salvar Credenciais
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

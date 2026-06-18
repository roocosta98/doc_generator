import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Sparkles, FileText, FilePlus, History, Shield, Play, Layers } from 'lucide-react';

export default function Home({ user, userRole, setActiveTab, setPreSelectedTemplateId, setAutoOpenGenerateModal }) {
  const [stats, setStats] = useState({
    templatesCount: 0,
    documentsCount: 0,
    isLoading: true
  });

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      try {
        // Obter contagem de templates
        const { count: templateCount, error: templateErr } = await supabase
          .from('templates')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Obter contagem de documentos
        const { count: docCount, error: docErr } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setStats({
          templatesCount: templateCount || 0,
          documentsCount: docCount || 0,
          isLoading: false
        });
      } catch (err) {
        console.error('Erro ao buscar estatísticas do onboarding:', err);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchStats();
  }, [user]);

  return (
    <div className="container">
      {/* Seção Hero Onboarding */}
      <div className="hero-section">
        <div className="hero-tagline">
          <Sparkles size={14} /> Bem-vindo à nova era de automação
        </div>
        <h1 style={{ 
          fontSize: '44px', 
          fontWeight: 800, 
          lineHeight: 1.2, 
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #fff 30%, #a855f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Gere Documentos Oficiais <br />
          <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            em Poucos Segundos
          </span>
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)', 
          maxWidth: '650px', 
          margin: '0 auto 32px auto',
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          Transforme contratos estáticos em formulários dinâmicos inteligentes. Desenvolva papel timbrado de alta fidelidade e emita documentos personalizados com segurança jurídica.
        </p>
      </div>

      {/* Grid de Métricas / Status */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-value">
            {stats.isLoading ? '...' : stats.templatesCount}
          </div>
          <div className="stats-label">Modelos Cadastrados</div>
        </div>
        <div className="stats-card">
          <div className="stats-value">
            {stats.isLoading ? '...' : stats.documentsCount}
          </div>
          <div className="stats-label">Documentos Emitidos</div>
        </div>
        <div className="stats-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            fontSize: '13px', 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: userRole === 'admin' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
            border: `1px solid ${userRole === 'admin' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(99, 102, 241, 0.25)'}`,
            color: userRole === 'admin' ? 'var(--success)' : 'var(--primary)',
            marginBottom: '6px'
          }}>
            {userRole}
          </div>
          <div className="stats-label">Nível de Acesso</div>
        </div>
      </div>

      {/* Como Funciona a Plataforma (Passo a Passo Interativo) */}
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '22px', textAlign: 'center', marginBottom: '32px' }}>
          Fluxo de Trabalho Inteligente
        </h2>

        <div className="feature-grid">
          {/* Card 1: Criar Modelos */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <FilePlus size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>1. Construa o Modelo</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Defina as variáveis no editor de formulário (ex: Nome, Data, Valor). Escreva o seu documento inserindo chaves reativas como <code>{`{nome_cliente}`}</code> de forma integrada.
            </p>
          </div>

          {/* Card 2: Preencher Reativo */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Layers size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>2. Formulários Dinâmicos</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Ao selecionar um modelo, o DocGenerator compila um formulário reativo baseado exclusivamente nas variáveis exigidas por ele. Preencha sem precisar reescrever o contrato inteiro.
            </p>
          </div>

          {/* Card 3: Imprimir Timbrado */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <FileText size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>3. Emissão em Alta Fidelidade</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Nosso motor de backend funde as informações no papel timbrado configurado. Visualize o documento final com suporte a tabelas e imprima ou exporte diretamente para PDF.
            </p>
          </div>
        </div>
      </div>

      {/* Ações de Inicialização / Atalhos */}
      <div className="card" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05))',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div>
          <h3 style={{ fontSize: '18px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Play size={18} color="var(--primary)" /> Pronto para começar a emitir?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Gerencie seus templates cadastrados ou emita novos contratos timbrados agora mesmo.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setActiveTab('templates')}>
            Gerenciar Templates
          </button>
          <button className="btn btn-primary" onClick={() => {
            if (setPreSelectedTemplateId) setPreSelectedTemplateId('');
            if (setAutoOpenGenerateModal) setAutoOpenGenerateModal(true);
            setActiveTab('documents');
          }}>
            Emitir Novo Documento
          </button>
        </div>
      </div>
    </div>
  );
}

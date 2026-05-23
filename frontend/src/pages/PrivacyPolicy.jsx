import React from 'react';
import { Shield, Eye, Lock, FileText, Calendar, X, Server } from 'lucide-react';

export default function PrivacyPolicy({ onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(9, 13, 22, 0.95)',
      backdropFilter: 'blur(12px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      overflowY: 'auto'
    }}>
      <div className="card" style={{
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        padding: '32px',
        animation: 'fadeInUp 0.3s ease-out'
      }}>
        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--secondary), var(--primary), transparent)'
        }}></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-secondary)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.color = '#f87171';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          }}
          title="Fechar"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            color: 'var(--secondary)',
            marginBottom: '16px'
          }}>
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
            Política de Privacidade
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <Calendar size={14} />
            <span>Última atualização: 20 de Maio de 2026</span>
          </div>
        </div>

        {/* Content */}
        <div style={{
          color: 'var(--text-secondary)',
          fontSize: '14px',
          lineHeight: '1.7',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          textAlign: 'justify'
        }}>
          <p>
            No <strong>DocGenerator</strong>, priorizamos a confidencialidade e a segurança das suas informações pessoais e dos dados contidos nos seus documentos. Esta Política de Privacidade explica detalhadamente como coletamos, processamos, armazenamos e protegemos seus dados em total conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>.
          </p>

          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={18} color="var(--secondary)" /> 1. Coleta de Dados
            </h2>
            <p>
              Coletamos apenas as informações estritamente necessárias para a operação da nossa plataforma:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>Dados de Autenticação:</strong> Endereço de e-mail e senha criptografada para identificação exclusiva e controle de acesso.</li>
              <li><strong>Dados de Modelos (Templates):</strong> Títulos, descrições, estruturas de campos de formulário e conteúdos brutos inseridos por você.</li>
              <li><strong>Histórico de Emissões:</strong> Dados preenchidos nos formulários dinâmicos e os correspondentes documentos HTML renderizados.</li>
            </ul>
          </div>

          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="var(--secondary)" /> 2. Processamento e Segurança dos Dados
            </h2>
            <p>
              A segurança dos seus dados é de suma importância. Implementamos medidas técnicas robustas:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>Criptografia em Trânsito e Repouso:</strong> Todas as comunicações com nossa API são protegidas via protocolos SSL/TLS (HTTPS), e nossos dados de banco de dados no Supabase são mantidos sob criptografia AES-256.</li>
              <li><strong>Isolamento de Dados (RLS):</strong> Empregamos regras rígidas de segurança em nível de linha (Row Level Security - RLS) para garantir que apenas você tenha acesso de leitura ou modificação nos seus templates e documentos gerados.</li>
              <li><strong>Zero Venda de Dados:</strong> O DocGenerator jamais comercializará, compartilhará ou distribuirá seus dados de formulários ou o teor dos seus contratos com terceiros.</li>
            </ul>
          </div>

          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="var(--secondary)" /> 3. Confidencialidade Absoluta das Variáveis
            </h2>
            <p>
              Qualquer informação que você digitar em um formulário para emissão (ex: CPFs, CNPJs, nomes de sócios, valores monetários) é processada temporariamente no servidor backend apenas para realizar a compilação do contrato e, se configurado, salvar a cópia no seu histórico pessoal. Nem nossos engenheiros nem subprocessadores acessam o teor de tais informações.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              4. Direitos dos Titulares de Dados (Seus Direitos)
            </h2>
            <p>
              Conforme a LGPD, você tem o direito de solicitar a qualquer momento a confirmação da existência de tratamento, o acesso aos seus dados, a correção de dados incompletos ou inexatos, e a <strong>exclusão definitiva</strong> de sua conta e histórico. Todas essas ações podem ser acionadas a partir do painel de controle ou entrando em contato com nosso time de suporte.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{
          marginTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button 
            className="btn btn-primary" 
            onClick={onClose}
            style={{ padding: '10px 24px', backgroundColor: 'var(--secondary)', borderColor: 'var(--secondary)' }}
          >
            Entendido e Aceito
          </button>
        </div>
      </div>
    </div>
  );
}

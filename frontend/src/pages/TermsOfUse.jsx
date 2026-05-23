import React from 'react';
import { ShieldCheck, BookOpen, Scale, Landmark, Calendar, X } from 'lucide-react';

export default function TermsOfUse({ onClose }) {
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
          background: 'linear-gradient(90deg, transparent, var(--primary), var(--secondary), transparent)'
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
            backgroundColor: 'var(--primary-glow)',
            color: 'var(--primary)',
            marginBottom: '16px'
          }}>
            <BookOpen size={28} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
            Termos de Uso
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
            Bem-vindo ao <strong>DocGenerator</strong>. Ao acessar nossa plataforma ou utilizar nossos serviços de automação e emissão de documentos timbrados, você concorda em cumprir e estar vinculado aos seguintes Termos de Uso. Por favor, leia-os com atenção antes de criar sua conta.
          </p>

          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={18} color="var(--primary)" /> 1. Aceitação dos Termos
            </h2>
            <p>
              Ao registrar-se na plataforma, você declara ter pelo menos 18 anos ou capacidade civil plena nos termos da legislação brasileira, e concorda expressamente com todos os termos e diretrizes aqui dispostos. O não consentimento com estes Termos de Uso impede a utilização dos nossos serviços.
            </p>
          </div>

          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Landmark size={18} color="var(--primary)" /> 2. Propriedade Intelectual e Uso Licenciado
            </h2>
            <p>
              A plataforma concede a você uma licença pessoal, revogável, não exclusiva e intransferível para criar modelos de documentos, preencher variáveis e emitir relatórios e contratos. Todo o código-fonte, layout visual, identidade visual padrão e marca DocGenerator são propriedades exclusivas da plataforma e protegidos por leis de direitos autorais.
            </p>
          </div>

          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--primary)" /> 3. Responsabilidade pelos Documentos Gerados
            </h2>
            <p>
              O DocGenerator é uma ferramenta de auxílio tecnológico para compilação automática. <strong>Não prestamos consultoria jurídica de qualquer espécie.</strong> 
            </p>
            <p style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}>
              A responsabilidade pelo teor legal, veracidade dos dados preenchidos, validade das cláusulas e adequação jurídica dos contratos emitidos é inteiramente sua. Recomendamos fortemente a revisão de qualquer modelo gerado por um profissional jurídico capacitado.
            </p>
          </div>

          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              4. Cadastro e Segurança da Conta
            </h2>
            <p>
              Você é responsável por manter a confidencialidade das credenciais de acesso da sua conta (e-mail e senha) e por todas as atividades que ocorrem sob sua conta. Notifique-nos imediatamente se suspeitar de uso não autorizado ou quebra de segurança de seus acessos.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              5. Modificações e Cancelamento
            </h2>
            <p>
              Reservamo-nos o direito de alterar estes Termos de Uso a qualquer momento para refletir melhorias técnicas ou adequações legais. Notificaremos os usuários sobre alterações significativas. O uso contínuo da plataforma após as alterações constitui aceitação tácita das modificações.
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
            style={{ padding: '10px 24px' }}
          >
            Entendido e Aceito
          </button>
        </div>
      </div>
    </div>
  );
}

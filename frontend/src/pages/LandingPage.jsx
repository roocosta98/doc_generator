import React from 'react';
import { Sparkles, FileText, Zap, Shield, FileCheck, LogIn, ArrowRight } from 'lucide-react';

export default function LandingPage({ onGetStarted, onShowTerms, onShowPrivacy }) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-main)', 
      color: '#fff', 
      fontFamily: 'var(--font-main)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Decorative Glow Circles */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Header Premium / Glassmorphic Navbar */}
      <header style={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(11, 15, 25, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        zIndex: 100,
        transition: 'all 0.3s ease'
      }}>
        <div className="navbar-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px', maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div className="brand" style={{ fontSize: '22px', fontWeight: '800' }}>
            <Sparkles size={24} color="var(--primary)" style={{ strokeWidth: 2.5 }} />
            <span>DocGenerator</span>
          </div>

          <button 
            className="btn btn-secondary"
            style={{ 
              padding: '10px 20px', 
              borderRadius: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '14px', 
              fontWeight: '700',
              borderColor: 'rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.02)'
            }}
            onClick={onGetStarted}
          >
            <LogIn size={15} /> Acessar Sistema
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ 
        position: 'relative',
        zIndex: 10,
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '80px 24px 60px 24px', 
        textAlign: 'center' 
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          color: 'var(--primary)',
          fontSize: '12px',
          fontWeight: '800',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '24px',
          animation: 'pulse 2s infinite'
        }}>
          <Sparkles size={12} /> Automação Inteligente de Contratos
        </div>

        <h1 style={{
          fontSize: '54px',
          fontWeight: '900',
          lineHeight: '1.15',
          marginBottom: '24px',
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #ffffff 40%, #c084fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          maxWidth: '900px',
          margin: '0 auto 24px auto'
        }}>
          Gere Documentos Oficiais & Contratos Timbrados <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>em Segundos</span>
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'var(--text-secondary)',
          maxWidth: '720px',
          margin: '0 auto 40px auto',
          lineHeight: '1.65'
        }}>
          Elimine o retrabalho de preencher arquivos Word manualmente. Crie templates dinâmicos, preencha apenas as variáveis em formulários reativos e emita documentos de alta fidelidade prontos para impressão ou PDF.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary"
            style={{ 
              padding: '16px 36px', 
              borderRadius: '30px', 
              fontSize: '16px', 
              fontWeight: '800', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
              transform: 'scale(1)',
              transition: 'all 0.2s ease'
            }}
            onClick={onGetStarted}
          >
            Começar Agora Grátis <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Simulated App UI Preview (WOW factor!) */}
      <section style={{ 
        position: 'relative',
        zIndex: 10,
        maxWidth: '1060px', 
        margin: '0 auto 100px auto', 
        padding: '0 24px'
      }}>
        <div style={{
          background: 'rgba(18, 24, 38, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          padding: '12px',
          overflow: 'hidden'
        }}>
          {/* Browser Window Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px 12px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308', display: 'inline-block' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.04)', 
              borderRadius: '6px', 
              fontSize: '11px', 
              color: 'rgba(255,255,255,0.3)', 
              padding: '4px 20px', 
              marginLeft: '32px',
              fontFamily: 'monospace',
              letterSpacing: '0.05em'
            }}>
              https://docgenerator.jwcosta.com.br/documents
            </div>
          </div>

          {/* Browser App Mock Body */}
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', padding: '16px 8px 8px 8px', height: '400px', overflow: 'hidden' }}>
            {/* Left Column: Mock dynamic fields */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                Variáveis Reativas
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>Nome do Locatário</label>
                <div style={{ padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', fontSize: '12px', color: 'white' }}>Gabriel da Silva</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>Valor do Aluguel (R$)</label>
                <div style={{ padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', fontSize: '12px', color: 'white' }}>2.500,00</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>Vigência (Meses)</label>
                <div style={{ padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', fontSize: '12px', color: 'white' }}>12</div>
              </div>
              <div style={{ marginTop: 'auto', padding: '12px', textAlign: 'center', backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>
                ✨ Gerar Documento Timbrado
              </div>
            </div>

            {/* Right Column: Mock generated paper preview */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
              {/* Blur simulation behind paper */}
              <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.05)', filter: 'blur(30px)' }} />
              
              {/* Paper header logo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(99,102,241,0.2)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>
                  <Sparkles size={14} /> IMOBILIÁRIA COSTA PRO
                </div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>
                  CNPJ: 12.345.678/0001-00<br />Tel: (11) 99999-9999
                </div>
              </div>

              {/* Document Text */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'rgba(255,255,255,0.8)', fontSize: '11px', lineHeight: '1.6' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'white', textAlign: 'center', marginBottom: '8px' }}>CONTRATO DE LOCAÇÃO RESIDENCIAL</div>
                <p>
                  Pelo presente instrumento, de um lado como Locador, <strong>IMOBILIÁRIA COSTA PRO</strong>, e de outro lado como Locatário, Sr(a). <strong>Gabriel da Silva</strong>, celebram o presente acordo de locação.
                </p>
                <p>
                  <strong>CLÁUSULA PRIMEIRA:</strong> O valor do aluguel mensal acordado é de <strong>R$ 2.500,00</strong>, a ser pago até o dia 10 de cada mês subsequente ao vencido.
                </p>
                <p>
                  <strong>CLÁUSULA SEGUNDA:</strong> A vigência do presente contrato de locação residencial terá a duração exata de <strong>12 meses</strong>, iniciando na data de assinatura.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section style={{ 
        position: 'relative',
        zIndex: 10,
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 24px 100px 24px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>
            Recursos Premium Criados para Alta Performance
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
            Uma plataforma de ponta para otimizar a criação e o controle de seus contratos e procurações.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px'
        }}>
          {/* Card 1 */}
          <div className="card" style={{ padding: '32px 24px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.3s ease' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifySelf: 'flex-start', justifyContent: 'center' }}>
              <FileText size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Modelos Customizáveis</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Cadastre seus contratos e insira tags reativas. Nosso parser compila campos de formulário dinâmicos a partir do seu próprio texto de forma inteligente.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card" style={{ padding: '32px 24px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.3s ease' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifySelf: 'flex-start', justifyContent: 'center' }}>
              <Zap size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Preenchimento Reativo</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Esqueça a busca por termos dentro de documentos gigantes. Preencha apenas os dados do formulário inteligente do lado esquerdo e veja o resultado de imediato.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card" style={{ padding: '32px 24px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.3s ease' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifySelf: 'flex-start', justifyContent: 'center' }}>
              <FileCheck size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Timbrado & PDF</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Motor de renderização robusto funde os dados no papel timbrado cadastrado. Visualize em alta fidelidade e envie para impressão ou exportação de PDF oficial.
            </p>
          </div>

          {/* Card 4 */}
          <div className="card" style={{ padding: '32px 24px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.3s ease' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifySelf: 'flex-start', justifyContent: 'center' }}>
              <Shield size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Segurança & Histórico</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Todos os documentos gerados ficam salvos com segurança no banco de dados. Acesse, baixe ou imprima seus contratos emitidos a qualquer momento no seu histórico.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer style={{ 
        borderTop: '1px solid rgba(255, 255, 255, 0.06)', 
        backgroundColor: 'rgba(7, 10, 18, 0.6)', 
        padding: '40px 24px', 
        textAlign: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>
          <Sparkles size={18} color="var(--primary)" />
          <span>DocGenerator</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          © {new Date().getFullYear()} DocGenerator Platform. Todos os direitos reservados.
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          margin: '16px 0',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          flexWrap: 'wrap'
        }}>
          <span>Desenvolvido com</span>
          <span style={{
            display: 'inline-block',
            color: '#ef4444',
            animation: 'pulseHeart 1.2s infinite ease-in-out',
            fontSize: '15px',
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
            padding: '4px 10px',
            borderRadius: '12px',
            color: 'var(--primary)',
            fontWeight: '700',
            fontSize: '12px',
            animation: 'antigravityFloat 3s ease-in-out infinite',
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.25)',
            userSelect: 'none'
          }}
          title="Defying gravity with Antigravity AI"
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'inline-block', verticalAlign: 'middle' }}
            >
              <path d="M12 2L19 9L12 16L5 9L12 2Z" fill="url(#antigravityGradLanding)" stroke="var(--primary)" strokeWidth="1.5" />
              <path d="M2 17C2 17 6 21 12 21C18 21 22 17 22 17" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 14C4 14 7 17 12 17C17 17 20 14 20 14" stroke="var(--secondary)" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
              <defs>
                <linearGradient id="antigravityGradLanding" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--secondary)" />
                </linearGradient>
              </defs>
            </svg>
            <span style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Antigravity</span>
          </div>
        </div>

        
        {/* Termos de Uso e Política de Privacidade Link triggers */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px', marginTop: '16px', marginBottom: '16px' }}>
          <button 
            onClick={onShowTerms} 
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-secondary)', textDecoration: 'underline', cursor: 'pointer', transition: 'color 0.2s ease', fontSize: '12px', fontWeight: '600' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            Termos de Uso
          </button>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <button 
            onClick={onShowPrivacy} 
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-secondary)', textDecoration: 'underline', cursor: 'pointer', transition: 'color 0.2s ease', fontSize: '12px', fontWeight: '600' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            Política de Privacidade
          </button>
        </div>

        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
          Construído com tecnologia de ponta para otimização de fluxos de trabalho administrativos.
        </p>
      </footer>
    </div>
  );
}

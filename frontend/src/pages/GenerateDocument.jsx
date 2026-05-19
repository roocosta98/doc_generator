import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FileDown, Printer, FileText, Send, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

// Inicializar Supabase com as credenciais do usuário
const supabase = createClient(
  'https://raxmdrunbidfmlvsldnj.supabase.co',
  'sb_publishable_L-ktxwLir7iUTMCVF1Gaew_bI0kYbKT'
);

export default function GenerateDocument() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  
  // Estados de Operação
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');
  
  // Status de Alertas
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // 1. Carregar Templates no Mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('id, title, description, category')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('❌ Erro ao buscar templates:', err);
      setStatusMessage({ 
        type: 'error', 
        text: 'Não foi possível carregar os modelos do Supabase. Verifique a tabela e o RLS.' 
      });
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // 2. Carregar campos dinâmicos quando o template for selecionado
  const handleTemplateChange = async (e) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    setFields([]);
    setFormData({});
    setGeneratedHtml('');
    
    if (!templateId) return;

    setIsLoadingFields(true);
    try {
      const { data, error } = await supabase
        .from('template_fields')
        .select('*')
        .eq('template_id', templateId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setFields(data || []);
      
      // Inicializar o objeto formData com chaves vazias
      const initialData = {};
      data.forEach(f => {
        initialData[f.key] = '';
      });
      setFormData(initialData);
    } catch (err) {
      console.error('❌ Erro ao carregar campos:', err);
      setStatusMessage({ type: 'error', text: 'Erro ao carregar as variáveis deste modelo.' });
    } finally {
      setIsLoadingFields(false);
    }
  };

  // Atualizar valores do input dinâmico
  const handleInputChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 3. Enviar ao Backend para Substituição de Chaves e Geração
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedTemplateId) return;

    setIsGenerating(true);
    setGeneratedHtml('');
    setStatusMessage({ type: '', text: '' });

    try {
      // Obter token de autenticação atual do Supabase se o usuário estiver logado
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Fazer requisição ao nosso servidor backend Express
      const response = await fetch('https://doc-generator-lrv6.onrender.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}) // Repassar sessão para garantir RLS de ponta a ponta
        },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          form_data: formData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao processar documento no backend.');
      }

      setGeneratedHtml(result.html);
      setStatusMessage({
        type: 'success',
        text: 'Documento gerado com sucesso! Veja a pré-visualização abaixo.'
      });

    } catch (err) {
      console.error('❌ Erro de geração:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Erro de conexão com o servidor backend.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 4. Ações no Documento Gerado
  const handlePrint = () => {
    const iframe = document.getElementById('doc-preview-iframe');
    if (iframe) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  const handleDownloadHtml = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `documento-gerado-${selectedTemplateId.substring(0, 6)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Agrupar templates por categoria
  const templatesByCategory = templates.reduce((acc, t) => {
    const cat = t.category || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px', background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Emissor Dinâmico de Documentos
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Preencha os campos estruturados e compile contratos timbrados instantaneamente.</p>
      </div>

      {statusMessage.text && (
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: statusMessage.type === 'success' ? 'var(--success-glow)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${statusMessage.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: statusMessage.type === 'success' ? '#34d399' : '#f87171',
          marginBottom: '24px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: generatedHtml ? '450px 1fr' : '1fr', gap: '32px', transition: 'all 0.5s ease' }}>
        
        {/* Lado Esquerdo: Seleção de Template e Formulário Reativo */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--primary)" /> Dados do Documento
          </h2>

          <div className="input-group">
            <label className="input-label">Selecione o Modelo de Template</label>
            <select
              className="input-field"
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              disabled={isLoadingTemplates}
              style={{ cursor: 'pointer' }}
            >
              <option value="">-- Escolha um modelo --</option>
              {Object.entries(templatesByCategory).map(([cat, list]) => (
                <optgroup 
                  key={cat} 
                  label={cat} 
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--primary)', fontWeight: 'bold' }}
                >
                  {list.map(t => (
                    <option key={t.id} value={t.id} style={{ color: 'white' }}>
                      {t.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {isLoadingTemplates && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Buscando do Supabase...</span>}
          </div>

          {selectedTemplateId && (
            <form onSubmit={handleGenerate} style={{ borderTop: '1px solid var(--bg-card-border)', paddingTop: '20px', marginTop: '20px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '16px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Variáveis Solicitadas pelo Modelo
              </h3>
              
              {isLoadingFields ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', padding: '20px 0' }}>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Estruturando formulário...</span>
                </div>
              ) : fields.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Este modelo não necessita de nenhuma variável personalizada. Pronto para gerar!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  {fields.map(field => (
                    <div key={field.key} className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">
                        {field.label} {field.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                      </label>
                      
                      {field.type === 'textarea' ? (
                        <textarea
                          className="input-field"
                          style={{ minHeight: '80px', resize: 'vertical' }}
                          placeholder={field.placeholder}
                          required={field.required}
                          value={formData[field.key] || ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                        />
                      ) : (
                        <input
                          type={field.type}
                          className="input-field"
                          placeholder={field.placeholder}
                          required={field.required}
                          value={formData[field.key] || ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', height: '48px' }}
                disabled={isGenerating || !selectedTemplateId}
              >
                {isGenerating ? (
                  <>
                    <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={18} /> Compilando no Backend...
                  </>
                ) : (
                  <>
                    <Send size={18} /> Gerar Documento Timbrado
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Lado Direito: Preview de Alta Fidelidade (Renderizado apenas se gerado) */}
        {generatedHtml && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bg-card-border)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="var(--secondary)" /> Visualização do Documento
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>O documento abaixo é um reflexo exato do PDF oficial gerado.</p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={handlePrint} title="Imprimir / Salvar como PDF">
                  <Printer size={16} /> Imprimir / PDF
                </button>
                <button className="btn btn-secondary" onClick={handleDownloadHtml} title="Baixar HTML">
                  <FileDown size={16} /> Baixar HTML
                </button>
              </div>
            </div>

            {/* Visualização Segura no Sandboxed Iframe */}
            <iframe
              id="doc-preview-iframe"
              className="preview-iframe"
              srcDoc={generatedHtml}
              sandbox="allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
              title="Pré-visualização do Documento"
            />
          </div>
        )}

      </div>
    </div>
  );
}

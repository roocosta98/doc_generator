import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  FileDown, Printer, FileText, Send, Loader2, Sparkles, 
  CheckCircle2, AlertCircle, Plus, Trash2, Link2, X 
} from 'lucide-react';

const supabase = createClient(
  'https://raxmdrunbidfmlvsldnj.supabase.co',
  'sb_publishable_L-ktxwLir7iUTMCVF1Gaew_bI0kYbKT'
);

const LAYOUT_TYPES = ['title', 'subtitle', 'divider'];

// Parse the JSON stored in field.placeholder safely
const parsePlaceholder = (raw) => {
  try { return JSON.parse(raw); } catch { return { real_type: null, options: [], conditional: null, placeholder_text: raw || '' }; }
};

// Evaluate if a conditional field should be shown
const evalConditional = (conditional, formData) => {
  if (!conditional || !conditional.depends_on) return true;
  const parentVal = (formData[conditional.depends_on] || '').toString().trim();
  if (conditional.operator === 'truthy') return !!parentVal;
  if (conditional.operator === '!=') return parentVal !== conditional.value;
  return parentVal === conditional.value; // '==' default
};

export default function GenerateDocument({ preSelectedTemplateId, onClose, onSuccess }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(preSelectedTemplateId || '');
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [documentTitle, setDocumentTitle] = useState('');

  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchTemplates();
    if (preSelectedTemplateId) {
      setSelectedTemplateId(preSelectedTemplateId);
      fetchFields(preSelectedTemplateId);
    }
  }, [preSelectedTemplateId]);

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');
      const { data, error } = await supabase.from('templates')
        .select('id, title, description, category')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Não foi possível carregar os modelos.' });
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const fetchFields = async (templateId) => {
    setFields([]); setFormData({});
    if (!templateId) return;
    setIsLoadingFields(true);
    try {
      const { data, error } = await supabase.from('template_fields')
        .select('*').eq('template_id', templateId).order('display_order', { ascending: true });
      if (error) throw error;
      setFields(data || []);
      const init = {};
      (data || []).forEach(f => {
        const cfg = parsePlaceholder(f.placeholder);
        const realType = cfg.real_type || f.type;
        if (realType === 'clause_adder') {
          init[f.key] = ['']; // array of clauses
        } else if (realType === 'checkbox') {
          init[f.key] = false;
        } else if (!LAYOUT_TYPES.includes(realType)) {
          init[f.key] = '';
        }
      });
      setFormData(init);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Erro ao carregar os campos do modelo.' });
    } finally {
      setIsLoadingFields(false);
    }
  };

  const handleTemplateChange = async (e) => {
    const id = e.target.value;
    setSelectedTemplateId(id);
    setGeneratedHtml('');
    const t = templates.find(t => t.id === id);
    setDocumentTitle(t ? `Cópia - ${t.title}` : '');
    await fetchFields(id);
  };

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Clause adder helpers
  const addClause = (key) => {
    setFormData(prev => ({ ...prev, [key]: [...(prev[key] || []), ''] }));
  };
  const updateClause = (key, index, value) => {
    setFormData(prev => {
      const arr = [...(prev[key] || [])];
      arr[index] = value;
      return { ...prev, [key]: arr };
    });
  };
  const removeClause = (key, index) => {
    setFormData(prev => {
      const arr = (prev[key] || []).filter((_, i) => i !== index);
      return { ...prev, [key]: arr.length ? arr : [''] };
    });
  };

  // Prepare form_data for backend — flatten clause arrays to string
  const buildFormDataPayload = () => {
    const payload = {};
    fields.forEach(field => {
      const cfg = parsePlaceholder(field.placeholder);
      const realType = cfg.real_type || field.type;
      if (LAYOUT_TYPES.includes(realType)) return;
      const val = formData[field.key];
      if (realType === 'clause_adder') {
        payload[field.key] = Array.isArray(val)
          ? val.filter(v => v.trim()).join('\n')
          : (val || '');
      } else if (realType === 'checkbox') {
        payload[field.key] = val ? 'Sim' : 'Não';
      } else {
        payload[field.key] = val || '';
      }
    });
    return payload;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedTemplateId) return;
    setIsGenerating(true);
    setGeneratedHtml('');
    setStatusMessage({ type: '', text: '' });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000' : 'https://doc-generator-lrv6.onrender.com';

      const response = await fetch(`${baseUrl}/api/documents/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          form_data: buildFormDataPayload(),
          document_title: documentTitle
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falha ao processar no backend.');

      setGeneratedHtml(result.html);
      setStatusMessage({ type: 'success', text: 'Documento gerado com sucesso!' });
      if (onSuccess) onSuccess();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro de conexão com o servidor backend.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const iframe = document.getElementById('doc-preview-iframe');
    if (iframe) { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
  };

  const handleDownloadHtml = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `documento-${selectedTemplateId?.substring(0, 6) || 'gerado'}.html`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const templatesByCategory = templates.reduce((acc, t) => {
    const cat = t.category || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  // ── Render a single dynamic field ──
  const renderField = (field) => {
    const cfg = parsePlaceholder(field.placeholder);
    const realType = cfg.real_type || field.type;
    const options = cfg.options || [];
    const placeholder = cfg.placeholder_text || '';
    const conditional = cfg.conditional;

    // Conditional visibility check
    if (conditional?.depends_on && !evalConditional(conditional, formData)) return null;

    // ── Layout types (no input, purely visual) ──
    if (realType === 'title') {
      return (
        <div key={field.key} style={{ borderBottom: '2px solid rgba(99,102,241,0.3)', paddingBottom: '6px', marginTop: '8px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '-0.01em' }}>
            {field.label}
          </h3>
        </div>
      );
    }
    if (realType === 'subtitle') {
      return (
        <div key={field.key} style={{ marginTop: '4px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {field.label}
          </p>
        </div>
      );
    }
    if (realType === 'divider') {
      return (
        <div key={field.key} style={{
          height: '1px', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)',
          margin: '4px 0'
        }} />
      );
    }

    // ── Conditional indicator ──
    const conditionalBadge = conditional?.depends_on ? (
      <span style={{ fontSize: '10px', color: '#f59e0b', marginLeft: '6px', fontWeight: '600' }}>⚡</span>
    ) : null;

    // ── Real input types ──
    return (
      <div key={field.key} className="input-group" style={{ marginBottom: 0 }}>
        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {field.label}
          {field.required && <span style={{ color: 'var(--danger)' }}>*</span>}
          {conditionalBadge}
        </label>

        {/* TEXT */}
        {realType === 'text' && (
          <input type="text" className="input-field" placeholder={placeholder}
            required={field.required} value={formData[field.key] || ''}
            onChange={(e) => handleInputChange(field.key, e.target.value)} />
        )}

        {/* TEXTAREA */}
        {realType === 'textarea' && (
          <textarea className="input-field" style={{ minHeight: '80px', resize: 'vertical' }}
            placeholder={placeholder} required={field.required} value={formData[field.key] || ''}
            onChange={(e) => handleInputChange(field.key, e.target.value)} />
        )}

        {/* WYSIWYG — rich textarea with toolbar hint */}
        {realType === 'wysiwyg' && (
          <div style={{ position: 'relative' }}>
            <textarea className="input-field" style={{ minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
              placeholder={placeholder || 'Digite o conteúdo formatado (HTML é aceito)...'}
              required={field.required} value={formData[field.key] || ''}
              onChange={(e) => handleInputChange(field.key, e.target.value)} />
            <span style={{
              position: 'absolute', top: '8px', right: '10px', fontSize: '10px',
              color: 'var(--text-muted)', backgroundColor: 'rgba(99,102,241,0.1)',
              padding: '2px 6px', borderRadius: '4px'
            }}>✨ Rich Text</span>
          </div>
        )}

        {/* LINK */}
        {realType === 'link' && (
          <div style={{ position: 'relative' }}>
            <input type="url" className="input-field" style={{ paddingLeft: '36px' }}
              placeholder={placeholder || 'https://exemplo.com'}
              required={field.required} value={formData[field.key] || ''}
              onChange={(e) => handleInputChange(field.key, e.target.value)} />
            <Link2 size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        )}

        {/* NUMBER */}
        {realType === 'number' && (
          <input type="number" className="input-field" placeholder={placeholder}
            required={field.required} value={formData[field.key] || ''}
            onChange={(e) => handleInputChange(field.key, e.target.value)} />
        )}

        {/* DATE */}
        {realType === 'date' && (
          <input type="date" className="input-field"
            required={field.required} value={formData[field.key] || ''}
            onChange={(e) => handleInputChange(field.key, e.target.value)} />
        )}

        {/* SELECT */}
        {realType === 'select' && (
          <select className="input-field" required={field.required} value={formData[field.key] || ''}
            onChange={(e) => handleInputChange(field.key, e.target.value)} style={{ cursor: 'pointer' }}>
            <option value="">— Selecione uma opção —</option>
            {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
          </select>
        )}

        {/* RADIO BUTTON — styled cards */}
        {realType === 'radio' && options.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
            {options.map((opt, i) => {
              const selected = formData[field.key] === opt;
              return (
                <label key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                  border: selected ? '1px solid var(--primary)' : '1px solid var(--bg-card-border)',
                  backgroundColor: selected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                  color: selected ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}>
                  <input type="radio" name={field.key} value={opt}
                    checked={selected} required={field.required && i === 0}
                    onChange={() => handleInputChange(field.key, opt)}
                    style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }} />
                  {opt}
                </label>
              );
            })}
          </div>
        )}

        {/* CHECKBOX — premium toggle */}
        {realType === 'checkbox' && (
          <label style={{
            display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
            padding: '12px 16px', borderRadius: '8px', fontSize: '14px',
            border: formData[field.key] ? '1px solid var(--primary)' : '1px solid var(--bg-card-border)',
            backgroundColor: formData[field.key] ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
            color: formData[field.key] ? 'var(--primary)' : 'var(--text-secondary)',
            transition: 'all 0.2s ease', userSelect: 'none'
          }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
              border: formData[field.key] ? '2px solid var(--primary)' : '2px solid rgba(255,255,255,0.15)',
              backgroundColor: formData[field.key] ? 'var(--primary)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}>
              {formData[field.key] && <span style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>✓</span>}
            </div>
            <input type="checkbox" hidden checked={!!formData[field.key]}
              onChange={(e) => handleInputChange(field.key, e.target.checked)} />
            <span style={{ fontWeight: '600' }}>{placeholder || 'Marcar como Sim'}</span>
          </label>
        )}

        {/* CLAUSE ADDER */}
        {realType === 'clause_adder' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {(formData[field.key] || ['']).map((clause, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '28px', height: '36px', flexShrink: 0, color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700'
                }}>
                  {i + 1}.
                </div>
                <textarea
                  className="input-field"
                  style={{ flex: 1, minHeight: '64px', resize: 'vertical', fontSize: '13px' }}
                  placeholder={`Cláusula ${i + 1}...`}
                  value={clause}
                  onChange={(e) => updateClause(field.key, i, e.target.value)}
                />
                <button type="button" onClick={() => removeClause(field.key, i)}
                  style={{
                    background: 'none', border: '1px solid rgba(239,68,68,0.2)',
                    color: '#f87171', borderRadius: '6px', cursor: 'pointer', padding: '6px',
                    marginTop: '2px', transition: 'all 0.15s ease',
                    display: 'flex', alignItems: 'center'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addClause(field.key)} style={{
              display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
              background: 'rgba(99,102,241,0.08)', border: '1px dashed rgba(99,102,241,0.3)',
              color: 'var(--primary)', borderRadius: '8px', cursor: 'pointer',
              padding: '8px', fontSize: '13px', fontWeight: '600', transition: 'all 0.15s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.08)'; }}
            >
              <Plus size={14} /> Adicionar Cláusula
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={onClose ? "" : "container"} style={onClose ? { padding: '24px 32px' } : {}}>
      {!onClose && (
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Emissor Dinâmico de Documentos
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Preencha os campos e compile contratos timbrados instantaneamente.</p>
        </div>
      )}

      {statusMessage.text && (
        <div style={{
          padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '24px',
          backgroundColor: statusMessage.type === 'success' ? 'var(--success-glow)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${statusMessage.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: statusMessage.type === 'success' ? '#34d399' : '#f87171',
          display: 'flex', gap: '8px', alignItems: 'center'
        }}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: generatedHtml ? '450px 1fr' : '1fr', gap: '32px', transition: 'all 0.5s ease' }}>
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--primary)" /> Dados do Documento
          </h2>

          <div className="input-group">
            <label className="input-label">Selecione o Modelo de Template</label>
            <select className="input-field" value={selectedTemplateId}
              onChange={handleTemplateChange} disabled={isLoadingTemplates} style={{ cursor: 'pointer' }}>
              <option value="">-- Escolha um modelo --</option>
              {Object.entries(templatesByCategory).map(([cat, list]) => (
                <optgroup key={cat} label={cat} style={{ backgroundColor: 'var(--bg-input)', color: 'var(--primary)', fontWeight: 'bold' }}>
                  {list.map(t => <option key={t.id} value={t.id} style={{ color: 'white' }}>{t.title}</option>)}
                </optgroup>
              ))}
            </select>
            {isLoadingTemplates && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Buscando modelos...</span>}
          </div>

          {selectedTemplateId && (
            <form onSubmit={handleGenerate} style={{ borderTop: '1px solid var(--bg-card-border)', paddingTop: '20px', marginTop: '20px' }}>
              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label className="input-label" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Nome/Título do Documento</label>
                <input type="text" className="input-field" placeholder="Ex: Contrato - João Silva"
                  required value={documentTitle} onChange={(e) => setDocumentTitle(e.target.value)} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Identifica o documento no histórico.</span>
              </div>

              <h3 style={{
                fontSize: '13px', marginBottom: '16px', color: 'white', textTransform: 'uppercase',
                letterSpacing: '0.05em', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px'
              }}>
                Variáveis Solicitadas pelo Modelo
              </h3>

              {isLoadingFields ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', padding: '20px 0' }}>
                  <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={18} />
                  <span>Estruturando formulário...</span>
                </div>
              ) : fields.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Este modelo não necessita de variáveis. Pronto para gerar!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  {fields.map(field => renderField(field)).filter(Boolean)}
                </div>
              )}

              <div style={onClose ? { display: 'flex', gap: '12px' } : {}}>
                {onClose && (
                  <button type="button" className="btn btn-secondary" style={{ flex: 1, height: '48px' }} onClick={onClose}>
                    Fechar
                  </button>
                )}
                <button type="submit" className="btn btn-primary"
                  style={{ width: onClose ? 'auto' : '100%', flex: onClose ? 2 : 'none', height: '48px' }}
                  disabled={isGenerating || !selectedTemplateId}>
                  {isGenerating ? (
                    <><Loader2 style={{ animation: 'spin 1s linear infinite' }} size={18} /> Compilando...</>
                  ) : (
                    <><Send size={18} /> Gerar Documento Timbrado</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {generatedHtml && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bg-card-border)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="var(--secondary)" /> Visualização do Documento
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>O documento abaixo é um reflexo exato do PDF oficial.</p>
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
            <iframe id="doc-preview-iframe" className="preview-iframe" srcDoc={generatedHtml}
              sandbox="allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
              title="Pré-visualização do Documento" />
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';

import { 
  Plus, Trash2, ChevronRight, ChevronLeft, Save, Sparkles, 
  FormInput, FileText, Palette, Info, Bold, Italic, List, ListOrdered, 
  Heading1, Heading2, Table as TableIcon, Columns, Rows, PlusCircle, MinusCircle, Type,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Eraser, Zap, Settings2,
  ToggleLeft, CheckSquare, Link2, ListChecks, Type as TypeIcon, Minus, ChevronDown, X
} from 'lucide-react';

const supabase = createClient(
  'https://raxmdrunbidfmlvsldnj.supabase.co',
  'sb_publishable_L-ktxwLir7iUTMCVF1Gaew_bI0kYbKT'
);

const generateSlug = (text) =>
  text.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s_]/g, '')
    .trim().replace(/\s+/g, '_');

// Mapeamento de tipo visual → tipo físico do banco
const DB_TYPE_MAP = {
  text: 'text',
  link: 'text',
  title: 'text',
  subtitle: 'text',
  divider: 'text',
  checkbox: 'text',
  radio: 'select',
  select: 'select',
  textarea: 'textarea',
  wysiwyg: 'textarea',
  clause_adder: 'textarea',
  number: 'number',
  date: 'date',
};

const LAYOUT_TYPES = ['title', 'subtitle', 'divider'];

const FIELD_TYPE_CONFIG = {
  text:         { label: 'Texto',               icon: '✏️',  color: '#6366f1', desc: 'Campo de texto simples' },
  textarea:     { label: 'Texto Grande',         icon: '📝',  color: '#8b5cf6', desc: 'Área de texto longa' },
  wysiwyg:      { label: 'Wysing (Rich Text)',   icon: '✨',  color: '#a855f7', desc: 'Editor rich text no formulário' },
  link:         { label: 'Link / URL',           icon: '🔗',  color: '#06b6d4', desc: 'Campo de URL ou hiperlink' },
  select:       { label: 'Lista Select',         icon: '📋',  color: '#10b981', desc: 'Seleção em dropdown' },
  radio:        { label: 'Radio Button',         icon: '🔘',  color: '#f59e0b', desc: 'Escolha única entre opções' },
  checkbox:     { label: 'CheckBox',             icon: '☑️',  color: '#3b82f6', desc: 'Caixa de marcação (sim/não)' },
  clause_adder: { label: 'Adicionar Cláusula',  icon: '📑',  color: '#ef4444', desc: 'Permite múltiplas entradas de texto' },
  title:        { label: 'Título (Visual)',      icon: '🅃',  color: '#64748b', desc: 'Separador de seção - Título' },
  subtitle:     { label: 'Subtítulo (Visual)',   icon: '🅂',  color: '#64748b', desc: 'Separador de seção - Subtítulo' },
  divider:      { label: 'Divisória (Visual)',   icon: '➖',  color: '#64748b', desc: 'Linha divisória entre seções' },
  number:       { label: 'Número',              icon: '🔢',  color: '#f97316', desc: 'Campo numérico' },
  date:         { label: 'Data',                icon: '📅',  color: '#ec4899', desc: 'Seletor de data' },
};

export default function CreateTemplate({ onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Geral');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  const [fields, setFields] = useState([
    { label: 'Nome do Cliente', key: 'nome_cliente', type: 'text', required: true, placeholder: JSON.stringify({ placeholder_text: 'Ex: João Silva', real_type: 'text', options: [], listType: 'ul', conditional: null }) },
    { label: 'Data de Início', key: 'data_inicio', type: 'date', required: true, placeholder: JSON.stringify({ placeholder_text: '', real_type: 'date', options: [], listType: 'ul', conditional: null }) },
  ]);

  // Form builder state
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldListType, setNewFieldListType] = useState('ul');
  const [hasConditional, setHasConditional] = useState(false);
  const [conditionalParent, setConditionalParent] = useState('');
  const [conditionalOperator, setConditionalOperator] = useState('==');
  const [conditionalValue, setConditionalValue] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Expand/edit existing field inline
  const [expandedFieldIdx, setExpandedFieldIdx] = useState(null);
  const [editingFieldData, setEditingFieldData] = useState(null);

  const [visualIdentity, setVisualIdentity] = useState({
    theme: 'classic',
    primaryColor: '#1e293b',
    headerText: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS',
    footerText: 'Este documento é sigiloso e tem validade jurídica em todo território nacional.',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/3616/3616223.png',
    margins: { top: '2.5cm', bottom: '2.5cm', left: '3.0cm', right: '2.0cm' }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
        HTMLAttributes: { style: 'border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; margin: 15px 0;' }
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: { style: 'border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; color: #1e293b; font-weight: bold; text-align: left;' }
      }),
      TableCell.configure({
        HTMLAttributes: { style: 'border: 1px solid #cbd5e1; padding: 10px; color: #334155;' }
      })
    ],
    content: `
      <h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
      <p>Pelo presente instrumento, eu, <b>{nome_cliente}</b>, aceito os termos acordados a partir da data de <b>{data_inicio}</b>.</p>
      <p>Fica eleito o foro da comarca local para dirimir quaisquer dúvidas.</p>
    `,
    onUpdate: ({ editor }) => setContent(editor.getHTML())
  });

  const handleAddField = (e) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;

    const newKey = generateSlug(newFieldLabel);
    if (fields.some(f => f.key === newKey)) {
      alert('Já existe um campo com este nome/chave gerada.');
      return;
    }

    const needsOptions = ['select', 'radio'].includes(newFieldType);
    const extraConfig = {
      real_type: newFieldType,
      options: needsOptions
        ? newFieldOptions.split(',').map(o => o.trim()).filter(Boolean)
        : [],
      listType: newFieldType === 'clause_adder' ? newFieldListType : 'ul',
      conditional: hasConditional && conditionalParent ? {
        depends_on: conditionalParent,
        operator: conditionalOperator,
        value: conditionalValue.trim()
      } : null
    };

    const dbType = DB_TYPE_MAP[newFieldType] || 'text';
    const isLayout = LAYOUT_TYPES.includes(newFieldType);

    setFields([...fields, {
      label: newFieldLabel.trim(),
      key: newKey,
      type: dbType,
      required: isLayout ? false : newFieldRequired,
      placeholder: JSON.stringify({
        placeholder_text: newFieldPlaceholder.trim(),
        ...extraConfig
      })
    }]);

    // reset
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldPlaceholder('');
    setNewFieldOptions('');
    setNewFieldListType('ul');
    setHasConditional(false);
    setConditionalParent('');
    setConditionalOperator('==');
    setConditionalValue('');
    setShowAdvanced(false);
  };

  const handleRemoveField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
    if (expandedFieldIdx === index) { setExpandedFieldIdx(null); setEditingFieldData(null); }
    else if (expandedFieldIdx > index) setExpandedFieldIdx(expandedFieldIdx - 1);
  };

  const handleExpandField = (idx) => {
    if (expandedFieldIdx === idx) { setExpandedFieldIdx(null); setEditingFieldData(null); return; }
    const field = fields[idx];
    let cfg = {};
    try { cfg = JSON.parse(field.placeholder); } catch {}
    setExpandedFieldIdx(idx);
    setEditingFieldData({
      label: field.label,
      realType: cfg.real_type || field.type,
      placeholder_text: cfg.placeholder_text || '',
      options: (cfg.options || []).join(', '),
      listType: cfg.listType || 'ul',
      required: field.required || false,
      hasConditional: !!cfg.conditional?.depends_on,
      conditionalParent: cfg.conditional?.depends_on || '',
      conditionalOperator: cfg.conditional?.operator || '==',
      conditionalValue: cfg.conditional?.value || ''
    });
  };

  const handleUpdateField = (idx) => {
    if (!editingFieldData) return;
    const f = editingFieldData;
    const needsOptions = ['select', 'radio'].includes(f.realType);
    const isLayout = LAYOUT_TYPES.includes(f.realType);
    const extraConfig = {
      real_type: f.realType,
      options: needsOptions ? f.options.split(',').map(o => o.trim()).filter(Boolean) : [],
      listType: f.realType === 'clause_adder' ? f.listType : 'ul',
      conditional: f.hasConditional && f.conditionalParent
        ? { depends_on: f.conditionalParent, operator: f.conditionalOperator, value: f.conditionalValue.trim() }
        : null
    };
    const newFields = [...fields];
    newFields[idx] = {
      ...newFields[idx],
      label: f.label.trim(),
      type: DB_TYPE_MAP[f.realType] || 'text',
      required: isLayout ? false : f.required,
      placeholder: JSON.stringify({ placeholder_text: f.placeholder_text.trim(), ...extraConfig })
    };
    setFields(newFields);
    setExpandedFieldIdx(null);
    setEditingFieldData(null);
  };

  const insertVariable = (key) => {
    if (editor) editor.chain().focus().insertContent(`{${key}}`).run();
  };

  const applyFontSize = (size) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) { alert('Selecione um texto antes de alterar o tamanho.'); return; }
    const selectedText = editor.state.doc.textBetween(from, to);
    editor.chain().focus().insertContent(`<span style="font-size: ${size};">${selectedText}</span>`).run();
  };

  const applyTextAlign = (alignment) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) { editor.chain().focus().insertContent(`<div style="text-align: ${alignment};">&nbsp;</div>`).run(); return; }
    const selectedText = editor.state.doc.textBetween(from, to);
    editor.chain().focus().insertContent(`<div style="text-align: ${alignment};">${selectedText}</div>`).run();
  };

  const applyTextColor = (color) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) { alert('Selecione um texto antes de alterar a cor.'); return; }
    const selectedText = editor.state.doc.textBetween(from, to);
    editor.chain().focus().insertContent(`<span style="color: ${color};">${selectedText}</span>`).run();
  };

  const clearFormatting = () => {
    if (!editor) return;
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  };

  const handleSaveTemplate = async () => {
    if (!title.trim()) {
      setSaveStatus({ type: 'error', message: 'Por favor, insira um título para o modelo.' });
      setCurrentStep(1); return;
    }
    const currentContent = editor ? editor.getHTML() : content;
    if (!currentContent.trim() || currentContent === '<p></p>') {
      setSaveStatus({ type: 'error', message: 'O conteúdo do contrato não pode estar vazio.' });
      setCurrentStep(2); return;
    }

    setIsLoading(true);
    setSaveStatus({ type: '', message: '' });

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Sessão expirada. Faça login novamente.');

      const { data: templateData, error: templateError } = await supabase
        .from('templates')
        .insert({ user_id: user.id, title: title.trim(), category, description: description.trim(), content: currentContent, visual_identity: visualIdentity })
        .select().single();
      if (templateError) throw templateError;

      if (fields.length > 0) {
        const fieldsPayload = fields.map((f, index) => ({
          template_id: templateData.id, label: f.label, key: f.key,
          type: f.type, required: f.required, placeholder: f.placeholder, display_order: index
        }));
        const { error: fieldsError } = await supabase.from('template_fields').insert(fieldsPayload);
        if (fieldsError) throw fieldsError;
      }

      setSaveStatus({ type: 'success', message: `Modelo "${templateData.title}" criado com ${fields.length} campos!` });
      setTitle(''); setCategory('Geral'); setDescription('');
      editor?.commands.setContent('<p></p>');
      setFields([]);
      if (onSuccess) setTimeout(() => onSuccess(), 1500);
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      setSaveStatus({ type: 'error', message: `Falha ao salvar: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: get readable label for a field
  const getFieldSemanticLabel = (field) => {
    let config;
    try { config = JSON.parse(field.placeholder); } catch { config = {}; }
    const realType = config.real_type || field.type;
    const typeInfo = FIELD_TYPE_CONFIG[realType];
    const hasConditional = config.conditional?.depends_on;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: '600', fontSize: '14px' }}>{field.label}</span>
        <span style={{
          fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
          backgroundColor: `${typeInfo?.color || '#6366f1'}18`,
          color: typeInfo?.color || '#6366f1',
          border: `1px solid ${typeInfo?.color || '#6366f1'}30`
        }}>
          {typeInfo?.icon} {typeInfo?.label || realType}
        </span>
        {LAYOUT_TYPES.includes(realType) && (
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.2)' }}>
            visual only
          </span>
        )}
        {hasConditional && (
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
            ⚡ condicional
          </span>
        )}
        {field.required && !LAYOUT_TYPES.includes(realType) && (
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', fontWeight: 'bold' }}>
            obrigatório
          </span>
        )}
      </div>
    );
  };

  // Non-layout fields for variable sidebar
  const insertableFields = fields.filter(f => {
    try { const c = JSON.parse(f.placeholder); return !LAYOUT_TYPES.includes(c.real_type || f.type); } catch { return true; }
  });

  const needsOptions = ['select', 'radio'].includes(newFieldType);
  const isLayoutType = LAYOUT_TYPES.includes(newFieldType);
  const currentTypeInfo = FIELD_TYPE_CONFIG[newFieldType];

  return (
    <div className={onClose ? "" : "container"} style={onClose ? { padding: '24px 32px' } : {}}>
      {!onClose && (
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Assistente de Criação de Modelo
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Crie formulários inteligentes e templates timbrados integrados em poucos minutos.</p>
        </div>
      )}

      {/* Steps */}
      <div className="steps-container">
        {[
          { step: 1, icon: <FormInput size={18} />, label: '1. Formulário' },
          { step: 2, icon: <FileText size={18} />, label: '2. Contrato' },
          { step: 3, icon: <Palette size={18} />, label: '3. Identidade' }
        ].map(({ step, icon, label }) => (
          <div key={step} className={`step-node ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}>
            {icon}
            <span className="step-label">{label}</span>
          </div>
        ))}
      </div>

      {saveStatus.message && (
        <div style={{
          padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '24px',
          backgroundColor: saveStatus.type === 'success' ? 'var(--success-glow)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${saveStatus.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: saveStatus.type === 'success' ? '#34d399' : '#f87171',
          display: 'flex', gap: '8px', alignItems: 'center'
        }}>
          <Info size={18} />
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* ===== STEP 1: FORM BUILDER ===== */}
      {currentStep === 1 && (
        <div className="card">
          <h2 style={{ fontSize: '20px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--primary)" /> Configurações Básicas & Campos Dinâmicos
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Defina o título do modelo e os campos que o usuário precisará preencher.
          </p>

          {/* Template meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: '20px', marginBottom: '24px' }}>
            <div className="input-group">
              <label className="input-label">Título do Modelo *</label>
              <input type="text" className="input-field" placeholder="Ex: Contrato de Prestação de Serviços de TI"
                value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Categoria *</label>
              <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} style={{ cursor: 'pointer' }}>
                {['Geral','Contrato','Procuração','Declaração','Relatório','Recibo','Outros'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Descrição Breve</label>
              <input type="text" className="input-field" placeholder="Ex: Modelo padrão para freelancers"
                value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--bg-card-border)', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Campos do Formulário</h3>

            {/* Fields list — clique para expandir e editar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {fields.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--bg-card-border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                  Nenhum campo adicionado ainda. Crie um campo abaixo!
                </div>
              ) : (
                fields.map((field, idx) => {
                  let cfg = {};
                  try { cfg = JSON.parse(field.placeholder); } catch {}
                  const realType = cfg.real_type || field.type;
                  const isLayout = LAYOUT_TYPES.includes(realType);
                  const typeInfo = FIELD_TYPE_CONFIG[realType];
                  const isExpanded = expandedFieldIdx === idx;
                  const efd = isExpanded ? editingFieldData : null;
                  const eNeedsOptions = efd ? ['select', 'radio'].includes(efd.realType) : false;
                  const eIsLayout = efd ? LAYOUT_TYPES.includes(efd.realType) : false;
                  return (
                    <div key={idx} style={{
                      borderRadius: 'var(--radius-sm)',
                      border: isExpanded
                        ? `1px solid ${typeInfo?.color || 'var(--primary)'}60`
                        : `1px solid ${isLayout ? 'rgba(100,116,139,0.2)' : 'var(--bg-card-border)'}`,
                      borderLeft: `3px solid ${typeInfo?.color || 'var(--primary)'}`,
                      backgroundColor: isExpanded
                        ? `${typeInfo?.color || '#6366f1'}08`
                        : (isLayout ? 'rgba(100,116,139,0.06)' : 'rgba(255,255,255,0.02)'),
                      overflow: 'hidden',
                      transition: 'all 0.2s ease'
                    }}>
                      {/* Header row — always visible, click to expand */}
                      <div
                        onClick={() => handleExpandField(idx)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '11px 14px', cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {getFieldSemanticLabel(field)}
                          {!isLayout && (
                            <code style={{ color: 'var(--secondary)', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                              {`{${field.key}}`}
                            </code>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px', flexShrink: 0 }}>
                          <span style={{
                            fontSize: '11px', color: isExpanded ? typeInfo?.color || 'var(--primary)' : 'var(--text-muted)',
                            transition: 'color 0.15s'
                          }}>
                            {isExpanded ? '▲ fechar' : '▼ editar'}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveField(idx); }}
                            className="btn btn-danger"
                            style={{ padding: '5px', borderRadius: '6px' }}
                            title="Remover campo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded inline editor */}
                      {isExpanded && efd && (
                        <div style={{
                          padding: '16px', borderTop: `1px solid ${typeInfo?.color || 'var(--primary)'}25`,
                          backgroundColor: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '14px'
                        }}>
                          {/* Label */}
                          <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Rótulo</label>
                            <input type="text" className="input-field" value={efd.label}
                              onChange={e => setEditingFieldData({ ...efd, label: e.target.value })} />
                          </div>

                          {/* Type selector */}
                          <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Tipo do Campo</label>
                            <select className="input-field" value={efd.realType}
                              onChange={e => setEditingFieldData({ ...efd, realType: e.target.value, options: '', hasConditional: false })}
                              style={{ cursor: 'pointer' }}>
                              <optgroup label="— Texto —">
                                <option value="text">✏️ Texto</option>
                                <option value="textarea">📝 Texto Grande</option>
                                <option value="wysiwyg">✨ Wysing</option>
                                <option value="link">🔗 Link / URL</option>
                              </optgroup>
                              <optgroup label="— Seleção —">
                                <option value="select">📋 Lista Select</option>
                                <option value="radio">🔘 Radio Button</option>
                                <option value="checkbox">☑️ CheckBox</option>
                              </optgroup>
                              <optgroup label="— Especiais —">
                                <option value="clause_adder">📑 Adição de Cláusula</option>
                                <option value="number">🔢 Número</option>
                                <option value="date">📅 Data</option>
                              </optgroup>
                              <optgroup label="— Visuais —">
                                <option value="title">🅃 Título</option>
                                <option value="subtitle">🅂 Subtítulo</option>
                                <option value="divider">➖ Divisória</option>
                              </optgroup>
                            </select>
                          </div>

                          {/* Options for select/radio */}
                          {eNeedsOptions && (
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <label className="input-label">Opções (vírgula)</label>
                              <input type="text" className="input-field" placeholder="Ex: Sim, Não, Talvez"
                                value={efd.options} onChange={e => setEditingFieldData({ ...efd, options: e.target.value })} />
                              {efd.options && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                  {efd.options.split(',').map(o => o.trim()).filter(Boolean).map((opt, i) => (
                                    <span key={i} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(99,102,241,0.12)', color: 'var(--primary)', border: '1px solid rgba(99,102,241,0.25)' }}>{opt}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* List type for clause_adder */}
                          {efd.realType === 'clause_adder' && (
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <label className="input-label">Formato da Lista</label>
                              <select className="input-field" value={efd.listType}
                                onChange={e => setEditingFieldData({ ...efd, listType: e.target.value })} style={{ cursor: 'pointer' }}>
                                <option value="ul">• Marcadores (ul)</option>
                                <option value="ol">1. Numerada (ol)</option>
                                <option value="p">Parágrafo (p)</option>
                              </select>
                            </div>
                          )}

                          {/* Placeholder + Required */}
                          {!eIsLayout && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
                              <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Placeholder (Dica)</label>
                                <input type="text" className="input-field" placeholder="Ex: Razão Social"
                                  value={efd.placeholder_text} onChange={e => setEditingFieldData({ ...efd, placeholder_text: e.target.value })} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingBottom: '4px' }}>
                                <label className="input-label" style={{ marginBottom: 0 }}>Obrig.?</label>
                                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <input type="checkbox" checked={efd.required}
                                    onChange={e => setEditingFieldData({ ...efd, required: e.target.checked })}
                                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                                  <span style={{ fontSize: '12px' }}>Sim</span>
                                </label>
                              </div>
                            </div>
                          )}

                          {/* Conditional toggle */}
                          {!eIsLayout && (
                            <div>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                                <input type="checkbox" checked={efd.hasConditional}
                                  onChange={e => setEditingFieldData({ ...efd, hasConditional: e.target.checked, conditionalParent: '', conditionalValue: '' })}
                                  style={{ width: '15px', height: '15px', accentColor: '#f59e0b' }} />
                                <span style={{ fontSize: '12px', fontWeight: '600', color: efd.hasConditional ? '#f59e0b' : 'var(--text-secondary)' }}>⚡ Lógica Condicional</span>
                              </label>
                              {efd.hasConditional && (
                                <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'end' }}>
                                  <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Campo Pai</label>
                                    <select className="input-field" value={efd.conditionalParent}
                                      onChange={e => setEditingFieldData({ ...efd, conditionalParent: e.target.value })} style={{ cursor: 'pointer' }}>
                                      <option value="">— Selecione —</option>
                                      {fields.filter((f, i) => i !== idx).filter(f => { try { const c = JSON.parse(f.placeholder); return !LAYOUT_TYPES.includes(c.real_type || f.type); } catch { return true; } }).map(f => (
                                        <option key={f.key} value={f.key}>{f.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Op.</label>
                                    <select className="input-field" value={efd.conditionalOperator}
                                      onChange={e => setEditingFieldData({ ...efd, conditionalOperator: e.target.value })} style={{ cursor: 'pointer', width: '80px' }}>
                                      <option value="==">==</option>
                                      <option value="!=">!=</option>
                                      <option value="truthy">existe</option>
                                    </select>
                                  </div>
                                  <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Valor</label>
                                    <input type="text" className="input-field" placeholder="Ex: Sim"
                                      value={efd.conditionalValue} onChange={e => setEditingFieldData({ ...efd, conditionalValue: e.target.value })} />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                            <button type="button" className="btn btn-secondary"
                              style={{ padding: '8px 16px', fontSize: '13px' }}
                              onClick={() => { setExpandedFieldIdx(null); setEditingFieldData(null); }}>
                              Cancelar
                            </button>
                            <button type="button" className="btn btn-primary"
                              style={{ padding: '8px 20px', fontSize: '13px', backgroundColor: typeInfo?.color, borderColor: typeInfo?.color }}
                              onClick={() => handleUpdateField(idx)}>
                              ✓ Atualizar Campo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Field Form */}
            <form onSubmit={handleAddField} style={{
              backgroundColor: 'rgba(99,102,241,0.04)', padding: '20px', borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(99,102,241,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Settings2 size={16} color="var(--primary)" />
                <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Adicionar Novo Campo
                </span>
              </div>

              {/* Row 1: Label + Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Rótulo / Label *</label>
                  <input type="text" className="input-field" placeholder="Ex: Nome da Empresa"
                    value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Tipo do Campo</label>
                  <select className="input-field" value={newFieldType}
                    onChange={(e) => { setNewFieldType(e.target.value); setShowAdvanced(false); }}
                    style={{ cursor: 'pointer' }}>
                    <optgroup label="— Campos de Texto —">
                      <option value="text">✏️ Texto</option>
                      <option value="textarea">📝 Texto Grande</option>
                      <option value="wysiwyg">✨ Wysing (Rich Text)</option>
                      <option value="link">🔗 Link / URL</option>
                    </optgroup>
                    <optgroup label="— Campos de Seleção —">
                      <option value="select">📋 Lista Select</option>
                      <option value="radio">🔘 Radio Button</option>
                      <option value="checkbox">☑️ CheckBox</option>
                    </optgroup>
                    <optgroup label="— Campos Especiais —">
                      <option value="clause_adder">📑 Campo de Adição de Cláusula</option>
                      <option value="number">🔢 Número</option>
                      <option value="date">📅 Data</option>
                    </optgroup>
                    <optgroup label="— Elementos Visuais (sem variável) —">
                      <option value="title">🅃 Título</option>
                      <option value="subtitle">🅂 Subtítulo</option>
                      <option value="divider">➖ Divisória</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Type indicator */}
              {currentTypeInfo && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)', marginBottom: '16px',
                  backgroundColor: `${currentTypeInfo.color}10`,
                  border: `1px solid ${currentTypeInfo.color}25`
                }}>
                  <span style={{ fontSize: '16px' }}>{currentTypeInfo.icon}</span>
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '12px', color: currentTypeInfo.color }}>{currentTypeInfo.label}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '6px' }}>— {currentTypeInfo.desc}</span>
                  </div>
                  {isLayoutType && (
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                      Não gera variável no documento
                    </span>
                  )}
                </div>
              )}

              {/* Options (select / radio) */}
              {needsOptions && (
                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label className="input-label">
                    Opções <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(separadas por vírgula)</span>
                  </label>
                  <input type="text" className="input-field"
                    placeholder="Ex: Sim, Não, Talvez  /  Pessoa Física, Pessoa Jurídica"
                    value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)} />
                  {newFieldOptions && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {newFieldOptions.split(',').map(o => o.trim()).filter(Boolean).map((opt, i) => (
                        <span key={i} style={{
                          fontSize: '12px', padding: '3px 10px', borderRadius: '12px',
                          backgroundColor: 'rgba(99,102,241,0.12)', color: 'var(--primary)',
                          border: '1px solid rgba(99,102,241,0.25)'
                        }}>{opt}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* List type (clause_adder) */}
              {newFieldType === 'clause_adder' && (
                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label className="input-label">Formato de Lista das Cláusulas</label>
                  <select className="input-field" value={newFieldListType}
                    onChange={(e) => setNewFieldListType(e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="ul">• Lista com Marcadores (ul)</option>
                    <option value="ol">1. Lista Numerada (ol)</option>
                    <option value="p">Parágrafo por Cláusula (p)</option>
                  </select>
                </div>
              )}

              {/* Placeholder + Required row (non-layout) */}
              {!isLayoutType && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginBottom: '16px', alignItems: 'end' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Placeholder (Dica)</label>
                    <input type="text" className="input-field" placeholder="Ex: Razão Social Completa"
                      value={newFieldPlaceholder} onChange={(e) => setNewFieldPlaceholder(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', paddingBottom: '4px' }}>
                    <label className="input-label" style={{ marginBottom: 0, textAlign: 'center' }}>Obrig.?</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                      <span style={{ fontSize: '13px' }}>Sim</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Conditional Logic Toggle */}
              {!isLayoutType && (
                <div style={{ marginBottom: '16px' }}>
                  <button type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: showAdvanced ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)',
                      border: showAdvanced ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--bg-card-border)',
                      color: showAdvanced ? '#f59e0b' : 'var(--text-secondary)',
                      padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                      fontWeight: '600', transition: 'all 0.2s ease'
                    }}>
                    <Zap size={14} />
                    {showAdvanced ? '▾ Ocultar Lógica Condicional' : '⚡ Adicionar Condicional'}
                  </button>

                  {showAdvanced && (
                    <div style={{
                      marginTop: '12px', padding: '16px', borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)'
                    }}>
                      <p style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '12px', fontWeight: '600' }}>
                        ⚡ Este campo só aparecerá quando a condição abaixo for verdadeira:
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'end' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label className="input-label">Campo Pai (chave)</label>
                          <select className="input-field" value={conditionalParent}
                            onChange={(e) => setConditionalParent(e.target.value)} style={{ cursor: 'pointer' }}>
                            <option value="">— Selecione —</option>
                            {fields.filter(f => {
                              try { const c = JSON.parse(f.placeholder); return !LAYOUT_TYPES.includes(c.real_type || f.type); } catch { return true; }
                            }).map(f => (
                              <option key={f.key} value={f.key}>{f.label} ({f.key})</option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label className="input-label">Operador</label>
                          <select className="input-field" value={conditionalOperator}
                            onChange={(e) => setConditionalOperator(e.target.value)} style={{ cursor: 'pointer', width: '80px' }}>
                            <option value="==">== (igual)</option>
                            <option value="!=">!= (diferente)</option>
                            <option value="truthy">existe (truthy)</option>
                          </select>
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label className="input-label">Valor Esperado</label>
                          <input type="text" className="input-field" placeholder="Ex: Sim"
                            value={conditionalValue} onChange={(e) => setConditionalValue(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px' }}>
                <Plus size={18} /> Adicionar Campo ao Formulário
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            {onClose && (
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            )}
            <button className="btn btn-primary" onClick={() => setCurrentStep(2)}>
              Ir para o Editor <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 2: TIPTAP EDITOR ===== */}
      {currentStep === 2 && (
        <div className="card">
          <h2 style={{ fontSize: '20px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--primary)" /> Editor de Contrato Profissional WYSIWYG
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Clique em uma variável à direita para inseri-la no cursor. Use {`{chave}`} para referenciar um campo.
          </p>

          <div className="editor-layout">
            <div className="wysiwyg-mock">
              {editor && (
                <div className="wysiwyg-toolbar" style={{ borderBottom: '1px solid var(--bg-card-border)', padding: '12px' }}>
                  <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`} title="Negrito">
                    <Bold size={16} />
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`} title="Itálico">
                    <Italic size={16} />
                  </button>
                  <div style={{ width: '1px', backgroundColor: 'var(--bg-card-border)', margin: '0 4px' }} />
                  <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`} title="Título 1">
                    <Heading1 size={16} />
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`} title="Título 2">
                    <Heading2 size={16} />
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`} title="Lista">
                    <List size={16} />
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`} title="Numerada">
                    <ListOrdered size={16} />
                  </button>
                  <div style={{ width: '1px', backgroundColor: 'var(--bg-card-border)', margin: '0 4px' }} />
                  {[['left','Esquerda',AlignLeft],['center','Centro',AlignCenter],['right','Direita',AlignRight],['justify','Justificar',AlignJustify]].map(([align, title, Icon]) => (
                    <button key={align} type="button" onClick={() => applyTextAlign(align)} className="toolbar-btn" title={title}>
                      <Icon size={16} />
                    </button>
                  ))}
                  <div style={{ width: '1px', backgroundColor: 'var(--bg-card-border)', margin: '0 4px' }} />
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Type size={16} style={{ color: 'var(--text-secondary)' }} />
                    <select className="input-field" style={{ width: '90px', padding: '4px 8px', fontSize: '12px', height: '30px', backgroundColor: 'rgba(255,255,255,0.02)' }}
                      onChange={(e) => { applyFontSize(e.target.value); e.target.value = ''; }}>
                      <option value="">Fonte...</option>
                      <option value="12px">Pequeno (12px)</option>
                      <option value="15px">Padrão (15px)</option>
                      <option value="18px">Médio (18px)</option>
                      <option value="24px">Grande (24px)</option>
                      <option value="32px">Título (32px)</option>
                    </select>
                  </div>
                  <div style={{ width: '1px', backgroundColor: 'var(--bg-card-border)', margin: '0 4px' }} />
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Palette size={16} style={{ color: 'var(--text-secondary)' }} />
                    <select className="input-field" style={{ width: '95px', padding: '4px 8px', fontSize: '12px', height: '30px', backgroundColor: 'rgba(255,255,255,0.02)' }}
                      onChange={(e) => { if (e.target.value) { applyTextColor(e.target.value); e.target.value = ''; } }}>
                      <option value="">Cor...</option>
                      <option value="#000000">Preto ⬛</option>
                      <option value="#6366f1">Roxo 🟪</option>
                      <option value="#3b82f6">Azul 🟦</option>
                      <option value="#10b981">Verde 🟩</option>
                      <option value="#ef4444">Vermelho 🟥</option>
                      <option value="#64748b">Cinza ⬜</option>
                    </select>
                  </div>
                  <button type="button" onClick={clearFormatting} className="toolbar-btn" title="Limpar Formatação">
                    <Eraser size={16} />
                  </button>
                  <div style={{ width: '1px', backgroundColor: 'var(--bg-card-border)', margin: '0 8px' }} />
                  <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    className="toolbar-btn" title="Criar Tabela" style={{ gap: '4px', width: 'auto', padding: '0 8px' }}>
                    <TableIcon size={16} /> <span style={{ fontSize: '11px' }}>Tabela</span>
                  </button>
                  {editor.isActive('table') && (
                    <div style={{ display: 'inline-flex', gap: '4px', backgroundColor: 'rgba(99,102,241,0.05)', padding: '2px', borderRadius: '6px' }}>
                      <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="toolbar-btn" title="Linha"><Rows size={14} /></button>
                      <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="toolbar-btn" title="Coluna"><Columns size={14} /></button>
                      <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="toolbar-btn" style={{ color: 'var(--danger)' }} title="Del Linha"><MinusCircle size={14} /></button>
                      <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="toolbar-btn" style={{ color: 'var(--danger)' }} title="Del Coluna"><MinusCircle size={14} /></button>
                      <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="toolbar-btn" style={{ color: 'var(--danger)' }} title="Del Tabela"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              )}
              <div style={{ backgroundColor: 'var(--bg-input)', minHeight: '350px' }}>
                <EditorContent editor={editor} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="sidebar-panel">
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'white', borderBottom: '1px solid var(--bg-card-border)', paddingBottom: '10px' }}>
                Variáveis Disponíveis
              </h3>
              {insertableFields.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  Nenhuma variável. Volte e adicione campos.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '350px' }}>
                  {insertableFields.map((field) => {
                    let cfg = {};
                    try { cfg = JSON.parse(field.placeholder); } catch {}
                    const realType = cfg.real_type || field.type;
                    const typeInfo = FIELD_TYPE_CONFIG[realType];
                    return (
                      <div key={field.key} className="variable-badge"
                        onClick={() => insertVariable(field.key)}
                        title="Clique para inserir na posição do cursor">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px' }}>{typeInfo?.icon}</span>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>{field.label}</span>
                          </div>
                          <span className="variable-key">{`{${field.key}}`}</span>
                        </div>
                        <Plus size={14} color="var(--primary)" />
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{
                backgroundColor: 'rgba(99,102,241,0.05)', padding: '12px', borderRadius: '8px',
                border: '1px solid rgba(99,102,241,0.1)', marginTop: 'auto'
              }}>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  💡 <strong>Condicionais:</strong> Use <code style={{ color: 'var(--secondary)' }}>{`[if chave]texto[/if]`}</code> no editor para blocos condicionais.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep(1)}>
              <ChevronLeft size={18} /> Voltar
            </button>
            <button className="btn btn-primary" onClick={() => setCurrentStep(3)}>
              Configurar Identidade <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 3: VISUAL IDENTITY ===== */}
      {currentStep === 3 && (
        <div className="card">
          <h2 style={{ fontSize: '20px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={20} color="var(--primary)" /> Design Visual & Papel Timbrado
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Escolha o modelo de envoltório e personalize cores e metadados oficiais.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="input-label" style={{ marginBottom: '10px', display: 'block' }}>Escolha um Layout Padrão</label>
                <div className="layouts-grid">
                  {[
                    { key: 'classic', label: 'Clássico', desc: 'Serifado, bordas discretas, visual de cartório.' },
                    { key: 'modern', label: 'Moderno', desc: 'Sem serifa, faixa lateral de cor forte, clean.' },
                    { key: 'minimalist', label: 'Minimalista', desc: 'Visual limpo, espaçado, foco total na tipografia.' }
                  ].map(({ key, label, desc }) => (
                    <div key={key} className={`layout-card ${visualIdentity.theme === key ? 'selected' : ''}`}
                      onClick={() => setVisualIdentity({ ...visualIdentity, theme: key })}>
                      <div className={`layout-preview-box ${key}`} />
                      <div className="layout-title">{label}</div>
                      <div className="layout-desc">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Cor de Destaque (Hex)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="color" className="input-field" style={{ width: '60px', height: '45px', padding: '4px', cursor: 'pointer' }}
                    value={visualIdentity.primaryColor} onChange={(e) => setVisualIdentity({ ...visualIdentity, primaryColor: e.target.value })} />
                  <input type="text" className="input-field" value={visualIdentity.primaryColor}
                    onChange={(e) => setVisualIdentity({ ...visualIdentity, primaryColor: e.target.value })} placeholder="#1e293b" />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">URL da Logomarca</label>
                <input type="text" className="input-field" placeholder="https://suaempresa.com/logo.png"
                  value={visualIdentity.logoUrl} onChange={(e) => setVisualIdentity({ ...visualIdentity, logoUrl: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Texto do Cabeçalho Timbrado</label>
                <input type="text" className="input-field" placeholder="Ex: DEPARTAMENTO JURÍDICO"
                  value={visualIdentity.headerText} onChange={(e) => setVisualIdentity({ ...visualIdentity, headerText: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Texto do Rodapé Institucional</label>
                <textarea className="input-field" style={{ minHeight: '80px', resize: 'none' }}
                  placeholder="Ex: Endereço, e-mail, CNPJ"
                  value={visualIdentity.footerText} onChange={(e) => setVisualIdentity({ ...visualIdentity, footerText: e.target.value })} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--bg-card-border)', paddingTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep(2)}>
              <ChevronLeft size={18} /> Voltar para o Editor
            </button>
            <button className="btn btn-primary" onClick={handleSaveTemplate} disabled={isLoading}
              style={{ paddingLeft: '32px', paddingRight: '32px' }}>
              {isLoading ? 'Salvando...' : (<><Save size={18} /> Salvar Modelo Completo</>)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

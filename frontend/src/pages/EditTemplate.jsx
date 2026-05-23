import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';

import {
  Plus, Trash2, ChevronRight, ChevronLeft, Save, Sparkles,
  FormInput, FileText, Palette, Info, Bold, Italic, List, ListOrdered,
  Heading1, Heading2, Table as TableIcon, Columns, Rows, PlusCircle, MinusCircle, Type,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Eraser, Zap, Settings2,
  Loader2, CheckCircle2, AlertCircle, Pencil
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

const DB_TYPE_MAP = {
  text: 'text', link: 'text', title: 'text', subtitle: 'text', divider: 'text',
  checkbox: 'text', radio: 'select', select: 'select',
  textarea: 'textarea', wysiwyg: 'textarea', clause_adder: 'textarea',
  number: 'number', date: 'date',
};

const LAYOUT_TYPES = ['title', 'subtitle', 'divider'];

const FIELD_TYPE_CONFIG = {
  text:         { label: 'Texto',               icon: '✏️',  color: '#6366f1' },
  textarea:     { label: 'Texto Grande',         icon: '📝',  color: '#8b5cf6' },
  wysiwyg:      { label: 'Wysing (Rich Text)',   icon: '✨',  color: '#a855f7' },
  link:         { label: 'Link / URL',           icon: '🔗',  color: '#06b6d4' },
  select:       { label: 'Lista Select',         icon: '📋',  color: '#10b981' },
  radio:        { label: 'Radio Button',         icon: '🔘',  color: '#f59e0b' },
  checkbox:     { label: 'CheckBox',             icon: '☑️',  color: '#3b82f6' },
  clause_adder: { label: 'Adição de Cláusula',  icon: '📑',  color: '#ef4444' },
  title:        { label: 'Título (Visual)',      icon: '🅃',  color: '#64748b' },
  subtitle:     { label: 'Subtítulo (Visual)',   icon: '🅂',  color: '#64748b' },
  divider:      { label: 'Divisória (Visual)',   icon: '➖',  color: '#64748b' },
  number:       { label: 'Número',              icon: '🔢',  color: '#f97316' },
  date:         { label: 'Data',                icon: '📅',  color: '#ec4899' },
};

export default function EditTemplate({ templateId, onClose, onSuccess }) {
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Geral');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([]);
  const [deletedFieldIds, setDeletedFieldIds] = useState([]); // track fields to delete from DB

  // New field form state
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
    theme: 'classic', primaryColor: '#1e293b',
    headerText: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS',
    footerText: 'Este documento é sigiloso e tem validade jurídica em todo território nacional.',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/3616/3616223.png',
    margins: { top: '2.5cm', bottom: '2.5cm', left: '3.0cm', right: '2.0cm' }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true, HTMLAttributes: { style: 'border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; margin: 15px 0;' } }),
      TableRow,
      TableHeader.configure({ HTMLAttributes: { style: 'border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; color: #1e293b; font-weight: bold; text-align: left;' } }),
      TableCell.configure({ HTMLAttributes: { style: 'border: 1px solid #cbd5e1; padding: 10px; color: #334155;' } })
    ],
    content: '<p>Carregando...</p>',
  });

  // Load existing template data
  useEffect(() => {
    if (!templateId) return;
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    setIsLoadingData(true);
    try {
      // Load template meta
      const { data: tpl, error: tplErr } = await supabase
        .from('templates').select('*').eq('id', templateId).single();
      if (tplErr) throw tplErr;

      setTitle(tpl.title || '');
      setCategory(tpl.category || 'Geral');
      setDescription(tpl.description || '');
      if (tpl.visual_identity) {
        setVisualIdentity(prev => ({ ...prev, ...tpl.visual_identity }));
      }

      // Set editor content
      if (editor && tpl.content) {
        editor.commands.setContent(tpl.content);
      }

      // Load fields
      const { data: flds, error: fldsErr } = await supabase
        .from('template_fields').select('*')
        .eq('template_id', templateId).order('display_order', { ascending: true });
      if (fldsErr) throw fldsErr;

      setFields((flds || []).map(f => ({ ...f, _existing: true })));
    } catch (err) {
      console.error('Erro ao carregar template:', err);
      setSaveStatus({ type: 'error', message: `Erro ao carregar modelo: ${err.message}` });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Re-apply content when editor mounts after data loads
  useEffect(() => {
    if (editor && !isLoadingData) {
      supabase.from('templates').select('content').eq('id', templateId).single()
        .then(({ data }) => { if (data?.content) editor.commands.setContent(data.content); });
    }
  }, [editor, isLoadingData]);

  const handleAddField = (e) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;
    const newKey = generateSlug(newFieldLabel);
    if (fields.some(f => f.key === newKey)) { alert('Já existe um campo com esta chave.'); return; }

    const needsOptions = ['select', 'radio'].includes(newFieldType);
    const extraConfig = {
      real_type: newFieldType,
      options: needsOptions ? newFieldOptions.split(',').map(o => o.trim()).filter(Boolean) : [],
      listType: newFieldType === 'clause_adder' ? newFieldListType : 'ul',
      conditional: hasConditional && conditionalParent ? { depends_on: conditionalParent, operator: conditionalOperator, value: conditionalValue.trim() } : null
    };

    setFields([...fields, {
      label: newFieldLabel.trim(), key: newKey,
      type: DB_TYPE_MAP[newFieldType] || 'text',
      required: LAYOUT_TYPES.includes(newFieldType) ? false : newFieldRequired,
      placeholder: JSON.stringify({ placeholder_text: newFieldPlaceholder.trim(), ...extraConfig }),
      _new: true
    }]);

    setNewFieldLabel(''); setNewFieldType('text'); setNewFieldRequired(false);
    setNewFieldPlaceholder(''); setNewFieldOptions(''); setNewFieldListType('ul');
    setHasConditional(false); setConditionalParent(''); setConditionalOperator('=='); setConditionalValue('');
    setShowAdvanced(false);
  };

  const handleRemoveField = (index) => {
    const field = fields[index];
    if (field._existing && field.id) setDeletedFieldIds(prev => [...prev, field.id]);
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
    if (from === to) { alert('Selecione um texto primeiro.'); return; }
    editor.chain().focus().insertContent(`<span style="font-size: ${size};">${editor.state.doc.textBetween(from, to)}</span>`).run();
  };
  const applyTextAlign = (alignment) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) { editor.chain().focus().insertContent(`<div style="text-align: ${alignment};">&nbsp;</div>`).run(); return; }
    editor.chain().focus().insertContent(`<div style="text-align: ${alignment};">${editor.state.doc.textBetween(from, to)}</div>`).run();
  };
  const applyTextColor = (color) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) { alert('Selecione um texto primeiro.'); return; }
    editor.chain().focus().insertContent(`<span style="color: ${color};">${editor.state.doc.textBetween(from, to)}</span>`).run();
  };

  const handleSave = async () => {
    if (!title.trim()) { setSaveStatus({ type: 'error', message: 'Insira um título para o modelo.' }); setCurrentStep(1); return; }
    const currentContent = editor ? editor.getHTML() : '';
    if (!currentContent.trim() || currentContent === '<p></p>') {
      setSaveStatus({ type: 'error', message: 'O conteúdo do contrato não pode estar vazio.' }); setCurrentStep(2); return;
    }

    setIsLoading(true);
    setSaveStatus({ type: '', message: '' });

    try {
      // 1. Update template meta
      const { error: tplErr } = await supabase.from('templates').update({
        title: title.trim(), category, description: description.trim(),
        content: currentContent, visual_identity: visualIdentity
      }).eq('id', templateId);
      if (tplErr) throw tplErr;

      // 2. Delete removed fields
      if (deletedFieldIds.length > 0) {
        const { error: delErr } = await supabase.from('template_fields').delete().in('id', deletedFieldIds);
        if (delErr) throw delErr;
      }

      // 3. Insert new fields (ones without _existing)
      const newFields = fields.filter(f => f._new && !f._existing);
      if (newFields.length > 0) {
        const insertPayload = newFields.map((f, i) => ({
          template_id: templateId, label: f.label, key: f.key,
          type: f.type, required: f.required, placeholder: f.placeholder,
          display_order: fields.findIndex(x => x.key === f.key)
        }));
        const { error: insErr } = await supabase.from('template_fields').insert(insertPayload);
        if (insErr) throw insErr;
      }

      // 4. Update display_order for existing fields
      const existingFields = fields.filter(f => f._existing && f.id);
      for (const [i, f] of existingFields.entries()) {
        await supabase.from('template_fields').update({ display_order: fields.findIndex(x => x.id === f.id) }).eq('id', f.id);
      }

      setSaveStatus({ type: 'success', message: `Modelo "${title}" atualizado com sucesso!` });
      if (onSuccess) setTimeout(() => onSuccess(), 1200);
    } catch (err) {
      console.error('Erro ao salvar edição:', err);
      setSaveStatus({ type: 'error', message: `Falha ao salvar: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldSemanticLabel = (field) => {
    let cfg = {};
    try { cfg = JSON.parse(field.placeholder); } catch {}
    const realType = cfg.real_type || field.type;
    const typeInfo = FIELD_TYPE_CONFIG[realType];
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: '600', fontSize: '14px' }}>{field.label}</span>
        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: `${typeInfo?.color || '#6366f1'}18`, color: typeInfo?.color || '#6366f1', border: `1px solid ${typeInfo?.color || '#6366f1'}30` }}>
          {typeInfo?.icon} {typeInfo?.label || realType}
        </span>
        {LAYOUT_TYPES.includes(realType) && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(100,116,139,0.15)', color: '#94a3b8' }}>visual only</span>}
        {cfg.conditional?.depends_on && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>⚡ condicional</span>}
        {field._existing && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#34d399' }}>salvo</span>}
        {field._new && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(99,102,241,0.12)', color: 'var(--primary)' }}>novo</span>}
      </div>
    );
  };

  const insertableFields = fields.filter(f => {
    try { const c = JSON.parse(f.placeholder); return !LAYOUT_TYPES.includes(c.real_type || f.type); } catch { return true; }
  });

  const needsOptions = ['select', 'radio'].includes(newFieldType);
  const isLayoutType = LAYOUT_TYPES.includes(newFieldType);
  const currentTypeInfo = FIELD_TYPE_CONFIG[newFieldType];

  if (isLoadingData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--bg-card-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Carregando modelo para edição...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--bg-card-border)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Pencil size={18} color="var(--primary)" />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>Editar Modelo</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Editando: <strong style={{ color: 'var(--primary)' }}>{title}</strong>
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="steps-container" style={{ marginBottom: '24px' }}>
        {[
          { step: 1, icon: <FormInput size={18} />, label: '1. Formulário' },
          { step: 2, icon: <FileText size={18} />, label: '2. Contrato' },
          { step: 3, icon: <Palette size={18} />, label: '3. Identidade' }
        ].map(({ step, icon, label }) => (
          <div key={step} className={`step-node ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
            onClick={() => setCurrentStep(step)} style={{ cursor: 'pointer' }}>
            {icon}<span className="step-label">{label}</span>
          </div>
        ))}
      </div>

      {saveStatus.message && (
        <div style={{
          padding: '14px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px',
          backgroundColor: saveStatus.type === 'success' ? 'var(--success-glow)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${saveStatus.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: saveStatus.type === 'success' ? '#34d399' : '#f87171',
          display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px'
        }}>
          {saveStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {saveStatus.message}
        </div>
      )}

      {/* ===== STEP 1 ===== */}
      {currentStep === 1 && (
        <div className="card">
          <h3 style={{ fontSize: '17px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--primary)" /> Campos & Configurações Básicas
          </h3>

          {/* Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: '16px', marginBottom: '24px' }}>
            <div className="input-group">
              <label className="input-label">Título do Modelo *</label>
              <input type="text" className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Categoria</label>
              <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} style={{ cursor: 'pointer' }}>
                {['Geral','Contrato','Procuração','Declaração','Relatório','Recibo','Outros'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Descrição</label>
              <input type="text" className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--bg-card-border)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '15px', color: '#fff' }}>Campos do Formulário</h4>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fields.length} campo(s)</span>
            </div>

            {/* Fields list — clique para expandir e editar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {fields.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed var(--bg-card-border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                  Nenhum campo. Adicione abaixo.
                </div>
              ) : fields.map((field, idx) => {
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
                    overflow: 'hidden', transition: 'all 0.2s ease'
                  }}>
                    {/* Header row */}
                    <div onClick={() => handleExpandField(idx)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', userSelect: 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {getFieldSemanticLabel(field)}
                        {!isLayout && (
                          <code style={{ color: 'var(--secondary)', fontSize: '11px', marginTop: '2px', display: 'block' }}>{`{${field.key}}`}</code>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', color: isExpanded ? typeInfo?.color || 'var(--primary)' : 'var(--text-muted)', transition: 'color 0.15s' }}>
                          {isExpanded ? '▲ fechar' : '▼ editar'}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveField(idx); }}
                          className="btn btn-danger" style={{ padding: '5px', borderRadius: '6px' }} title="Remover">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded inline editor */}
                    {isExpanded && efd && (
                      <div style={{ padding: '14px', borderTop: `1px solid ${typeInfo?.color || 'var(--primary)'}25`, backgroundColor: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label className="input-label">Rótulo</label>
                          <input type="text" className="input-field" value={efd.label} onChange={e => setEditingFieldData({ ...efd, label: e.target.value })} />
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label className="input-label">Tipo do Campo</label>
                          <select className="input-field" value={efd.realType}
                            onChange={e => setEditingFieldData({ ...efd, realType: e.target.value, options: '', hasConditional: false })} style={{ cursor: 'pointer' }}>
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

                        {eNeedsOptions && (
                          <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Opções (vírgula)</label>
                            <input type="text" className="input-field" placeholder="Ex: Sim, Não" value={efd.options} onChange={e => setEditingFieldData({ ...efd, options: e.target.value })} />
                            {efd.options && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                {efd.options.split(',').map(o => o.trim()).filter(Boolean).map((opt, i) => (
                                  <span key={i} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(99,102,241,0.12)', color: 'var(--primary)', border: '1px solid rgba(99,102,241,0.25)' }}>{opt}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {efd.realType === 'clause_adder' && (
                          <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Formato de Lista</label>
                            <select className="input-field" value={efd.listType} onChange={e => setEditingFieldData({ ...efd, listType: e.target.value })} style={{ cursor: 'pointer' }}>
                              <option value="ul">• Marcadores (ul)</option>
                              <option value="ol">1. Numerada (ol)</option>
                              <option value="p">Parágrafo (p)</option>
                            </select>
                          </div>
                        )}

                        {!eIsLayout && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <label className="input-label">Placeholder (Dica)</label>
                              <input type="text" className="input-field" placeholder="Ex: Razão Social" value={efd.placeholder_text} onChange={e => setEditingFieldData({ ...efd, placeholder_text: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingBottom: '4px' }}>
                              <label className="input-label" style={{ marginBottom: 0 }}>Obrig.?</label>
                              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input type="checkbox" checked={efd.required} onChange={e => setEditingFieldData({ ...efd, required: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                                <span style={{ fontSize: '12px' }}>Sim</span>
                              </label>
                            </div>
                          </div>
                        )}

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
                                  <select className="input-field" value={efd.conditionalParent} onChange={e => setEditingFieldData({ ...efd, conditionalParent: e.target.value })} style={{ cursor: 'pointer' }}>
                                    <option value="">— Selecione —</option>
                                    {fields.filter((f, i) => i !== idx).filter(f => { try { const c = JSON.parse(f.placeholder); return !LAYOUT_TYPES.includes(c.real_type || f.type); } catch { return true; } }).map(f => (
                                      <option key={f.key} value={f.key}>{f.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                  <label className="input-label">Op.</label>
                                  <select className="input-field" value={efd.conditionalOperator} onChange={e => setEditingFieldData({ ...efd, conditionalOperator: e.target.value })} style={{ cursor: 'pointer', width: '80px' }}>
                                    <option value="==">==</option>
                                    <option value="!=">!=</option>
                                    <option value="truthy">existe</option>
                                  </select>
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                  <label className="input-label">Valor</label>
                                  <input type="text" className="input-field" placeholder="Ex: Sim" value={efd.conditionalValue} onChange={e => setEditingFieldData({ ...efd, conditionalValue: e.target.value })} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                          <button type="button" className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: '13px' }}
                            onClick={() => { setExpandedFieldIdx(null); setEditingFieldData(null); }}>Cancelar</button>
                          <button type="button" className="btn btn-primary"
                            style={{ padding: '7px 18px', fontSize: '13px', backgroundColor: typeInfo?.color, borderColor: typeInfo?.color }}
                            onClick={() => handleUpdateField(idx)}>✓ Atualizar Campo</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add field form */}
            <form onSubmit={handleAddField} style={{ backgroundColor: 'rgba(99,102,241,0.04)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Settings2 size={15} color="var(--primary)" />
                <span style={{ fontWeight: '700', fontSize: '12px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Adicionar Campo</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Rótulo *</label>
                  <input type="text" className="input-field" placeholder="Ex: Nome da Empresa" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Tipo</label>
                  <select className="input-field" value={newFieldType} onChange={(e) => { setNewFieldType(e.target.value); setShowAdvanced(false); }} style={{ cursor: 'pointer' }}>
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
              </div>

              {/* Type info pill */}
              {currentTypeInfo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '14px', backgroundColor: `${currentTypeInfo.color}10`, border: `1px solid ${currentTypeInfo.color}25` }}>
                  <span>{currentTypeInfo.icon}</span>
                  <span style={{ fontWeight: '700', fontSize: '12px', color: currentTypeInfo.color }}>{currentTypeInfo.label}</span>
                  {isLayoutType && <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Não gera variável</span>}
                </div>
              )}

              {needsOptions && (
                <div className="input-group" style={{ marginBottom: '14px' }}>
                  <label className="input-label">Opções (separadas por vírgula)</label>
                  <input type="text" className="input-field" placeholder="Ex: Sim, Não, Talvez" value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)} />
                  {newFieldOptions && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {newFieldOptions.split(',').map(o => o.trim()).filter(Boolean).map((opt, i) => (
                        <span key={i} style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(99,102,241,0.12)', color: 'var(--primary)', border: '1px solid rgba(99,102,241,0.25)' }}>{opt}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {newFieldType === 'clause_adder' && (
                <div className="input-group" style={{ marginBottom: '14px' }}>
                  <label className="input-label">Formato de Lista</label>
                  <select className="input-field" value={newFieldListType} onChange={(e) => setNewFieldListType(e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="ul">• Marcadores (ul)</option>
                    <option value="ol">1. Numerada (ol)</option>
                    <option value="p">Parágrafo (p)</option>
                  </select>
                </div>
              )}

              {!isLayoutType && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '14px', marginBottom: '14px', alignItems: 'end' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Placeholder (Dica)</label>
                    <input type="text" className="input-field" placeholder="Ex: Razão Social" value={newFieldPlaceholder} onChange={(e) => setNewFieldPlaceholder(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingBottom: '4px' }}>
                    <label className="input-label" style={{ marginBottom: 0 }}>Obrig.?</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={newFieldRequired} onChange={(e) => setNewFieldRequired(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                      <span style={{ fontSize: '13px' }}>Sim</span>
                    </label>
                  </div>
                </div>
              )}

              {!isLayoutType && (
                <div style={{ marginBottom: '14px' }}>
                  <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: showAdvanced ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)', border: showAdvanced ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--bg-card-border)', color: showAdvanced ? '#f59e0b' : 'var(--text-secondary)', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                    <Zap size={13} /> {showAdvanced ? '▾ Ocultar Condicional' : '⚡ Adicionar Condicional'}
                  </button>
                  {showAdvanced && (
                    <div style={{ marginTop: '10px', padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <p style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '10px', fontWeight: '600' }}>⚡ Este campo aparece apenas quando:</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'end' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label className="input-label">Campo Pai</label>
                          <select className="input-field" value={conditionalParent} onChange={(e) => setConditionalParent(e.target.value)} style={{ cursor: 'pointer' }}>
                            <option value="">— Selecione —</option>
                            {fields.filter(f => { try { const c = JSON.parse(f.placeholder); return !LAYOUT_TYPES.includes(c.real_type || f.type); } catch { return true; } }).map(f => (
                              <option key={f.key} value={f.key}>{f.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label className="input-label">Op.</label>
                          <select className="input-field" value={conditionalOperator} onChange={(e) => setConditionalOperator(e.target.value)} style={{ cursor: 'pointer', width: '80px' }}>
                            <option value="==">==</option>
                            <option value="!=">!=</option>
                            <option value="truthy">existe</option>
                          </select>
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label className="input-label">Valor</label>
                          <input type="text" className="input-field" placeholder="Ex: Sim" value={conditionalValue} onChange={(e) => setConditionalValue(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px' }}>
                <Plus size={16} /> Adicionar Campo
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => setCurrentStep(2)}>
              Editor <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 2: EDITOR ===== */}
      {currentStep === 2 && (
        <div className="card">
          <h3 style={{ fontSize: '17px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--primary)" /> Editor de Contrato
          </h3>

          <div className="editor-layout">
            <div className="wysiwyg-mock">
              {editor && (
                <div className="wysiwyg-toolbar" style={{ borderBottom: '1px solid var(--bg-card-border)', padding: '10px' }}>
                  <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`} title="Negrito"><Bold size={15} /></button>
                  <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`} title="Itálico"><Italic size={15} /></button>
                  <div style={{ width: '1px', backgroundColor: 'var(--bg-card-border)', margin: '0 4px' }} />
                  <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`} title="Título 1"><Heading1 size={15} /></button>
                  <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`} title="Título 2"><Heading2 size={15} /></button>
                  <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`} title="Lista"><List size={15} /></button>
                  <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`} title="Numerada"><ListOrdered size={15} /></button>
                  <div style={{ width: '1px', backgroundColor: 'var(--bg-card-border)', margin: '0 4px' }} />
                  {[['left','Esquerda',AlignLeft],['center','Centro',AlignCenter],['right','Direita',AlignRight],['justify','Justificar',AlignJustify]].map(([a,t,Icon]) => (
                    <button key={a} type="button" onClick={() => applyTextAlign(a)} className="toolbar-btn" title={t}><Icon size={15} /></button>
                  ))}
                  <div style={{ width: '1px', backgroundColor: 'var(--bg-card-border)', margin: '0 4px' }} />
                  <select className="input-field" style={{ width: '90px', padding: '4px 8px', fontSize: '12px', height: '28px', backgroundColor: 'rgba(255,255,255,0.02)' }}
                    onChange={(e) => { applyFontSize(e.target.value); e.target.value = ''; }}>
                    <option value="">Fonte...</option>
                    <option value="12px">12px</option><option value="15px">15px</option>
                    <option value="18px">18px</option><option value="24px">24px</option><option value="32px">32px</option>
                  </select>
                  <select className="input-field" style={{ width: '80px', padding: '4px 8px', fontSize: '12px', height: '28px', backgroundColor: 'rgba(255,255,255,0.02)' }}
                    onChange={(e) => { if (e.target.value) { applyTextColor(e.target.value); e.target.value = ''; } }}>
                    <option value="">Cor...</option>
                    <option value="#000000">Preto</option><option value="#6366f1">Roxo</option>
                    <option value="#3b82f6">Azul</option><option value="#10b981">Verde</option>
                    <option value="#ef4444">Vermelho</option>
                  </select>
                  <button type="button" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} className="toolbar-btn" title="Limpar"><Eraser size={15} /></button>
                  <div style={{ width: '1px', backgroundColor: 'var(--bg-card-border)', margin: '0 4px' }} />
                  <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="toolbar-btn" title="Tabela" style={{ padding: '0 8px', width: 'auto', gap: '4px' }}>
                    <TableIcon size={15} /> <span style={{ fontSize: '11px' }}>Tabela</span>
                  </button>
                  {editor.isActive('table') && (
                    <div style={{ display: 'inline-flex', gap: '3px', backgroundColor: 'rgba(99,102,241,0.05)', padding: '2px', borderRadius: '6px' }}>
                      <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="toolbar-btn" title="Linha"><Rows size={13} /></button>
                      <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="toolbar-btn" title="Coluna"><Columns size={13} /></button>
                      <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="toolbar-btn" style={{ color: 'var(--danger)' }}><MinusCircle size={13} /></button>
                      <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="toolbar-btn" style={{ color: 'var(--danger)' }}><MinusCircle size={13} /></button>
                      <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="toolbar-btn" style={{ color: 'var(--danger)' }}><Trash2 size={13} /></button>
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
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'white', borderBottom: '1px solid var(--bg-card-border)', paddingBottom: '10px', marginBottom: '10px' }}>
                Variáveis
              </h3>
              {insertableFields.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>Nenhuma variável. Adicione campos.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '320px' }}>
                  {insertableFields.map((field) => {
                    let cfg = {}; try { cfg = JSON.parse(field.placeholder); } catch {}
                    const realType = cfg.real_type || field.type;
                    const typeInfo = FIELD_TYPE_CONFIG[realType];
                    return (
                      <div key={field.key} className="variable-badge" onClick={() => insertVariable(field.key)} title="Inserir na posição do cursor">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '12px' }}>{typeInfo?.icon}</span>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: 'white' }}>{field.label}</span>
                          </div>
                          <span className="variable-key">{`{${field.key}}`}</span>
                        </div>
                        <Plus size={13} color="var(--primary)" />
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ backgroundColor: 'rgba(99,102,241,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.1)', marginTop: '12px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  💡 Use <code style={{ color: 'var(--secondary)' }}>{`[if chave]texto[/if]`}</code> para blocos condicionais.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep(1)}><ChevronLeft size={18} /> Voltar</button>
            <button className="btn btn-primary" onClick={() => setCurrentStep(3)}>Identidade Visual <ChevronRight size={18} /></button>
          </div>
        </div>
      )}

      {/* ===== STEP 3: VISUAL IDENTITY ===== */}
      {currentStep === 3 && (
        <div className="card">
          <h3 style={{ fontSize: '17px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={18} color="var(--primary)" /> Design Visual & Papel Timbrado
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '10px' }}>Layout</label>
                <div className="layouts-grid">
                  {[
                    { key: 'classic', label: 'Clássico', desc: 'Serifado, bordas discretas.' },
                    { key: 'modern', label: 'Moderno', desc: 'Faixa lateral, clean.' },
                    { key: 'minimalist', label: 'Minimalista', desc: 'Foco na tipografia.' }
                  ].map(({ key, label, desc }) => (
                    <div key={key} className={`layout-card ${visualIdentity.theme === key ? 'selected' : ''}`} onClick={() => setVisualIdentity({ ...visualIdentity, theme: key })}>
                      <div className={`layout-preview-box ${key}`} />
                      <div className="layout-title">{label}</div>
                      <div className="layout-desc">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Cor de Destaque</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="color" className="input-field" style={{ width: '60px', height: '42px', padding: '4px', cursor: 'pointer' }}
                    value={visualIdentity.primaryColor} onChange={(e) => setVisualIdentity({ ...visualIdentity, primaryColor: e.target.value })} />
                  <input type="text" className="input-field" value={visualIdentity.primaryColor}
                    onChange={(e) => setVisualIdentity({ ...visualIdentity, primaryColor: e.target.value })} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">URL da Logo</label>
                <input type="text" className="input-field" value={visualIdentity.logoUrl} onChange={(e) => setVisualIdentity({ ...visualIdentity, logoUrl: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Texto do Cabeçalho</label>
                <input type="text" className="input-field" value={visualIdentity.headerText} onChange={(e) => setVisualIdentity({ ...visualIdentity, headerText: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Texto do Rodapé</label>
                <textarea className="input-field" style={{ minHeight: '72px', resize: 'none' }} value={visualIdentity.footerText} onChange={(e) => setVisualIdentity({ ...visualIdentity, footerText: e.target.value })} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--bg-card-border)', paddingTop: '20px' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep(2)}><ChevronLeft size={18} /> Voltar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={isLoading} style={{ paddingLeft: '28px', paddingRight: '28px' }}>
              {isLoading ? (<><Loader2 style={{ animation: 'spin 1s linear infinite' }} size={16} /> Salvando...</>) : (<><Save size={16} /> Salvar Alterações</>)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

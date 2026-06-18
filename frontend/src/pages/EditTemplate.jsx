import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Plus, Trash2, ChevronRight, ChevronLeft, Save, Sparkles, 
  FormInput, FileText, Palette, Info, ArrowUp, ArrowDown,
  Heading, Type, AlignLeft, Grid, Pencil, Layout, CheckSquare, Zap, Settings2,
  Trash, PlusCircle, MinusCircle, HelpCircle, Loader2, CheckCircle2, AlertCircle, Search, X
} from 'lucide-react';

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
  wysiwyg:      { label: 'Rich Text',            icon: '✨',  color: '#a855f7' },
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
  const [newFieldMin, setNewFieldMin] = useState('');
  const [newFieldMax, setNewFieldMax] = useState('');
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
    margins: { top: '2.5cm', bottom: '2.5cm', left: '3.0cm', right: '2.0cm' },
    fontFamily: 'Inter',
    backgroundImageUrl: ''
  });

  // BLOCK BUILDER STATE
  const [blocks, setBlocks] = useState([]);
  const [activeInput, setActiveInput] = useState(null); // { blockId, fieldKey, selectionStart }

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  // Clausulario Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [libraryClauses, setLibraryClauses] = useState([]);
  const [searchLibraryQuery, setSearchLibraryQuery] = useState('');
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  const fetchLibraryClauses = async () => {
    setIsLoadingLibrary(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('clauses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLibraryClauses(data || []);
    } catch (err) {
      console.error('Erro ao buscar cláusulas da biblioteca:', err);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const handleOpenImportModal = () => {
    fetchLibraryClauses();
    setIsImportModalOpen(true);
  };

  const handleImportClause = (clause) => {
    const newId = 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    setBlocks([...blocks, {
      id: newId,
      type: 'clause',
      data: {
        title: clause.title,
        text: clause.content
      }
    }]);
    setIsImportModalOpen(false);
  };

  // Load existing template data
  useEffect(() => {
    if (!templateId) return;
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    setIsLoadingData(true);
    try {
      const { data: tpl, error: tplErr } = await supabase
        .from('templates').select('*').eq('id', templateId).single();
      if (tplErr) throw tplErr;

      setTitle(tpl.title || '');
      setCategory(tpl.category || 'Geral');
      setDescription(tpl.description || '');
      if (tpl.visual_identity) {
        setVisualIdentity(prev => ({ ...prev, ...tpl.visual_identity }));
      }

      // Load blocks or convert old content
      if (tpl.blocks && Array.isArray(tpl.blocks) && tpl.blocks.length > 0) {
        setBlocks(tpl.blocks);
      } else {
        // Fallback for older templates: load original HTML as a single text block
        setBlocks([
          { id: 'b_old', type: 'text', data: { content: (tpl.content || '').replace(/<p style="margin-bottom: 16px; line-height: 1.6; text-align: justify; font-size: 14px; color: #334155;">/g, '').replace(/<\/p>/g, '\n').trim() } }
        ]);
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

  // BLOCK BUILDER ACTIONS
  const addBlock = (type) => {
    const newId = 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    let defaultData = {};
    if (type === 'title') defaultData = { text: 'Novo Título' };
    else if (type === 'text') defaultData = { content: 'Escreva seu texto aqui...' };
    else if (type === 'clause') defaultData = { title: 'Cláusula Primeira', text: 'Descrição da cláusula...' };
    else if (type === 'table') defaultData = { headers: ['Coluna 1', 'Coluna 2'], rows: [['Dado A1', 'Dado A2'], ['Dado B1', 'Dado B2']] };
    else if (type === 'divider') defaultData = { thickness: '2px', color: '#cbd5e1' };

    setBlocks([...blocks, { id: newId, type, data: defaultData }]);
  };

  const deleteBlock = (id) => {
    if (blocks.length === 1) {
      alert('Seu template precisa ter pelo menos um bloco.');
      return;
    }
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[newIndex];
    newBlocks[newIndex] = temp;
    setBlocks(newBlocks);
  };

  const updateBlockData = (id, key, value) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, data: { ...b.data, [key]: value } } : b));
  };

  // Table block tools
  const updateTableCell = (blockId, rowIndex, cellIndex, value) => {
    setBlocks(blocks.map(b => {
      if (b.id !== blockId) return b;
      const newRows = [...b.data.rows];
      newRows[rowIndex] = [...newRows[rowIndex]];
      newRows[rowIndex][cellIndex] = value;
      return { ...b, data: { ...b.data, rows: newRows } };
    }));
  };

  const updateTableHeader = (blockId, headerIndex, value) => {
    setBlocks(blocks.map(b => {
      if (b.id !== blockId) return b;
      const newHeaders = [...b.data.headers];
      newHeaders[headerIndex] = value;
      return { ...b, data: { ...b.data, headers: newHeaders } };
    }));
  };

  const addTableColumn = (blockId) => {
    setBlocks(blocks.map(b => {
      if (b.id !== blockId) return b;
      const newHeaders = [...b.data.headers, `Coluna ${b.data.headers.length + 1}`];
      const newRows = b.data.rows.map(row => [...row, '']);
      return { ...b, data: { ...b.data, headers: newHeaders, rows: newRows } };
    }));
  };

  const removeTableColumn = (blockId) => {
    setBlocks(blocks.map(b => {
      if (b.id !== blockId || b.data.headers.length <= 1) return b;
      const newHeaders = b.data.headers.slice(0, -1);
      const newRows = b.data.rows.map(row => row.slice(0, -1));
      return { ...b, data: { ...b.data, headers: newHeaders, rows: newRows } };
    }));
  };

  const addTableRow = (blockId) => {
    setBlocks(blocks.map(b => {
      if (b.id !== blockId) return b;
      const newRow = Array(b.data.headers.length).fill('');
      return { ...b, data: { ...b.data, rows: [...b.data.rows, newRow] } };
    }));
  };

  const removeTableRow = (blockId) => {
    setBlocks(blocks.map(b => {
      if (b.id !== blockId || b.data.rows.length <= 1) return b;
      return { ...b, data: { ...b.data, rows: b.data.rows.slice(0, -1) } };
    }));
  };

  // Variable injection
  const insertVariable = (variableKey) => {
    if (!activeInput) return;
    const { blockId, fieldKey, selectionStart } = activeInput;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const originalText = block.data[fieldKey] || '';
    const insertText = `{${variableKey}}`;
    const cursorOffset = selectionStart !== undefined ? selectionStart : originalText.length;
    const newText = originalText.slice(0, cursorOffset) + insertText + originalText.slice(cursorOffset);

    updateBlockData(blockId, fieldKey, newText);
    setActiveInput({
      blockId,
      fieldKey,
      selectionStart: cursorOffset + insertText.length
    });
  };

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
      min: newFieldType === 'number' && newFieldMin !== '' ? Number(newFieldMin) : undefined,
      max: newFieldType === 'number' && newFieldMax !== '' ? Number(newFieldMax) : undefined,
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
    setNewFieldMin(''); setNewFieldMax('');
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
      min: cfg.min !== undefined ? cfg.min : '',
      max: cfg.max !== undefined ? cfg.max : '',
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
      min: f.realType === 'number' && f.min !== '' ? Number(f.min) : undefined,
      max: f.realType === 'number' && f.max !== '' ? Number(f.max) : undefined,
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

  // HTML COMPILER
  const compileBlocksToHtml = () => {
    return blocks.map(block => {
      switch (block.type) {
        case 'title':
          return `<h2 class="contract-title" style="text-align: center; margin-top: 28px; margin-bottom: 16px; font-weight: 800; font-size: 22px; text-transform: uppercase;">${block.data.text || ''}</h2>`;
        case 'text':
          const cleanText = (block.data.content || '').replace(/\n/g, '<br/>');
          return `<p class="contract-text" style="margin-bottom: 16px; line-height: 1.8; text-align: justify; font-size: 14px;">${cleanText}</p>`;
        case 'clause':
          const cleanClauseBody = (block.data.text || '').replace(/\n/g, '<br/>');
          return `
            <div class="contract-clause" style="margin-top: 24px; margin-bottom: 24px;">
              <h3 class="clause-title" style="margin-bottom: 8px; font-size: 16px; font-weight: bold;">${block.data.title || ''}</h3>
              <p class="clause-text" style="margin-top: 0; line-height: 1.8; text-align: justify; font-size: 14px;">${cleanClauseBody}</p>
            </div>
          `;
        case 'table':
          const headers = block.data.headers || [];
          const rows = block.data.rows || [];
          let tableHtml = `<table class="contract-table" style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 13px; border: 1px solid #cbd5e1;">`;
          if (headers.length > 0) {
            tableHtml += `<thead><tr style="background-color: rgba(0,0,0,0.02); border-bottom: 2px solid #cbd5e1;">`;
            headers.forEach(h => {
              tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 10px; font-weight: 700; text-align: left;">${h}</th>`;
            });
            tableHtml += `</tr></thead>`;
          }
          tableHtml += `<tbody>`;
          rows.forEach((row, rIdx) => {
            tableHtml += `<tr style="border-bottom: 1px solid #cbd5e1; ${rIdx % 2 === 1 ? 'background-color: rgba(0,0,0,0.01);' : ''}">`;
            row.forEach(cell => {
              tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 10px;">${cell}</td>
`;
            });
            tableHtml += `</tr>`;
          });
          tableHtml += `</tbody></table>`;
          return tableHtml;
        case 'divider':
          return `<hr style="border: 0; border-top: ${block.data.thickness || '1px'} solid ${block.data.color || '#cbd5e1'}; margin: 24px 0;" />`;
        default:
          return '';
      }
    }).join('\n');
  };

  const handleSave = async () => {
    if (!title.trim()) { setSaveStatus({ type: 'error', message: 'Insira um título para o modelo.' }); setCurrentStep(1); return; }
    const compiledContent = compileBlocksToHtml();
    if (!compiledContent.trim()) {
      setSaveStatus({ type: 'error', message: 'O conteúdo do contrato não pode estar vazio.' }); setCurrentStep(2); return;
    }

    setIsLoading(true);
    setSaveStatus({ type: '', message: '' });

    try {
      // 1. Update template
      const { error: tplErr } = await supabase.from('templates').update({
        title: title.trim(), category, description: description.trim(),
        content: compiledContent, visual_identity: visualIdentity,
        blocks: blocks
      }).eq('id', templateId);
      if (tplErr) throw tplErr;

      // 2. Delete removed fields
      if (deletedFieldIds.length > 0) {
        const { error: delErr } = await supabase.from('template_fields').delete().in('id', deletedFieldIds);
        if (delErr) throw delErr;
      }

      // 3. Insert new fields
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
        {realType === 'number' && (cfg.min !== undefined || cfg.max !== undefined) && (
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(249,115,22,0.12)', color: '#f97316' }}>
            🔢 {cfg.min || 0} - {cfg.max || '∞'}
          </span>
        )}
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
          { step: 2, icon: <FileText size={18} />, label: '2. Contrato (Blocos)' },
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
                    border: isExpanded ? `1px solid ${typeInfo?.color || 'var(--primary)'}60` : `1px solid ${isLayout ? 'rgba(100,116,139,0.2)' : 'var(--bg-card-border)'}`,
                    borderLeft: `3px solid ${typeInfo?.color || 'var(--primary)'}`,
                    backgroundColor: isExpanded ? `${typeInfo?.color || '#6366f1'}08` : (isLayout ? 'rgba(100,116,139,0.06)' : 'rgba(255,255,255,0.02)'),
                    overflow: 'hidden', transition: 'all 0.2s ease'
                  }}>
                    <div onClick={() => handleExpandField(idx)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', userSelect: 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {getFieldSemanticLabel(field)}
                        {!isLayout && (
                          <code style={{ color: 'var(--secondary)', fontSize: '11px', marginTop: '2px', display: 'block' }}>{`{${field.key}}`}</code>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', color: isExpanded ? typeInfo?.color || 'var(--primary)' : 'var(--text-muted)' }}>
                          {isExpanded ? '▲ fechar' : '▼ editar'}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveField(idx); }} className="btn btn-danger" style={{ padding: '5px', borderRadius: '6px' }} title="Remover">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && efd && (
                      <div style={{ padding: '14px', borderTop: `1px solid ${typeInfo?.color || 'var(--primary)'}25`, backgroundColor: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label className="input-label">Rótulo</label>
                          <input type="text" className="input-field" value={efd.label} onChange={e => setEditingFieldData({ ...efd, label: e.target.value })} />
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label className="input-label">Tipo do Campo</label>
                          <select className="input-field" value={efd.realType} onChange={e => setEditingFieldData({ ...efd, realType: e.target.value, options: '', hasConditional: false, min: '', max: '' })} style={{ cursor: 'pointer' }}>
                            <optgroup label="— Texto —">
                              <option value="text">✏️ Texto</option>
                              <option value="textarea">📝 Texto Grande</option>
                              <option value="wysiwyg">✨ Rich Text</option>
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

                        {efd.realType === 'number' && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <label className="input-label">Valor Mínimo (Opcional)</label>
                              <input type="number" className="input-field" placeholder="Ex: 1711" value={efd.min} onChange={e => setEditingFieldData({ ...efd, min: e.target.value })} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <label className="input-label">Valor Máximo (Opcional)</label>
                              <input type="number" className="input-field" placeholder="Ex: 1900" value={efd.max} onChange={e => setEditingFieldData({ ...efd, max: e.target.value })} />
                            </div>
                          </div>
                        )}

                        {eNeedsOptions && (
                          <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Opções (vírgula)</label>
                            <input type="text" className="input-field" placeholder="Ex: Sim, Não" value={efd.options} onChange={e => setEditingFieldData({ ...efd, options: e.target.value })} />
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
                              <input type="checkbox" checked={efd.hasConditional} onChange={e => setEditingFieldData({ ...efd, hasConditional: e.target.checked, conditionalParent: '', conditionalValue: '' })} style={{ width: '15px', height: '15px', accentColor: '#f59e0b' }} />
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
                                  <input type="text" className="input-field" placeholder="Ex: Sim" value={conditionalValue} onChange={e => setEditingFieldData({ ...efd, conditionalValue: e.target.value })} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                          <button type="button" className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: '13px' }} onClick={() => { setExpandedFieldIdx(null); setEditingFieldData(null); }}>Cancelar</button>
                          <button type="button" className="btn btn-primary" style={{ padding: '7px 18px', fontSize: '13px', backgroundColor: typeInfo?.color, borderColor: typeInfo?.color }} onClick={() => handleUpdateField(idx)}>✓ Atualizar Campo</button>
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
                  <input type="text" className="input-field" placeholder="Ex: Nome da Empresa" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Tipo</label>
                  <select className="input-field" value={newFieldType} onChange={(e) => { setNewFieldType(e.target.value); setShowAdvanced(false); }} style={{ cursor: 'pointer' }}>
                    <optgroup label="— Texto —">
                      <option value="text">✏️ Texto</option>
                      <option value="textarea">📝 Texto Grande</option>
                      <option value="wysiwyg">✨ Rich Text</option>
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

              {currentTypeInfo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '14px', backgroundColor: `${currentTypeInfo.color}10`, border: `1px solid ${currentTypeInfo.color}25` }}>
                  <span>{currentTypeInfo.icon}</span>
                  <span style={{ fontWeight: '700', fontSize: '12px', color: currentTypeInfo.color }}>{currentTypeInfo.label}</span>
                </div>
              )}

              {newFieldType === 'number' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Valor Mínimo (Opcional)</label>
                    <input type="number" className="input-field" placeholder="Ex: 1711" value={newFieldMin} onChange={(e) => setNewFieldMin(e.target.value)} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Valor Máximo (Opcional)</label>
                    <input type="number" className="input-field" placeholder="Ex: 1900" value={newFieldMax} onChange={(e) => setNewFieldMax(e.target.value)} />
                  </div>
                </div>
              )}

              {needsOptions && (
                <div className="input-group" style={{ marginBottom: '14px' }}>
                  <label className="input-label">Opções (separadas por vírgula)</label>
                  <input type="text" className="input-field" placeholder="Ex: Sim, Não, Talvez" value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)} required />
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
              Ir para o Editor de Blocos <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 2: BLOCK BUILDER ===== */}
      {currentStep === 2 && (
        <div className="card">
          <h3 style={{ fontSize: '17px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--primary)" /> Construtor de Documento por Blocos
          </h3>

          <div className="editor-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
            
            {/* Blocks workspace */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {blocks.map((block, idx) => (
                <div key={block.id} style={{
                  border: '1px solid var(--bg-card-border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255,255,255,0.01)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {/* Block Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifySpace: 'space-between',
                    padding: '8px 16px', borderBottom: '1px solid var(--bg-card-border)',
                    backgroundColor: 'rgba(255,255,255,0.02)', justifyContent: 'space-between'
                  }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                      padding: '2px 8px', borderRadius: '4px',
                      backgroundColor: block.type === 'title' ? 'rgba(99,102,241,0.15)' :
                                       block.type === 'text' ? 'rgba(139,92,246,0.15)' :
                                       block.type === 'clause' ? 'rgba(239,68,68,0.15)' :
                                       block.type === 'divider' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                      color: block.type === 'title' ? 'var(--primary)' :
                             block.type === 'text' ? '#a855f7' :
                             block.type === 'clause' ? '#f87171' :
                             block.type === 'divider' ? '#f59e0b' : '#34d399'
                    }}>
                      {block.type === 'title' ? 'Título 🅃' :
                       block.type === 'text' ? 'Texto ✏️' :
                       block.type === 'clause' ? 'Cláusula 📑' :
                       block.type === 'divider' ? 'Divisória ➖' : 'Tabela 📋'}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button type="button" onClick={() => moveBlock(idx, 'up')} className="btn" style={{ padding: '4px 8px', minWidth: 'auto', background: 'transparent', border: '1px solid var(--bg-card-border)' }} disabled={idx === 0}>
                        <ArrowUp size={12} />
                      </button>
                      <button type="button" onClick={() => moveBlock(idx, 'down')} className="btn" style={{ padding: '4px 8px', minWidth: 'auto', background: 'transparent', border: '1px solid var(--bg-card-border)' }} disabled={idx === blocks.length - 1}>
                        <ArrowDown size={12} />
                      </button>
                      <button type="button" onClick={() => deleteBlock(block.id)} className="btn btn-danger" style={{ padding: '4px 8px', minWidth: 'auto' }}>
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Block Editor Content */}
                  <div style={{ padding: '16px' }}>
                    
                    {/* TITLE BLOCK */}
                    {block.type === 'title' && (
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="EX: CONTRATO DE LOCAÇÃO"
                          value={block.data.text || ''}
                          onChange={(e) => updateBlockData(block.id, 'text', e.target.value)}
                          onFocus={(e) => setActiveInput({ blockId: block.id, fieldKey: 'text', selectionStart: e.target.selectionStart })}
                          style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}
                        />
                      </div>
                    )}

                    {/* TEXT BLOCK */}
                    {block.type === 'text' && (
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <textarea
                          className="input-field"
                          rows={6}
                          placeholder="Digite o conteúdo do texto. Use {campo} para inserir variáveis."
                          value={block.data.content || ''}
                          onChange={(e) => updateBlockData(block.id, 'content', e.target.value)}
                          onFocus={(e) => setActiveInput({ blockId: block.id, fieldKey: 'content', selectionStart: e.target.selectionStart })}
                          onKeyUp={(e) => setActiveInput({ blockId: block.id, fieldKey: 'content', selectionStart: e.target.selectionStart })}
                          onClick={(e) => setActiveInput({ blockId: block.id, fieldKey: 'content', selectionStart: e.target.selectionStart })}
                          style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5' }}
                        />
                      </div>
                    )}

                    {/* CLAUSE BLOCK */}
                    {block.type === 'clause' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Título da Cláusula (Ex: Cláusula Primeira)"
                          value={block.data.title || ''}
                          onChange={(e) => updateBlockData(block.id, 'title', e.target.value)}
                          onFocus={(e) => setActiveInput({ blockId: block.id, fieldKey: 'title', selectionStart: e.target.selectionStart })}
                          style={{ fontWeight: 'bold' }}
                        />
                        <textarea
                          className="input-field"
                          rows={4}
                          placeholder="Texto ou regras da cláusula..."
                          value={block.data.text || ''}
                          onChange={(e) => updateBlockData(block.id, 'text', e.target.value)}
                          onFocus={(e) => setActiveInput({ blockId: block.id, fieldKey: 'text', selectionStart: e.target.selectionStart })}
                          onKeyUp={(e) => setActiveInput({ blockId: block.id, fieldKey: 'text', selectionStart: e.target.selectionStart })}
                          onClick={(e) => setActiveInput({ blockId: block.id, fieldKey: 'text', selectionStart: e.target.selectionStart })}
                          style={{ fontFamily: 'monospace', fontSize: '13px' }}
                        />
                      </div>
                    )}

                    {/* TABLE BLOCK */}
                    {block.type === 'table' && (
                      <div style={{ overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => addTableRow(block.id)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <PlusCircle size={12} /> Linha
                          </button>
                          <button type="button" onClick={() => removeTableRow(block.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} disabled={block.data.rows.length <= 1}>
                            <MinusCircle size={12} /> Linha
                          </button>
                          <button type="button" onClick={() => addTableColumn(block.id)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <PlusCircle size={12} /> Coluna
                          </button>
                          <button type="button" onClick={() => removeTableColumn(block.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} disabled={block.data.headers.length <= 1}>
                            <MinusCircle size={12} /> Coluna
                          </button>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                          <thead>
                            <tr>
                              {block.data.headers.map((header, hIdx) => (
                                <th key={hIdx} style={{ padding: '6px', border: '1px solid var(--bg-card-border)' }}>
                                  <input
                                    type="text"
                                    className="input-field"
                                    value={header}
                                    onChange={(e) => updateTableHeader(block.id, hIdx, e.target.value)}
                                    style={{ fontWeight: 'bold', padding: '6px', fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.03)' }}
                                  />
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {block.data.rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} style={{ padding: '6px', border: '1px solid var(--bg-card-border)' }}>
                                    <input
                                      type="text"
                                      className="input-field"
                                      value={cell}
                                      onChange={(e) => updateTableCell(block.id, rIdx, cIdx, e.target.value)}
                                      onFocus={(e) => setActiveInput({ blockId: block.id, fieldKey: `cell_${rIdx}_${cIdx}`, selectionStart: e.target.selectionStart })}
                                      style={{ padding: '6px', fontSize: '12px' }}
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* DIVIDER BLOCK */}
                    {block.type === 'divider' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            height: '0',
                            borderTop: `${block.data.thickness || '2px'} solid ${block.data.color || '#cbd5e1'}`,
                            margin: '10px 0'
                          }} />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Espessura</label>
                            <select
                              className="input-field"
                              value={block.data.thickness || '2px'}
                              onChange={(e) => updateBlockData(block.id, 'thickness', e.target.value)}
                              style={{ width: '80px', padding: '4px 8px', height: '36px', fontSize: '13px', cursor: 'pointer' }}
                            >
                              <option value="1px">1px</option>
                              <option value="2px">2px</option>
                              <option value="3px">3px</option>
                              <option value="4px">4px</option>
                              <option value="5px">5px</option>
                            </select>
                          </div>
                          <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Cor</label>
                            <input
                              type="color"
                              className="input-field"
                              value={block.data.color || '#cbd5e1'}
                              onChange={(e) => updateBlockData(block.id, 'color', e.target.value)}
                              style={{ width: '50px', height: '36px', padding: '4px', cursor: 'pointer' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ))}

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px',
                padding: '16px', border: '2px dashed var(--bg-card-border)', borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255,255,255,0.01)', marginTop: '8px'
              }}>
                <button type="button" onClick={() => addBlock('title')} className="btn btn-secondary" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', alignItems: 'center', height: 'auto' }}>
                  <Heading size={18} />
                  <span style={{ fontSize: '12px' }}>+ Bloco de Título</span>
                </button>
                <button type="button" onClick={() => addBlock('text')} className="btn btn-secondary" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', alignItems: 'center', height: 'auto' }}>
                  <Type size={18} />
                  <span style={{ fontSize: '12px' }}>+ Bloco de Texto</span>
                </button>
                <button type="button" onClick={() => addBlock('clause')} className="btn btn-secondary" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', alignItems: 'center', height: 'auto' }}>
                  <AlignLeft size={18} />
                  <span style={{ fontSize: '12px' }}>+ Bloco de Cláusula</span>
                </button>
                <button type="button" onClick={() => addBlock('table')} className="btn btn-secondary" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', alignItems: 'center', height: 'auto' }}>
                  <Grid size={18} />
                  <span style={{ fontSize: '12px' }}>+ Bloco de Tabela</span>
                </button>
                <button type="button" onClick={() => addBlock('divider')} className="btn btn-secondary" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', alignItems: 'center', height: 'auto' }}>
                  <MinusCircle size={18} />
                  <span style={{ fontSize: '12px' }}>+ Divisória</span>
                </button>
                <button type="button" onClick={handleOpenImportModal} className="btn btn-secondary" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', alignItems: 'center', height: 'auto', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.04)' }}>
                  <AlignLeft size={18} />
                  <span style={{ fontSize: '12px' }}>Importar Cláusula</span>
                </button>
              </div>

            </div>

            {/* Sidebar panel */}
            <div className="sidebar-panel" style={{ height: 'fit-content', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'white', borderBottom: '1px solid var(--bg-card-border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} color="var(--primary)" /> Variáveis
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Foque em um campo de texto e clique no campo abaixo para injetá-lo.
              </p>

              {insertableFields.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  Nenhum campo disponível.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '400px' }}>
                  {insertableFields.map((field) => {
                    let cfg = {};
                    try { cfg = JSON.parse(field.placeholder); } catch {}
                    const realType = cfg.real_type || field.type;
                    const typeInfo = FIELD_TYPE_CONFIG[realType];
                    return (
                      <div key={field.key} className="variable-badge" onClick={() => insertVariable(field.key)} style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '11px' }}>{typeInfo?.icon}</span>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>{field.label}</span>
                          </div>
                          <span className="variable-key" style={{ fontSize: '10px', marginTop: '2px' }}>{`{${field.key}}`}</span>
                        </div>
                        <Plus size={12} color="var(--primary)" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', borderTop: '1px solid var(--bg-card-border)', paddingTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep(1)}>
              <ChevronLeft size={18} /> Voltar para os Campos
            </button>
            <button className="btn btn-primary" onClick={() => setCurrentStep(3)}>
              Configurar Identidade Visual <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 3 ===== */}
      {currentStep === 3 && (
        <div className="card">
          <h2 style={{ fontSize: '20px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={20} color="var(--primary)" /> Design Visual & Papel Timbrado
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Escolha o modelo de envoltório e personalize cores e metadados oficiais.
          </p>

          <div style={{ display: 'flex', gap: '32px', marginBottom: '32px', flexWrap: 'wrap', alignItems: 'stretch' }}>
            
            {/* Left Column: Controls (width 60%) */}
            <div style={{ flex: '1.5', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', minWidth: '450px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="input-label" style={{ marginBottom: '10px', display: 'block' }}>Escolha um Layout Padrão</label>
                  <div className="layouts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {[
                      { key: 'classic', label: 'Clássico', desc: 'Serifado, bordas discretas, visual de cartório.' },
                      { key: 'modern', label: 'Moderno', desc: 'Sem serifa, faixa lateral de cor forte, clean.' },
                      { key: 'minimalist', label: 'Minimalista', desc: 'Visual limpo, espaçado, foco total na tipografia.' },
                      { key: 'corporate', label: 'Corporativo', desc: 'Faixa colorida superior, cabeçalho moderno e limpo.' },
                      { key: 'executive', label: 'Executivo', desc: 'Borda dupla elegante, cabeçalho centralizado formal.' }
                    ].map(({ key, label, desc }) => (
                      <div key={key} className={`layout-card ${visualIdentity.theme === key ? 'selected' : ''}`}
                        style={{ padding: '12px', cursor: 'pointer', border: '1px solid var(--bg-card-border)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s ease', gridColumn: key === 'minimalist' ? 'span 2' : 'span 1' }}
                        onClick={() => setVisualIdentity({ ...visualIdentity, theme: key })}>
                        <div className={`layout-preview-box ${key}`} style={{ height: '8px', borderRadius: '2px', backgroundColor: visualIdentity.theme === key ? 'var(--primary)' : 'rgba(255,255,255,0.1)', marginBottom: '6px' }} />
                        <div className="layout-title" style={{ fontWeight: 'bold', fontSize: '13px', color: 'white' }}>{label}</div>
                        <div className="layout-desc" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Cor de Destaque (Hex)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="color" className="input-field" style={{ width: '60px', height: '45px', padding: '4px', cursor: 'pointer' }}
                      value={visualIdentity.primaryColor} onChange={(e) => setVisualIdentity({ ...visualIdentity, primaryColor: e.target.value })} />
                    <input type="text" className="input-field" value={visualIdentity.primaryColor}
                      onChange={(e) => setVisualIdentity({ ...visualIdentity, primaryColor: e.target.value })} placeholder="#1e293b" />
                  </div>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Fonte do Documento</label>
                  <select 
                    className="input-field" 
                    value={visualIdentity.fontFamily || 'Inter'} 
                    onChange={(e) => setVisualIdentity({ ...visualIdentity, fontFamily: e.target.value })}
                  >
                    <option value="Inter">Inter (Sans-serif moderno)</option>
                    <option value="Playfair Display">Playfair Display (Serifado clássico)</option>
                    <option value="Montserrat">Montserrat (Geométrico corporativo)</option>
                    <option value="Lora">Lora (Serifado executivo elegante)</option>
                    <option value="Roboto">Roboto (Clean e legível)</option>
                    <option value="Merriweather">Merriweather (Serifado tradicional)</option>
                    <option value="Arial">Arial (Sans-serif simples)</option>
                    <option value="Times New Roman">Times New Roman (Formal/Legal tradicional)</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">URL da Logomarca</label>
                  <input type="text" className="input-field" placeholder="https://suaempresa.com/logo.png"
                    value={visualIdentity.logoUrl} onChange={(e) => setVisualIdentity({ ...visualIdentity, logoUrl: e.target.value })} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Texto do Cabeçalho Timbrado</label>
                  <input type="text" className="input-field" placeholder="Ex: DEPARTAMENTO JURÍDICO"
                    value={visualIdentity.headerText} onChange={(e) => setVisualIdentity({ ...visualIdentity, headerText: e.target.value })} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Texto do Rodapé Institucional</label>
                  <textarea className="input-field" style={{ minHeight: '80px', resize: 'none' }}
                    placeholder="Ex: Endereço, e-mail, CNPJ"
                    value={visualIdentity.footerText} onChange={(e) => setVisualIdentity({ ...visualIdentity, footerText: e.target.value })} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Fundo Timbrado Completo (URL da Imagem A4)</label>
                  <input type="text" className="input-field" placeholder="https://suaempresa.com/papel-timbrado.png"
                    value={visualIdentity.backgroundImageUrl || ''} onChange={(e) => setVisualIdentity({ ...visualIdentity, backgroundImageUrl: e.target.value })} />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    Opcional. Uma imagem A4 que servirá de fundo completo (marca d'água / papel timbrado completo) em todas as páginas do PDF.
                  </small>
                </div>
              </div>
            </div>

            {/* Right Column: Live A4 PDF Mockup Preview (width 40%) */}
            <div className="a4-preview-container" style={{
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              backgroundColor: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid var(--bg-card-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              minWidth: '300px',
              height: 'fit-content'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '14px', display: 'block' }}>
                Visualização do Layout em Tempo Real
              </span>
              <div className="a4-sheet-mockup" style={{
                width: '100%',
                maxWidth: '260px',
                height: '368px',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                borderRadius: '4px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                backgroundImage: visualIdentity.backgroundImageUrl ? `url(${visualIdentity.backgroundImageUrl})` : 'none',
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                fontFamily: visualIdentity.fontFamily === 'Inter' ? "'Inter', sans-serif" : 
                            visualIdentity.fontFamily === 'Playfair Display' ? "'Playfair Display', serif" :
                            visualIdentity.fontFamily === 'Montserrat' ? "'Montserrat', sans-serif" :
                            visualIdentity.fontFamily === 'Lora' ? "'Lora', serif" :
                            visualIdentity.fontFamily === 'Roboto' ? "'Roboto', sans-serif" :
                            visualIdentity.fontFamily === 'Merriweather' ? "'Merriweather', serif" :
                            visualIdentity.fontFamily === 'Arial' ? "Arial, sans-serif" : "'Times New Roman', serif",
                borderTop: visualIdentity.theme === 'classic' ? `4px solid ${visualIdentity.primaryColor || '#1e293b'}` : 'none',
                borderLeft: visualIdentity.theme === 'modern' ? `5px solid ${visualIdentity.primaryColor || '#1e293b'}` : 'none',
                padding: visualIdentity.theme === 'corporate' ? '0 16px 16px 16px' : '16px',
              }}>
                {/* Executive Border Double */}
                {visualIdentity.theme === 'executive' && (
                  <div style={{
                    position: 'absolute', top: '6px', left: '6px', right: '6px', bottom: '6px',
                    border: `1px solid ${visualIdentity.primaryColor || '#1e293b'}`,
                    pointerEvents: 'none'
                  }} />
                )}
                {visualIdentity.theme === 'executive' && (
                  <div style={{
                    position: 'absolute', top: '8px', left: '8px', right: '8px', bottom: '8px',
                    border: `2px double ${visualIdentity.primaryColor || '#1e293b'}`,
                    pointerEvents: 'none'
                  }} />
                )}

                {/* Corporate top header band */}
                {visualIdentity.theme === 'corporate' ? (
                  <div style={{
                    backgroundColor: visualIdentity.primaryColor || '#1e293b',
                    color: '#ffffff',
                    padding: '8px 12px',
                    margin: '0 -16px 12px -16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    <span>{visualIdentity.headerText || 'DEPARTAMENTO JURÍDICO'}</span>
                    {visualIdentity.logoUrl && <img src={visualIdentity.logoUrl} alt="Logo" style={{ maxHeight: '12px' }} />}
                  </div>
                ) : (
                  /* Normal Header layout for other themes */
                  <div style={{
                    display: 'flex',
                    flexDirection: visualIdentity.theme === 'classic' || visualIdentity.theme === 'executive' ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: visualIdentity.theme === 'classic' ? '1px double #e2e8f0' : visualIdentity.theme === 'modern' ? '1px solid #f1f5f9' : 'none',
                    paddingBottom: '6px',
                    marginBottom: '12px',
                    textAlign: 'center'
                  }}>
                    {visualIdentity.logoUrl && (
                      <img src={visualIdentity.logoUrl} alt="Logo" style={{
                        maxHeight: '16px',
                        marginBottom: visualIdentity.theme === 'classic' || visualIdentity.theme === 'executive' ? '4px' : '0',
                        filter: visualIdentity.theme === 'minimalist' ? 'grayscale(100%)' : 'none'
                      }} />
                    )}
                    <div style={{
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: visualIdentity.theme === 'classic' || visualIdentity.theme === 'executive' ? visualIdentity.primaryColor : '#0f172a',
                      textTransform: 'uppercase'
                    }}>
                      {visualIdentity.headerText || 'DEPARTAMENTO JURÍDICO'}
                    </div>
                  </div>
                )}

                {/* Contract Sample Body Content */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 4px', overflow: 'hidden' }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    textAlign: visualIdentity.theme === 'classic' || visualIdentity.theme === 'executive' ? 'center' : 'left',
                    color: visualIdentity.theme === 'classic' || visualIdentity.theme === 'executive' || visualIdentity.theme === 'corporate' ? visualIdentity.primaryColor : '#0f172a',
                    textTransform: 'uppercase',
                    marginBottom: '4px'
                  }}>
                    CONTRATO DE PRESTAÇÃO
                  </div>
                  
                  {/* Sample text block */}
                  <div style={{ fontSize: '6px', lineHeight: '1.5', textAlign: 'justify', color: '#475569' }}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam id sodales arcu. 
                    Pelo presente instrumento, as partes acordam que a prestação de serviços ocorrerá de acordo com as regras estabelecidas.
                  </div>

                  {/* Sample clause block */}
                  <div style={{ marginTop: '4px' }}>
                    <div style={{
                      fontSize: '7px',
                      fontWeight: 'bold',
                      color: visualIdentity.primaryColor || '#1e293b',
                      borderLeft: visualIdentity.theme === 'corporate' ? `2px solid ${visualIdentity.primaryColor}` : 'none',
                      paddingLeft: visualIdentity.theme === 'corporate' ? '4px' : '0',
                      textAlign: visualIdentity.theme === 'executive' ? 'center' : 'left',
                      textTransform: visualIdentity.theme === 'executive' ? 'uppercase' : 'none',
                      marginBottom: '2px'
                    }}>
                      Cláusula Primeira - Do Objeto
                    </div>
                    <div style={{ fontSize: '6px', lineHeight: '1.5', textAlign: 'justify', color: '#475569' }}>
                      O objeto deste contrato consiste na consultoria empresarial e desenvolvimento tecnológico solicitado pelas partes contratantes.
                    </div>
                  </div>

                  {/* Sample table block */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '5px', margin: '4px 0', border: '1px solid #cbd5e1' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid #cbd5e1' }}>
                        <th style={{ border: '1px solid #cbd5e1', padding: '2px', textAlign: 'left', color: visualIdentity.primaryColor || '#1e293b' }}>Item</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '2px', textAlign: 'left', color: visualIdentity.primaryColor || '#1e293b' }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>Desenvolvimento</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>R$ 5.000,00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer container mockup */}
                <div style={{
                  marginTop: 'auto',
                  borderTop: visualIdentity.theme === 'classic' || visualIdentity.theme === 'modern' || visualIdentity.theme === 'corporate' ? '1px solid #e2e8f0' : 'none',
                  paddingTop: '6px',
                  display: 'flex',
                  justifyContent: visualIdentity.theme === 'modern' || visualIdentity.theme === 'corporate' ? 'space-between' : 'center',
                  fontSize: '6px',
                  color: '#64748b'
                }}>
                  <span>{visualIdentity.footerText || 'DocGenerator Oficial'}</span>
                  {(visualIdentity.theme === 'modern' || visualIdentity.theme === 'corporate') && (
                    <span style={{ fontWeight: 'bold', color: visualIdentity.primaryColor }}>Confidencial</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--bg-card-border)', paddingTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep(2)}>
              <ChevronLeft size={18} /> Voltar para o Editor
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={isLoading} style={{ paddingLeft: '32px', paddingRight: '32px' }}>
              {isLoading ? 'Salvando...' : (<><Save size={18} /> Salvar Alterações</>)}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT CLAUSE FROM LIBRARY */}
      {isImportModalOpen && (
        <div className="modal-backdrop" onClick={(e) => e.target.className === 'modal-backdrop' && setIsImportModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '700px', padding: '28px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--primary), var(--secondary), transparent)',
            }}></div>

            <button className="modal-close-btn" onClick={() => setIsImportModalOpen(false)} title="Fechar">
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlignLeft size={20} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Importar Cláusula da Biblioteca</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 0 0' }}>Selecione uma cláusula pré-cadastrada para adicionar ao seu modelo.</p>
              </div>
            </div>

            {/* Search within Library */}
            <div style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '40px', margin: 0 }}
                placeholder="Pesquisar na biblioteca..."
                value={searchLibraryQuery}
                onChange={(e) => setSearchLibraryQuery(e.target.value)}
              />
            </div>

            {/* Clauses List */}
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              {isLoadingLibrary ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '30px', height: '30px', border: '3px solid var(--bg-card-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px auto' }} />
                  <span style={{ fontSize: '13px' }}>Buscando cláusulas...</span>
                </div>
              ) : libraryClauses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px var(--radius-md)', border: '1px dashed var(--bg-card-border)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>Você ainda não tem cláusulas cadastradas na sua biblioteca.</p>
                  <a href="/clauses" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ marginTop: '12px', display: 'inline-flex', gap: '6px', fontSize: '12px', padding: '6px 12px' }}>
                    Ir para Biblioteca de Cláusulas
                  </a>
                </div>
              ) : (
                (() => {
                  const filtered = libraryClauses.filter(c =>
                    c.title.toLowerCase().includes(searchLibraryQuery.toLowerCase()) ||
                    c.content.toLowerCase().includes(searchLibraryQuery.toLowerCase())
                  );
                  if (filtered.length === 0) {
                    return (
                      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '13px', padding: '20px 0' }}>
                        Nenhuma cláusula encontrada para "{searchLibraryQuery}".
                      </p>
                    );
                  }
                  return filtered.map((clause) => (
                    <div
                      key={clause.id}
                      className="card clause-library-item"
                      style={{
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid var(--bg-card-border)',
                        backgroundColor: 'rgba(255,255,255,0.01)',
                      }}
                      onClick={() => handleImportClause(clause)}
                    >
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' }}>{clause.title}</h4>
                      <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        lineHeight: '1.5',
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        whiteSpace: 'pre-wrap'
                      }}>{clause.content}</p>
                    </div>
                  ));
                })()
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid var(--bg-card-border)', paddingTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsImportModalOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

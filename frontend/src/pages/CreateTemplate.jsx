import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';

import { 
  Plus, Trash2, ChevronRight, ChevronLeft, Save, Sparkles, 
  FormInput, FileText, Palette, Info, Bold, Italic, List, ListOrdered, 
  Heading1, Heading2, Table as TableIcon, Columns, Rows, PlusCircle, MinusCircle, Type,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Eraser
} from 'lucide-react';

// Inicializar Supabase com as credenciais do usuário
const supabase = createClient(
  'https://raxmdrunbidfmlvsldnj.supabase.co',
  'sb_publishable_L-ktxwLir7iUTMCVF1Gaew_bI0kYbKT'
);

// Função para gerar slug/key limpa
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s_]/g, '') // remove caracteres especiais
    .trim()
    .replace(/\s+/g, '_'); // substitui espaços por underscore
};

export default function CreateTemplate() {
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Geral');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  
  // Passo 1: Lista de Campos Reativos
  const [fields, setFields] = useState([
    { label: 'Nome do Cliente', key: 'nome_cliente', type: 'text', required: true, placeholder: 'Ex: João Silva' },
    { label: 'Data de Início', key: 'data_inicio', type: 'date', required: true, placeholder: '' },
    { label: 'Valor do Contrato', key: 'valor_contrato', type: 'number', required: false, placeholder: 'Ex: 1500.00' }
  ]);
  
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');

  // Passo 3: Identidade Visual
  const [visualIdentity, setVisualIdentity] = useState({
    theme: 'classic',
    primaryColor: '#1e293b',
    headerText: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS',
    footerText: 'Este documento é sigiloso e tem validade jurídica em todo território nacional.',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/3616/3616223.png', // Logo padrão corporativo
    margins: { top: '2.5cm', bottom: '2.5cm', left: '3.0cm', right: '2.0cm' }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  // Inicializar o Editor TipTap com Extensões de Tabela
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          style: 'border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; margin: 15px 0;'
        }
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          style: 'border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; color: #1e293b; font-weight: bold; text-align: left;'
        }
      }),
      TableCell.configure({
        HTMLAttributes: {
          style: 'border: 1px solid #cbd5e1; padding: 10px; color: #334155;'
        }
      })
    ],
    content: `
      <h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
      <p>Pelo presente instrumento, eu, <b>{nome_cliente}</b>, aceito os termos acordados a partir da data de <b>{data_inicio}</b>.</p>
      <p>As especificações comerciais constam na tabela abaixo:</p>
      <table>
        <tbody>
          <tr>
            <th>Descrição do Serviço</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Consultoria Técnica Mensal</td>
            <td>R$ {valor_contrato}</td>
          </tr>
        </tbody>
      </table>
      <p>Fica eleito o foro da comarca local para dirimir quaisquer dúvidas.</p>
    `,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    }
  });

  // Funções do Passo 1 (FormBuilder)
  const handleAddField = (e) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;

    const newKey = generateSlug(newFieldLabel);
    
    // Evitar chaves duplicadas
    if (fields.some(f => f.key === newKey)) {
      alert('Já existe um campo com este nome ou chave gerada.');
      return;
    }

    setFields([
      ...fields,
      {
        label: newFieldLabel.trim(),
        key: newKey,
        type: newFieldType,
        required: newFieldRequired,
        placeholder: newFieldPlaceholder.trim()
      }
    ]);

    // Limpar campos de input
    setNewFieldLabel('');
    setNewFieldRequired(false);
    setNewFieldPlaceholder('');
  };

  const handleRemoveField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  // Injetar variável dinamicamente usando a API do TipTap
  const insertVariable = (key) => {
    if (editor) {
      editor.chain().focus().insertContent(`{${key}}`).run();
    }
  };

  // Modificar tamanho de fonte envolvendo a seleção atual com uma tag span
  const applyFontSize = (size) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) {
      alert('Selecione um texto antes de alterar o tamanho da fonte.');
      return;
    }
    const selectedText = editor.state.doc.textBetween(from, to);
    editor.chain().focus().insertContent(`<span style="font-size: ${size};">${selectedText}</span>`).run();
  };

  // Alterar o alinhamento de texto inserindo um bloco com estilo css text-align
  const applyTextAlign = (alignment) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) {
      // Se não há seleção, aplica ao bloco do cursor
      editor.chain().focus().insertContent(`<div style="text-align: ${alignment}; font-family: inherit;">&nbsp;</div>`).run();
      return;
    }
    const selectedText = editor.state.doc.textBetween(from, to);
    editor.chain().focus().insertContent(`<div style="text-align: ${alignment}; font-family: inherit;">${selectedText}</div>`).run();
  };

  // Alterar a cor do texto selecionado usando um span com inline styles
  const applyTextColor = (color) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) {
      alert('Selecione um texto antes de alterar a cor.');
      return;
    }
    const selectedText = editor.state.doc.textBetween(from, to);
    editor.chain().focus().insertContent(`<span style="color: ${color};">${selectedText}</span>`).run();
  };

  // Limpar formatação e nós customizados do texto selecionado
  const clearFormatting = () => {
    if (!editor) return;
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  };


  // Salvar o Payload no Supabase (Templates + Template_Fields)
  const handleSaveTemplate = async () => {
    if (!title.trim()) {
      setSaveStatus({ type: 'error', message: 'Por favor, insira um título para o modelo.' });
      setCurrentStep(1);
      return;
    }

    const currentContent = editor ? editor.getHTML() : content;
    if (!currentContent.trim() || currentContent === '<p></p>') {
      setSaveStatus({ type: 'error', message: 'O conteúdo do contrato não pode estar vazio.' });
      setCurrentStep(2);
      return;
    }

    setIsLoading(true);
    setSaveStatus({ type: '', message: '' });

    try {
      // 1. Obter usuário autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Sua sessão expirou ou você não está autenticado. Por favor, faça login novamente.');
      }
      const userId = user.id;

      // 2. Inserir na tabela "templates"
      const { data: templateData, error: templateError } = await supabase
        .from('templates')
        .insert({
          user_id: userId,
          title: title.trim(),
          category: category,
          description: description.trim(),
          content: currentContent,
          visual_identity: visualIdentity
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // 3. Inserir todos os campos vinculados na tabela "template_fields"
      if (fields.length > 0) {
        const fieldsPayload = fields.map((f, index) => ({
          template_id: templateData.id,
          label: f.label,
          key: f.key,
          type: f.type,
          required: f.required,
          placeholder: f.placeholder,
          display_order: index
        }));

        const { error: fieldsError } = await supabase
          .from('template_fields')
          .insert(fieldsPayload);

        if (fieldsError) throw fieldsError;
      }

      setSaveStatus({
        type: 'success',
        message: `Sucesso! Modelo "${templateData.title}" criado e ${fields.length} variáveis vinculadas.`
      });
      
      // Resetar estados
      setTitle('');
      setCategory('Geral');
      setDescription('');
      editor?.commands.setContent('<p></p>');
      setFields([]);

    } catch (error) {
      console.error('❌ Erro completo ao salvar:', error);
      setSaveStatus({
        type: 'error',
        message: `Falha ao salvar modelo no Supabase: ${error.message || 'Verifique sua conexão ou políticas de RLS.'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px', background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Assistente de Criação de Modelo
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Crie formulários inteligentes e templates timbrados integrados em poucos minutos.</p>
      </div>

      {/* Indicador de Etapas (Wizard Steps) */}
      <div className="steps-container">
        <div className={`step-node ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <FormInput size={18} />
          <span className="step-label">1. Formulário</span>
        </div>
        <div className={`step-node ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <FileText size={18} />
          <span className="step-label">2. Contrato</span>
        </div>
        <div className={`step-node ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
          <Palette size={18} />
          <span className="step-label">3. Identidade</span>
        </div>
      </div>

      {/* Exibição de Status de Salvamento */}
      {saveStatus.message && (
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: saveStatus.type === 'success' ? 'var(--success-glow)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${saveStatus.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: saveStatus.type === 'success' ? '#34d399' : '#f87171',
          marginBottom: '24px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <Info size={18} />
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* ETAPA 1: CRIADOR DO FORMULÁRIO */}
      {currentStep === 1 && (
        <div className="card">
          <h2 style={{ fontSize: '20px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--primary)" /> Configurações Básicas & Campos Dinâmicos
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Defina o título do modelo e os campos que o usuário precisará preencher. O sistema gerará chaves `{`especiais`}` automáticas.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: '20px', marginBottom: '24px' }}>
            <div className="input-group">
              <label className="input-label">Título do Modelo *</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ex: Contrato de Prestação de Serviços de TI" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
            </div>
            <div className="input-group">
              <label className="input-label">Categoria *</label>
              <select 
                className="input-field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="Geral">Geral</option>
                <option value="Contrato">Contrato</option>
                <option value="Procuração">Procuração</option>
                <option value="Declaração">Declaração</option>
                <option value="Relatório">Relatório</option>
                <option value="Recibo">Recibo</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Descrição Breve</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ex: Modelo padrão para contratação de freelancers" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--bg-card-border)', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-primary)' }}>Campos Personalizados do Formulário</h3>
            
            {/* Lista de Campos Adicionados */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {fields.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--bg-card-border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                  Nenhum campo adicionado ainda. Crie um campo abaixo!
                </div>
              ) : (
                fields.map((field, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--bg-card-border)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <div>
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>{field.label}</span>
                      <span style={{ marginLeft: '10px', fontSize: '11px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '10px' }}>
                        {field.type}
                      </span>
                      {field.required && (
                        <span style={{ marginLeft: '6px', fontSize: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                          obrigatório
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <code style={{ color: 'var(--secondary)', fontSize: '12px', fontWeight: '600' }}>{`{${field.key}}`}</code>
                      <button 
                        onClick={() => handleRemoveField(idx)} 
                        className="btn btn-danger" 
                        style={{ padding: '8px', borderRadius: '6px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Formulário para Adicionar Novo Campo */}
            <form onSubmit={handleAddField} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 2fr auto',
              gap: '16px',
              alignItems: 'end',
              backgroundColor: 'rgba(255,255,255,0.01)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--bg-card-border)'
            }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Rótulo / Label *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Nome da Empresa" 
                  value={newFieldLabel} 
                  onChange={(e) => setNewFieldLabel(e.target.value)} 
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Tipo do Campo</label>
                <select 
                  className="input-field"
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="text">Texto Simples</option>
                  <option value="textarea">Área de Texto</option>
                  <option value="number">Número</option>
                  <option value="date">Data</option>
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <label className="input-label" style={{ marginBottom: '8px' }}>Obrigatório?</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input 
                    type="checkbox" 
                    checked={newFieldRequired} 
                    onChange={(e) => setNewFieldRequired(e.target.checked)} 
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                  <span>Sim</span>
                </label>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Placeholder (Dica)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Razão Social Completa" 
                  value={newFieldPlaceholder} 
                  onChange={(e) => setNewFieldPlaceholder(e.target.value)} 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '45px', padding: '0 16px' }}>
                <Plus size={20} /> Adicionar
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
            <button className="btn btn-primary" onClick={() => setCurrentStep(2)}>
              Ir para o Editor <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 2: O EDITOR DO CONTRATO (TipTap Editor Completo com Tabelas e Fontes) */}
      {currentStep === 2 && (
        <div className="card">
          <h2 style={{ fontSize: '20px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--primary)" /> Editor de Contrato Profissional WYSIWYG
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Editor rico completo com suporte a tabelas e fontes. Destaque um texto para alterar o tamanho da fonte.
          </p>

          <div className="editor-layout">
            <div className="wysiwyg-mock">
              {/* Toolbar Completa do TipTap */}
              {editor && (
                <div className="wysiwyg-toolbar" style={{ borderBottom: '1px solid var(--bg-card-border)', padding: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => editor.chain().focus().toggleBold().run()} 
                    className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
                    style={{ fontWeight: 'bold', color: editor.isActive('bold') ? 'var(--primary)' : 'inherit' }}
                    title="Negrito"
                  >
                    <Bold size={16} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => editor.chain().focus().toggleItalic().run()} 
                    className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
                    style={{ fontStyle: 'italic', color: editor.isActive('italic') ? 'var(--primary)' : 'inherit' }}
                    title="Itálico"
                  >
                    <Italic size={16} />
                  </button>
                  <div style={{ width: '1px', backgroundColor: 'var(--bg-card-border)', margin: '0 4px' }}></div>
                  <button 
                    type="button" 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                    className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
                    title="Título 1"
                  >
                    <Heading1 size={16} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
                    className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
                    title="Título 2"
                  >
                    <Heading2 size={16} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => editor.chain().focus().toggleBulletList().run()} 
                    className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
                    title="Lista com Marcadores"
                  >
                    <List size={16} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                    className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
                    title="Lista Numerada"
                  >
                    <ListOrdered size={16} />
                  </button>
                  
                  <div style={{ width: '1px', backgroundColor: 'var(--bg-card-border)', margin: '0 4px' }}></div>
                  
                  {/* Alinhamento de Texto */}
                  <button 
                    type="button" 
                    onClick={() => applyTextAlign('left')} 
                    className="toolbar-btn"
                    title="Alinhar à Esquerda"
                  >
                    <AlignLeft size={16} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyTextAlign('center')} 
                    className="toolbar-btn"
                    title="Alinhar ao Centro"
                  >
                    <AlignCenter size={16} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyTextAlign('right')} 
                    className="toolbar-btn"
                    title="Alinhar à Direita"
                  >
                    <AlignRight size={16} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyTextAlign('justify')} 
                    className="toolbar-btn"
                    title="Justificar"
                  >
                    <AlignJustify size={16} />
                  </button>

                  <div style={{ width: '1px', backgroundColor: 'var(--bg-card-border)', margin: '0 4px' }}></div>
                  
                  {/* Controles de Tamanho de Fonte */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} title="Tamanho da Fonte">
                    <Type size={16} style={{ color: 'var(--text-secondary)' }} />
                    <select 
                      className="input-field" 
                      style={{ width: '90px', padding: '4px 8px', fontSize: '12px', height: '30px', backgroundColor: 'rgba(255,255,255,0.02)' }}
                      onChange={(e) => {
                        applyFontSize(e.target.value);
                        e.target.value = ''; // reset select indicator
                      }}
                    >
                      <option value="">Fonte...</option>
                      <option value="12px">Pequeno (12px)</option>
                      <option value="15px">Padrão (15px)</option>
                      <option value="18px">Médio (18px)</option>
                      <option value="24px">Grande (24px)</option>
                      <option value="32px">Título (32px)</option>
                    </select>
                  </div>

                  <div style={{ width: '1px', backgroundColor: 'var(--bg-card-border)', margin: '0 4px' }}></div>

                  {/* Cor do Texto */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} title="Cor do Texto">
                    <Palette size={16} style={{ color: 'var(--text-secondary)' }} />
                    <select 
                      className="input-field" 
                      style={{ width: '95px', padding: '4px 8px', fontSize: '12px', height: '30px', backgroundColor: 'rgba(255,255,255,0.02)' }}
                      onChange={(e) => {
                        if (e.target.value) {
                          applyTextColor(e.target.value);
                          e.target.value = ''; // reset
                        }
                      }}
                    >
                      <option value="">Cor...</option>
                      <option value="#000000">Preto ⬛</option>
                      <option value="#6366f1">Roxo 🟪</option>
                      <option value="#3b82f6">Azul 🟦</option>
                      <option value="#10b981">Verde 🟩</option>
                      <option value="#ef4444">Vermelho 🟥</option>
                      <option value="#64748b">Cinza ⬜</option>
                    </select>
                  </div>

                  <button 
                    type="button" 
                    onClick={clearFormatting} 
                    className="toolbar-btn"
                    title="Limpar Formatação"
                  >
                    <Eraser size={16} />
                  </button>

                  <div style={{ width: '1px', backgroundColor: 'var(--bg-card-border)', margin: '0 8px' }}></div>

                  {/* Controles de Tabela */}
                  <button 
                    type="button" 
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} 
                    className="toolbar-btn" 
                    title="Criar Tabela"
                    style={{ gap: '4px', width: 'auto', padding: '0 8px' }}
                  >
                    <TableIcon size={16} /> <span style={{ fontSize: '11px' }}>Inserir Tabela</span>
                  </button>
                  
                  {editor.isActive('table') && (
                    <div style={{ display: 'inline-flex', gap: '4px', backgroundColor: 'rgba(99, 102, 241, 0.05)', padding: '2px', borderRadius: '6px' }}>
                      <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="toolbar-btn" title="Adicionar Linha"><Rows size={14} /></button>
                      <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="toolbar-btn" title="Adicionar Coluna"><Columns size={14} /></button>
                      <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="toolbar-btn" style={{ color: 'var(--danger)' }} title="Deletar Linha"><MinusCircle size={14} /></button>
                      <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="toolbar-btn" style={{ color: 'var(--danger)' }} title="Deletar Coluna"><MinusCircle size={14} /></button>
                      <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="toolbar-btn" style={{ color: 'var(--danger)' }} title="Deletar Tabela"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              )}
              {/* TipTap EditorContent Container */}
              <div style={{ backgroundColor: 'var(--bg-input)', minHeight: '350px' }}>
                <EditorContent editor={editor} />
              </div>
            </div>

            {/* Painel Lateral de Variáveis */}
            <div className="sidebar-panel">
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'white', borderBottom: '1px solid var(--bg-card-border)', paddingBottom: '10px' }}>
                Variáveis Disponíveis
              </h3>
              {fields.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  Nenhuma variável cadastrada no Passo 1. Volte e adicione.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '350px' }}>
                  {fields.map((field) => (
                    <div 
                      key={field.key} 
                      className="variable-badge" 
                      onClick={() => insertVariable(field.key)}
                      title="Clique para inserir na posição do cursor"
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>{field.label}</span>
                        <span className="variable-key">{`{${field.key}}`}</span>
                      </div>
                      <Plus size={14} color="var(--primary)" />
                    </div>
                  ))}
                </div>
              )}
              <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.1)', marginTop: 'auto' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  💡 <strong>Dica do Editor:</strong> Posicione seu cursor dentro de uma célula da tabela e clique em uma variável ao lado para inseri-la de forma perfeita!
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

      {/* ETAPA 3: IDENTIDADE VISUAL & SALVAMENTO */}
      {currentStep === 3 && (
        <div className="card">
          <h2 style={{ fontSize: '20px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={20} color="var(--primary)" /> Design Visual & Papel Timbrado
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Escolha o modelo de envoltório de papel timbrado institucional e personalize cores e metadados oficiais.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
            
            {/* Esquerda: Configurações de Design */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="input-label" style={{ marginBottom: '10px', display: 'block' }}>Escolha um Layout Padrão</label>
                <div className="layouts-grid">
                  <div 
                    className={`layout-card ${visualIdentity.theme === 'classic' ? 'selected' : ''}`}
                    onClick={() => setVisualIdentity({ ...visualIdentity, theme: 'classic' })}
                  >
                    <div className="layout-preview-box classic"></div>
                    <div className="layout-title">Clássico</div>
                    <div className="layout-desc">Serifado, bordas discretas, visual de cartório.</div>
                  </div>
                  <div 
                    className={`layout-card ${visualIdentity.theme === 'modern' ? 'selected' : ''}`}
                    onClick={() => setVisualIdentity({ ...visualIdentity, theme: 'modern' })}
                  >
                    <div className="layout-preview-box modern"></div>
                    <div className="layout-title">Moderno</div>
                    <div className="layout-desc">Sem serifa, faixa lateral de cor forte, clean.</div>
                  </div>
                  <div 
                    className={`layout-card ${visualIdentity.theme === 'minimalist' ? 'selected' : ''}`}
                    onClick={() => setVisualIdentity({ ...visualIdentity, theme: 'minimalist' })}
                  >
                    <div className="layout-preview-box minimalist"></div>
                    <div className="layout-title">Minimalista</div>
                    <div className="layout-desc">Visual limpo, espaçado, foco total na tipografia.</div>
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Cor de Destaque / Identidade (Hex)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="color" 
                    className="input-field" 
                    style={{ width: '60px', height: '45px', padding: '4px', cursor: 'pointer' }}
                    value={visualIdentity.primaryColor}
                    onChange={(e) => setVisualIdentity({ ...visualIdentity, primaryColor: e.target.value })}
                  />
                  <input 
                    type="text" 
                    className="input-field" 
                    value={visualIdentity.primaryColor}
                    onChange={(e) => setVisualIdentity({ ...visualIdentity, primaryColor: e.target.value })}
                    placeholder="#1e293b"
                  />
                </div>
              </div>
            </div>

            {/* Direita: Textos do Timbrado */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">URL da Logomarca Institucional</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="https://suaempresa.com/logo.png" 
                  value={visualIdentity.logoUrl}
                  onChange={(e) => setVisualIdentity({ ...visualIdentity, logoUrl: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Texto do Cabeçalho Timbrado</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: DEPARTAMENTO JURÍDICO - EMPRESA S.A." 
                  value={visualIdentity.headerText}
                  onChange={(e) => setVisualIdentity({ ...visualIdentity, headerText: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Texto do Rodapé Institucional</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '80px', resize: 'none' }}
                  placeholder="Ex: Endereço comercial, e-mail de contato e CNPJ." 
                  value={visualIdentity.footerText}
                  onChange={(e) => setVisualIdentity({ ...visualIdentity, footerText: e.target.value })}
                />
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--bg-card-border)', paddingTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep(2)}>
              <ChevronLeft size={18} /> Voltar para o Editor
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleSaveTemplate}
              disabled={isLoading}
              style={{ paddingLeft: '32px', paddingRight: '32px' }}
            >
              {isLoading ? 'Salvando no Supabase...' : (
                <>
                  <Save size={18} /> Salvar Modelo Completo
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

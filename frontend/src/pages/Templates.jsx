import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Plus, Search, Trash2, FileCheck, X, FileText, AlertCircle, Pencil, FileDown } from 'lucide-react';
import CreateTemplate from './CreateTemplate';
import EditTemplate from './EditTemplate';

export default function Templates({ onEmitTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');
      const { data, error } = await supabase
        .from('templates')
        .select('id, title, description, category, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Erro ao buscar templates:', err);
      setErrorMessage('Não foi possível carregar seus modelos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = async (templateId, templateTitle) => {
    try {
      const { data: fields, error } = await supabase
        .from('template_fields')
        .select('key, label, type')
        .eq('template_id', templateId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Filter out purely visual layout fields
      const inputFields = (fields || []).filter(f => !['title', 'subtitle', 'divider'].includes(f.type));

      // CSV columns: first is document_title, then each key
      const headers = ['titulo_do_documento', ...inputFields.map(f => f.key)];
      const labels = ['Título do Contrato (Ex: Contrato de Locacao - Joao)', ...inputFields.map(f => `${f.label} (${f.type})`)];

      // Build CSV content with BOM for Excel UTF-8 compliance
      const csvContent = '\uFEFF' + [
        headers.join(';'),
        labels.join(';')
      ].join('\r\n');

      // Trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanTitle = templateTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.download = `modelo_lote_${cleanTitle}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao baixar modelo CSV:', err);
      alert('Erro ao buscar campos do modelo para download: ' + err.message);
    }
  };

  const handleDeleteTemplate = async (id, title) => {
    if (!window.confirm(`Excluir permanentemente o modelo "${title}"? Todos os campos vinculados também serão apagados.`)) return;
    try {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) throw error;
      setTemplates(templates.filter(t => t.id !== id));
    } catch (err) {
      alert('Falha ao excluir modelo.');
    }
  };

  const categories = ['Todos', ...new Set(templates.map(t => t.category || 'Geral'))];

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todos' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Formatar data de criação
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '4px', background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Modelos de Documentos
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gerencie, edite e emita seus contratos automatizados.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
          <Plus size={18} /> Novo Modelo
        </button>
      </div>

      {errorMessage && (
        <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid var(--danger)', color: '#f87171', marginBottom: '24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle size={18} /><span>{errorMessage}</span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
              background: selectedCategory === cat ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${selectedCategory === cat ? 'var(--primary)' : 'var(--bg-card-border)'}`,
              padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', transition: 'var(--transition-fast)'
            }}>
              {cat}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" className="input-field" style={{ paddingLeft: '40px' }} placeholder="Pesquisar modelos..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--bg-card-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <span>Buscando modelos...</span>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px auto', display: 'block', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Nenhum modelo encontrado</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px auto', fontSize: '14px' }}>
            {searchQuery || selectedCategory !== 'Todos'
              ? 'Nenhum modelo corresponde aos critérios de pesquisa.'
              : 'Você ainda não cadastrou nenhum modelo. Crie seu primeiro agora!'}
          </p>
          {!searchQuery && selectedCategory === 'Todos' && (
            <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
              <Plus size={18} /> Criar Primeiro Modelo
            </button>
          )}
        </div>
      ) : (
        <div className="templates-grid">
          {filteredTemplates.map(template => (
            <div className="template-card" key={template.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="template-card-header" style={{ flex: 1 }}>
                <span className="category-badge">{template.category || 'Geral'}</span>
                <h3 style={{ fontSize: '17px', fontWeight: 'bold', marginBottom: '8px', color: 'white', marginTop: '8px' }}>
                  {template.title}
                </h3>
                <p style={{
                  color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5',
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {template.description || 'Sem descrição cadastrada para este modelo.'}
                </p>
                {template.created_at && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>
                    Criado em {formatDate(template.created_at)}
                  </p>
                )}
              </div>

              <div className="template-card-actions" style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--bg-card-border)', marginTop: '12px' }}>
                {/* Emitir */}
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px 12px', fontSize: '13px' }}
                  onClick={() => onEmitTemplate(template.id)}
                  title="Emitir documento com este modelo"
                >
                  <FileCheck size={15} /> Emitir
                </button>

                {/* Editar */}
                <button
                  className="btn btn-secondary"
                  style={{
                    padding: '10px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                    border: '1px solid rgba(99,102,241,0.3)', color: 'var(--primary)',
                    backgroundColor: 'rgba(99,102,241,0.08)'
                  }}
                  onClick={() => setEditingTemplateId(template.id)}
                  title="Editar este modelo"
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.08)'; }}
                >
                  <Pencil size={15} /> Editar
                </button>

                {/* Baixar Planilha Modelo */}
                <button
                  className="btn btn-secondary btn-icon"
                  style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
                    border: '1px solid rgba(16,185,129,0.3)', color: '#34d399',
                    backgroundColor: 'rgba(16,185,129,0.08)'
                  }}
                  onClick={() => handleDownloadCSV(template.id, template.title)}
                  title="Baixar planilha modelo para preenchimento em lote"
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.08)'; }}
                >
                  <FileDown size={15} />
                </button>

                {/* Excluir */}
                <button
                  className="btn btn-danger btn-icon"
                  style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
                  onClick={() => handleDeleteTemplate(template.id, template.title)}
                  title="Excluir modelo"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CRIAR NOVO TEMPLATE */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={(e) => e.target.className === 'modal-backdrop' && setIsCreateOpen(false)}>
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setIsCreateOpen(false)} title="Fechar">
              <X size={18} />
            </button>
            <CreateTemplate
              onClose={() => setIsCreateOpen(false)}
              onSuccess={() => { setIsCreateOpen(false); fetchTemplates(); }}
            />
          </div>
        </div>
      )}

      {/* MODAL: EDITAR TEMPLATE */}
      {editingTemplateId && (
        <div className="modal-backdrop" onClick={(e) => e.target.className === 'modal-backdrop' && setEditingTemplateId(null)}>
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setEditingTemplateId(null)} title="Fechar">
              <X size={18} />
            </button>
            <EditTemplate
              templateId={editingTemplateId}
              onClose={() => setEditingTemplateId(null)}
              onSuccess={() => { setEditingTemplateId(null); fetchTemplates(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

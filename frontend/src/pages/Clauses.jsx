import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Plus, Search, Trash2, Edit, X, Save, AlertCircle, Loader2, CheckCircle2, AlignLeft, Sparkles } from 'lucide-react';

export default function Clauses() {
  const [clauses, setClauses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals & Forms State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClause, setEditingClause] = useState(null);
  const [clauseTitle, setClauseTitle] = useState('');
  const [clauseContent, setClauseContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClauses();
  }, []);

  const fetchClauses = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const { data, error } = await supabase
        .from('clauses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClauses(data || []);
    } catch (err) {
      console.error('Erro ao buscar cláusulas:', err);
      setErrorMessage('Não foi possível carregar as cláusulas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingClause(null);
    setClauseTitle('');
    setClauseContent('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (clause) => {
    setEditingClause(clause);
    setClauseTitle(clause.title);
    setClauseContent(clause.content);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clauseTitle.trim() || !clauseContent.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão expirada. Faça login novamente.');

      if (editingClause) {
        // Update
        const { error } = await supabase
          .from('clauses')
          .update({
            title: clauseTitle.trim(),
            content: clauseContent.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingClause.id);

        if (error) throw error;
        setSuccessMessage('Cláusula atualizada com sucesso!');
      } else {
        // Insert
        const { error } = await supabase
          .from('clauses')
          .insert({
            user_id: user.id,
            title: clauseTitle.trim(),
            content: clauseContent.trim()
          });

        if (error) throw error;
        setSuccessMessage('Cláusula cadastrada com sucesso!');
      }

      setIsModalOpen(false);
      fetchClauses();
    } catch (err) {
      console.error('Erro ao salvar cláusula:', err);
      setErrorMessage(err.message || 'Falha ao salvar cláusula.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Excluir permanentemente a cláusula "${title}"?`)) return;
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await supabase.from('clauses').delete().eq('id', id);
      if (error) throw error;
      setSuccessMessage(`Cláusula "${title}" removida.`);
      setClauses(clauses.filter(c => c.id !== id));
    } catch (err) {
      console.error('Erro ao excluir cláusula:', err);
      setErrorMessage('Falha ao excluir a cláusula.');
    }
  };

  const filteredClauses = clauses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '4px', background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Biblioteca de Cláusulas
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Cadastre e organize cláusulas reutilizáveis para agilizar a criação dos seus modelos.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} /> Nova Cláusula
        </button>
      </div>

      {successMessage && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--success-glow)', border: '1px solid var(--success)', color: '#34d399', marginBottom: '24px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' }}>
          <CheckCircle2 size={16} /><span>{successMessage}</span>
        </div>
      )}

      {errorMessage && !isModalOpen && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid var(--danger)', color: '#f87171', marginBottom: '24px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' }}>
          <AlertCircle size={16} /><span>{errorMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" className="input-field" style={{ paddingLeft: '40px' }} placeholder="Pesquisar cláusulas..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* Clauses Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--bg-card-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <span>Buscando suas cláusulas...</span>
        </div>
      ) : filteredClauses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <AlignLeft size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px auto', display: 'block', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Nenhuma cláusula cadastrada</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px auto', fontSize: '14px' }}>
            {searchQuery 
              ? 'Nenhuma cláusula corresponde aos critérios de pesquisa.'
              : 'Cadastre suas cláusulas padrão (como Foro, Confidencialidade, LGPD) para adicioná-las aos seus modelos com um clique.'}
          </p>
          {!searchQuery && (
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <Plus size={18} /> Criar Primeira Cláusula
            </button>
          )}
        </div>
      ) : (
        <div className="templates-grid">
          {filteredClauses.map(clause => (
            <div className="template-card" key={clause.id} style={{ display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
              <div className="template-card-header" style={{ flex: 1 }}>
                <span className="category-badge" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>CLÁUSULA</span>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: 'white', marginTop: '8px' }}>
                  {clause.title}
                </h3>
                <p style={{
                  color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6',
                  display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  whiteSpace: 'pre-wrap'
                }}>
                  {clause.content}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--bg-card-border)', marginTop: '12px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => handleOpenEditModal(clause)}
                >
                  <Edit size={14} /> Editar
                </button>
                <button
                  className="btn btn-danger btn-icon"
                  style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)' }}
                  onClick={() => handleDelete(clause.id, clause.title)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD / EDIT CLAUSE */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={(e) => e.target.className === 'modal-backdrop' && setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', padding: '28px', position: 'relative', overflow: 'hidden' }}>
            
            <div style={{
              position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--primary), var(--secondary), transparent)',
            }}></div>

            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)} title="Fechar">
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justify: 'center', justifyContent: 'center' }}>
                <AlignLeft size={20} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800' }}>{editingClause ? 'Editar Cláusula' : 'Cadastrar Nova Cláusula'}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Essa cláusula ficará salva e disponível para inserção rápida em qualquer contrato.</p>
              </div>
            </div>

            {errorMessage && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', color: '#f87171', marginBottom: '16px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px' }}>
                <AlertCircle size={14} /><span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Título da Cláusula *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: Cláusula Segunda - Da Confidencialidade"
                  value={clauseTitle}
                  onChange={(e) => setClauseTitle(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Conteúdo da Cláusula *</label>
                <textarea
                  className="input-field"
                  rows={8}
                  placeholder="Escreva as regras da cláusula. Você pode usar placeholders como {nome_cliente} ou {valor_contrato} normalmente."
                  value={clauseContent}
                  onChange={(e) => setClauseContent(e.target.value)}
                  required
                  disabled={isSubmitting}
                  style={{ fontFamily: 'sans-serif', lineHeight: '1.6', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 style={{ animation: 'spin 1s linear infinite' }} size={16} /> Salvando...</>
                  ) : (
                    <><Save size={16} /> Salvar Cláusula</>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Search, Trash2, FileText, Eye, X, Printer, FileDown, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import GenerateDocument from './GenerateDocument';

const supabase = createClient(
  'https://raxmdrunbidfmlvsldnj.supabase.co',
  'sb_publishable_L-ktxwLir7iUTMCVF1Gaew_bI0kYbKT'
);

export default function Documents({
  preSelectedTemplateId,
  setPreSelectedTemplateId,
  autoOpenGenerateModal,
  setAutoOpenGenerateModal
}) {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null); // Documento aberto no modal de visualização do histórico
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Carregar documentos do Supabase
  useEffect(() => {
    fetchDocuments();
  }, []);

  // 2. Tratar abertura automática do modal de emissão externa (redirecionamento)
  useEffect(() => {
    if (autoOpenGenerateModal) {
      setIsGenerateModalOpen(true);
      if (setAutoOpenGenerateModal) {
        setAutoOpenGenerateModal(false);
      }
    }
  }, [autoOpenGenerateModal, setAutoOpenGenerateModal]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          created_at,
          rendered_content,
          templates (
            title
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('❌ Erro ao buscar documentos:', err);
      setErrorMessage('Não foi possível carregar o histórico de documentos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover permanentemente este documento do histórico?')) {
      return;
    }

    setIsDeletingId(id);
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDocuments(documents.filter(d => d.id !== id));
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
      }
    } catch (err) {
      console.error('❌ Erro ao deletar documento:', err);
      alert('Falha ao deletar documento: ' + err.message);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handlePrint = () => {
    const iframe = document.getElementById('history-preview-iframe');
    if (iframe) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  const handleDownloadHtml = (doc) => {
    if (!doc.rendered_content) return;
    const blob = new Blob([doc.rendered_content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.toLowerCase().replace(/\s+/g, '-')}-${doc.id.substring(0, 6)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrar documentos pela busca textual (nome do documento ou nome do modelo de origem)
  const filteredDocuments = documents.filter(doc => {
    const titleMatch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const templateTitle = doc.templates?.title || '';
    const templateMatch = templateTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || templateMatch;
  });

  return (
    <div className="container">
      {/* Cabeçalho da Tela */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '4px', background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Documentos Emitidos
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Acesse o histórico completo de contratos e declarações gerados pelo sistema.</p>
        </div>

        <button className="btn btn-primary" onClick={() => {
          setPreSelectedTemplateId('');
          setIsGenerateModalOpen(true);
        }}>
          <Plus size={18} /> Novo Documento
        </button>
      </div>

      {errorMessage && (
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid var(--danger)',
          color: '#f87171',
          marginBottom: '24px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '32px'
      }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '40px' }}
            placeholder="Pesquisar por título ou modelo de origem..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Listagem em Tabela */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--bg-card-border)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }}></div>
          <span>Buscando histórico de documentos...</span>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', border: '1px dashed var(--bg-card-border)' }}>
          <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px auto', display: 'block', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Nenhum documento encontrado</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px auto', fontSize: '14px' }}>
            {searchQuery
              ? 'Nenhum documento do histórico corresponde aos critérios de pesquisa.'
              : 'Você ainda não gerou nenhum documento. Clique no botão acima para criar o seu primeiro!'}
          </p>
          {!searchQuery && (
            <button className="btn btn-primary" onClick={() => {
              setPreSelectedTemplateId('');
              setIsGenerateModalOpen(true);
            }}>
              <Plus size={18} /> Emitir Primeiro Documento
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bg-card-border)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <th style={{ padding: '18px 24px', color: 'var(--text-secondary)', fontWeight: '600' }}>Documento Emitido</th>
                  <th style={{ padding: '18px 24px', color: 'var(--text-secondary)', fontWeight: '600' }}>Modelo de Origem</th>
                  <th style={{ padding: '18px 24px', color: 'var(--text-secondary)', fontWeight: '600' }}>Data de Emissão</th>
                  <th style={{ padding: '18px 24px', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid var(--bg-card-border)', transition: 'var(--transition-fast)' }} className="table-row-hover">
                    <td style={{ padding: '18px 24px', fontWeight: '700', color: 'white' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={18} color="var(--primary)" />
                        <span>{doc.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: '18px 24px', color: 'var(--text-secondary)' }}>
                      {doc.templates?.title || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Modelo Deletado</span>}
                    </td>
                    <td style={{ padding: '18px 24px', color: 'var(--text-muted)' }}>
                      {new Date(doc.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => setSelectedDoc(doc)}
                          title="Visualizar documento"
                        >
                          <Eye size={13} /> Visualizar
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '8px', borderRadius: '6px' }}
                          onClick={() => handleDelete(doc.id)}
                          disabled={isDeletingId === doc.id}
                          title="Excluir do histórico"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE EMISSÃO (NOVO DOCUMENTO) */}
      {isGenerateModalOpen && (
        <div className="modal-backdrop" onClick={(e) => e.target.className === 'modal-backdrop' && setIsGenerateModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '1250px', width: '95vw' }}>
            <button className="modal-close-btn" onClick={() => setIsGenerateModalOpen(false)} title="Fechar Emissor">
              <X size={18} />
            </button>
            <div style={{ borderBottom: '1px solid var(--bg-card-border)', padding: '24px 32px 16px 32px' }}>
              <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                <Sparkles size={20} color="var(--primary)" /> Gerar Novo Documento Timbrado
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Preencha os campos exigidos pelo template para realizar a compilação.</p>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <GenerateDocument
                preSelectedTemplateId={preSelectedTemplateId}
                onClose={() => setIsGenerateModalOpen(false)}
                onSuccess={fetchDocuments}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO COMPLETA (HISTÓRICO) */}
      {selectedDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(11, 15, 25, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div className="card" style={{
            maxWidth: '1000px',
            width: '100%',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            backgroundColor: '#121826',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {/* Header do Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bg-card-border)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                  <Sparkles size={20} color="var(--secondary)" /> Visualizador de Histórico
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{selectedDoc.title}</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button className="btn btn-secondary" style={{ padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handlePrint}>
                  <Printer size={14} /> Imprimir / PDF
                </button>
                <button className="btn btn-secondary" style={{ padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleDownloadHtml(selectedDoc)}>
                  <FileDown size={14} /> Baixar HTML
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px', borderRadius: '8px', color: 'var(--danger)' }}
                  onClick={() => setSelectedDoc(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Sandbox Iframe */}
            <iframe
              id="history-preview-iframe"
              className="preview-iframe"
              srcDoc={selectedDoc.rendered_content}
              sandbox="allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
              title="Histórico de Documento"
              style={{ flex: 1, minHeight: 'auto' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

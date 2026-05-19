import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FileText, Printer, FileDown, Trash2, Eye, X, Loader2, Sparkles } from 'lucide-react';

const supabase = createClient(
  'https://raxmdrunbidfmlvsldnj.supabase.co',
  'sb_publishable_L-ktxwLir7iUTMCVF1Gaew_bI0kYbKT'
);

export default function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null); // Documento aberto no modal de visualização
  const [isDeletingId, setIsDeletingId] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('❌ Erro ao buscar documentos:', err);
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

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px', background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Histórico de Documentos Emitidos
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Acesse, imprima ou faça o download de todos os contratos que você já emitiu.</p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '60px 0' }}>
          <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={32} color="var(--primary)" />
          <span style={{ color: 'var(--text-secondary)' }}>Buscando histórico do banco...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', border: '1px dashed var(--bg-card-border)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifySelf: 'center', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', marginBottom: '16px', justifyContent: 'center' }}>
            <FileText size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Nenhum documento emitido</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '380px', margin: '0 auto 24px auto' }}>
            Você ainda não preencheu nenhum formulário de template para gerar documentos.
          </p>
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
                {documents.map((doc) => (
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
                          style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}
                          onClick={() => setSelectedDoc(doc)}
                          title="Visualizar documento"
                        >
                          <Eye size={14} /> Visualizar
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

      {/* MODAL DE VISUALIZAÇÃO COMPLETA */}
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
                <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="var(--secondary)" /> Visualizador de Histórico
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{selectedDoc.title}</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button className="btn btn-secondary" style={{ padding: '8px 14px', borderRadius: '8px' }} onClick={handlePrint}>
                  <Printer size={14} /> Imprimir / PDF
                </button>
                <button className="btn btn-secondary" style={{ padding: '8px 14px', borderRadius: '8px' }} onClick={() => handleDownloadHtml(selectedDoc)}>
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

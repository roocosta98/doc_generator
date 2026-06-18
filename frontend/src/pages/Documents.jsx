import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Plus, Search, Trash2, FileText, Eye, X, Printer, FileDown, 
  Sparkles, Loader2, AlertCircle, Send, CheckCircle2, Clock, 
  Copy, Check, ExternalLink, RefreshCw, PenTool 
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import GenerateDocument from './GenerateDocument';

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
  
  // Estados para Integração ZapSign
  const [zapsignSendDoc, setZapsignSendDoc] = useState(null);
  const [zapsignTimelineDoc, setZapsignTimelineDoc] = useState(null);

  // Estados para Importação em Lote
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [templatesList, setTemplatesList] = useState([]);
  const [batchTemplateId, setBatchTemplateId] = useState('');
  const [batchFileText, setBatchFileText] = useState('');
  const [batchFileName, setBatchFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('templates')
        .select('id, title')
        .eq('user_id', user.id)
        .order('title', { ascending: true });
      if (error) throw error;
      setTemplatesList(data || []);
    } catch (err) {
      console.error('Erro ao buscar templates para lote:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBatchFileName(file.name);
    
    // Auto-detect template by filename
    const cleanFileName = file.name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, ' ');

    let bestMatch = '';
    let highestScore = 0;

    templatesList.forEach(t => {
      const cleanTitle = t.title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, ' ');
      
      const fileWords = cleanFileName.split(/\s+/).filter(Boolean);
      const titleWords = cleanTitle.split(/\s+/).filter(Boolean);
      
      let score = 0;
      titleWords.forEach(w => {
        if (fileWords.includes(w)) score += 2;
        else if (cleanFileName.includes(w)) score += 1;
      });

      if (score > highestScore) {
        highestScore = score;
        bestMatch = t.id;
      }
    });

    if (bestMatch && highestScore > 1) {
      setBatchTemplateId(bestMatch);
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      if (text.includes('\uFFFD')) {
        const reReader = new FileReader();
        reReader.onload = (reEvt) => {
          setBatchFileText(reEvt.target.result);
        };
        reReader.readAsText(file, 'ISO-8859-1');
      } else {
        setBatchFileText(text);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const detectDelimiter = (text) => {
    const firstLine = text.split(/\r\n|\r|\n/)[0] || '';
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    return semicolonCount > commaCount ? ';' : ',';
  };

  const parseCSV = (text, delimiter = ',') => {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push("");
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        lines.push(row);
        row = [""];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== "") {
      lines.push(row);
    }
    return lines;
  };

  const handleBatchImportSubmit = async (e) => {
    e.preventDefault();
    if (!batchTemplateId) {
      alert('Por favor, selecione um modelo de template.');
      return;
    }
    if (!batchFileText) {
      alert('Por favor, envie o arquivo CSV correspondente.');
      return;
    }

    setIsUploading(true);

    // 1. Buscar campos do modelo para criar mapa de chaves
    let fieldMap = {};
    try {
      const { data: fields, error: fieldsError } = await supabase
        .from('template_fields')
        .select('key, label')
        .eq('template_id', batchTemplateId);

      if (fieldsError) throw fieldsError;

      const normalizeString = (str) => {
        if (!str) return '';
        return str.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '')
          .trim();
      };

      if (fields) {
        fields.forEach(f => {
          // Mapeia chave original
          fieldMap[normalizeString(f.key)] = f.key;
          // Mapeia rótulo amigável
          fieldMap[normalizeString(f.label)] = f.key;
          // Mapeia rótulo removendo sufixo como (text), (date) etc.
          const cleanLabel = f.label.replace(/\s*\([^)]*\)\s*$/, '');
          fieldMap[normalizeString(cleanLabel)] = f.key;
        });
      }
    } catch (err) {
      console.error('Erro ao mapear campos do template:', err);
      alert('Erro ao carregar mapeamento de variáveis: ' + err.message);
      setIsUploading(false);
      return;
    }

    let delimiter = detectDelimiter(batchFileText);
    let rows = parseCSV(batchFileText, delimiter);
    if (rows.length < 1) {
      alert('Arquivo CSV vazio ou inválido.');
      setIsUploading(false);
      return;
    }

    // Auto-recuperação: se parseou apenas 1 coluna, mas ela contém delimitadores não detectados, re-parseia
    if (rows[0] && rows[0].length === 1) {
      if (rows[0][0].includes(';')) {
        delimiter = ';';
        rows = parseCSV(batchFileText, delimiter);
      } else if (rows[0][0].includes(',')) {
        delimiter = ',';
        rows = parseCSV(batchFileText, delimiter);
      }
    }

    let headers = rows[0].map(h => h.trim().replace(/^\uFEFF/, ''));
    if (headers.length === 1) {
      let parts = headers[0].split(';');
      if (parts.length < 2) {
        parts = headers[0].split(',');
      }
      if (parts.length > 1) {
        headers = parts.map(h => h.trim());
      }
    }
    let dataRows = rows.slice(1).filter(r => r.some(cell => cell.trim() !== ''));

    // Pular linha descritiva/exemplo/labels do modelo de forma robusta
    const isLabelRow = (row) => {
      if (!row || !row[0]) return false;
      const firstCell = row[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return (
        firstCell.includes('titulo do contrato') || 
        firstCell.includes('titulo do documento') || 
        firstCell.includes('ex:') || 
        firstCell.includes('exemplo')
      );
    };

    if (dataRows[0] && isLabelRow(dataRows[0])) {
      dataRows = dataRows.slice(1);
    }

    if (dataRows.length === 0) {
      alert('Nenhum dado encontrado nas linhas do arquivo CSV.');
      setIsUploading(false);
      return;
    }

    const selectedTpl = templatesList.find(t => t.id === batchTemplateId);
    const templateTitle = selectedTpl ? selectedTpl.title : 'Modelo';

    const initialStatus = {
      active: true,
      templateTitle,
      total: dataRows.length,
      processed: 0,
      success: 0,
      error: 0,
      logs: [],
      minimized: false,
      delimiter,
      headersCount: headers.length
    };
    setImportStatus(initialStatus);
    setIsBatchModalOpen(false);
    setIsUploading(false);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '::1'
      ? 'http://127.0.0.1:5000' : 'https://doc-generator-lrv6.onrender.com';

    let currentStatus = { ...initialStatus };

    const normalizeString = (str) => {
      if (!str) return '';
      return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
    };

    for (let i = 0; i < dataRows.length; i++) {
      let row = dataRows[i];
      if (row.length === 1 && headers.length > 1) {
        let parts = row[0].split(';');
        if (parts.length < 2) {
          parts = row[0].split(',');
        }
        if (parts.length > 1) {
          row = parts;
        }
      }
      const docTitle = (row[0] && row[0].trim()) || `Contrato ${i + 1} - Lote ${templateTitle}`;
      
      const formDataPayload = {};
      for (let c = 1; c < headers.length; c++) {
        const rawHeader = headers[c];
        if (rawHeader) {
          // Normaliza e limpa o cabeçalho antes de buscar no fieldMap
          const cleanHeader = rawHeader.replace(/\s*\([^)]*\)\s*$/, '');
          const normalizedHeader = normalizeString(cleanHeader);
          
          const key = fieldMap[normalizedHeader] || rawHeader;
          formDataPayload[key] = row[c] !== undefined ? row[c].trim() : '';
        }
      }

      try {
        const response = await fetch(`${baseUrl}/api/documents/generate`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            template_id: batchTemplateId,
            form_data: formDataPayload,
            document_title: docTitle
          })
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Erro interno no motor de geração.');
        }

        currentStatus.success += 1;
        currentStatus.logs.push({
          line: i + 2,
          docTitle,
          status: 'success',
          details: 'Documento gerado com sucesso no histórico.',
          payload: formDataPayload
        });
      } catch (err) {
        currentStatus.error += 1;
        currentStatus.logs.push({
          line: i + 2,
          docTitle,
          status: 'error',
          details: err.message || 'Erro de conexão ou validação.',
          payload: formDataPayload
        });
      }

      currentStatus.processed += 1;
      setImportStatus({ ...currentStatus });
      fetchDocuments();
    }
  };

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
          zapsign_metadata,
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

  const renderZapSignStatus = (doc) => {
    const meta = doc.zapsign_metadata;
    if (!meta) {
      return (
        <span style={{
          fontSize: '11px',
          color: 'var(--text-secondary)',
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--bg-card-border)',
          padding: '4px 8px',
          borderRadius: '12px',
          fontWeight: '600'
        }}>
          Não Enviado
        </span>
      );
    }

    const status = meta.status;
    if (status === 'signed') {
      return (
        <span style={{
          fontSize: '11px',
          color: '#34d399',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '4px 8px',
          borderRadius: '12px',
          fontWeight: '700',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }}></span>
          Assinado
        </span>
      );
    }

    return (
      <span style={{
        fontSize: '11px',
        color: '#fbbf24',
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        padding: '4px 8px',
        borderRadius: '12px',
        fontWeight: '700',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span style={{ width: '6px', height: '6px', backgroundColor: '#f59e0b', borderRadius: '50%' }}></span>
        Aguardando Assinatura
      </span>
    );
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

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            style={{ 
              border: '1px solid rgba(16, 185, 129, 0.3)', 
              color: '#34d399', 
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => {
              fetchTemplates();
              setBatchTemplateId('');
              setBatchFileText('');
              setBatchFileName('');
              setIsBatchModalOpen(true);
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)'; }}
          >
            <FileDown size={18} /> Importação em Lote
          </button>
          <button className="btn btn-primary" onClick={() => {
            setPreSelectedTemplateId('');
            setIsGenerateModalOpen(true);
          }}>
            <Plus size={18} /> Novo Documento
          </button>
        </div>
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
                  <th style={{ padding: '18px 24px', color: 'var(--text-secondary)', fontWeight: '600' }}>Assinatura Digital</th>
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
                    <td style={{ padding: '18px 24px' }}>
                      {renderZapSignStatus(doc)}
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
                        
                        {doc.zapsign_metadata ? (
                          <button
                            className="btn btn-secondary"
                            style={{ 
                              padding: '8px 12px', 
                              borderRadius: '6px', 
                              fontSize: '12px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              color: 'var(--secondary)'
                            }}
                            onClick={() => setZapsignTimelineDoc(doc)}
                            title="Ver Timeline de Assinatura"
                          >
                            <PenTool size={13} /> Timeline
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ 
                              padding: '8px 12px', 
                              borderRadius: '6px', 
                              fontSize: '12px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              color: 'var(--primary)'
                            }}
                            onClick={() => setZapsignSendDoc(doc)}
                            title="Enviar para Assinatura Digital"
                          >
                            <Send size={13} /> Assinar
                          </button>
                        )}

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

      {/* MODAL DE IMPORTAÇÃO EM LOTE */}
      {isBatchModalOpen && (
        <div className="modal-backdrop" onClick={(e) => e.target.className === 'modal-backdrop' && setIsBatchModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '90vw', padding: '0', backgroundColor: '#121826' }}>
            <button className="modal-close-btn" onClick={() => setIsBatchModalOpen(false)} title="Fechar">
              <X size={18} />
            </button>

            <div style={{ borderBottom: '1px solid var(--bg-card-border)', padding: '24px 32px 16px 32px' }}>
              <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                <FileDown size={20} color="var(--primary)" /> Importação de Contratos em Lote
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                Suba uma planilha CSV com os dados preenchidos. O sistema gerará os documentos individualmente em segundo plano.
              </p>
            </div>

            <form onSubmit={handleBatchImportSubmit} style={{ padding: '24px 32px 32px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label className="input-label">Modelo de Template de Origem</label>
                <select 
                  className="input-field" 
                  value={batchTemplateId}
                  onChange={(e) => setBatchTemplateId(e.target.value)}
                  style={{ cursor: 'pointer' }}
                  required
                >
                  <option value="">-- Selecione o Modelo --</option>
                  {templatesList.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
                <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  Nota: Se o nome do arquivo enviado coincidir com o nome de um template, o sistema o selecionará automaticamente.
                </small>
              </div>

              <div className="input-group">
                <label className="input-label">Arquivo de Dados (CSV)</label>
                <div style={{
                  border: '2px dashed var(--bg-card-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255,255,255,0.01)',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%'
                    }}
                    required
                  />
                  <FileDown size={32} color="var(--primary)" style={{ opacity: 0.7, margin: '0 auto 10px auto' }} />
                  <span style={{ fontSize: '14px', display: 'block', fontWeight: 'bold' }}>
                    {batchFileName ? batchFileName : 'Clique ou arraste o arquivo CSV aqui'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                    Apenas arquivos .csv estruturados
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1, height: '48px' }} 
                  onClick={() => setIsBatchModalOpen(false)}
                  disabled={isUploading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 2, height: '48px', backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={18} />
                      Carregando arquivo...
                    </>
                  ) : (
                    <>
                      <FileDown size={16} /> Iniciar Importação
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WIDGET FLUTUANTE DE PROCESSO EM SEGUNDO PLANO (MODAL MINIMIZADO) */}
      {importStatus && importStatus.active && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: importStatus.minimized ? '280px' : '380px',
          maxHeight: importStatus.minimized ? '60px' : '400px',
          backgroundColor: '#121826',
          border: '1px solid var(--bg-card-border)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          borderRadius: '12px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden'
        }}>
          {/* Header do Widget */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderBottom: importStatus.minimized ? 'none' : '1px solid var(--bg-card-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }} onClick={() => setImportStatus({ ...importStatus, minimized: !importStatus.minimized })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: importStatus.processed < importStatus.total ? 'var(--primary)' : 'var(--success)',
                animation: importStatus.processed < importStatus.total ? 'pulse 1.5s infinite' : 'none'
              }}></div>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'white', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: importStatus.minimized ? '140px' : '200px' }}>
                {importStatus.processed < importStatus.total ? `Processando lote...` : 'Lote concluído'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }} onClick={(e) => {
                e.stopPropagation();
                setImportStatus({ ...importStatus, minimized: !importStatus.minimized });
              }}>
                {importStatus.minimized ? '▲ expandir' : '▼ minimizar'}
              </span>
              {importStatus.processed === importStatus.total && (
                <button
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px', fontSize: '14px', fontWeight: 'bold' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setImportStatus(null);
                  }}
                  title="Fechar resumo"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Conteúdo do Widget */}
          {!importStatus.minimized && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Modelo de Origem:</span>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>{importStatus.templateTitle}</div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifySpace: 'space-between', fontSize: '11px', marginBottom: '4px', justifyContent: 'space-between' }}>
                  <span>Progresso: {importStatus.processed} de {importStatus.total} linhas</span>
                  <span>{Math.round((importStatus.processed / importStatus.total) * 100)}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(importStatus.processed / importStatus.total) * 100}%`,
                    height: '100%',
                    backgroundColor: 'var(--primary)',
                    transition: 'width 0.2s ease'
                  }}></div>
                </div>
              </div>

              {/* Stats Counters */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#34d399' }}>{importStatus.success}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Sucessos</div>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f87171' }}>{importStatus.error}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Falhas</div>
                </div>
              </div>

              {/* Logs List */}
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '150px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--bg-card-border)', paddingTop: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Histórico de Processamento:</span>
                {importStatus.logs.length === 0 ? (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Aguardando primeira linha...</span>
                ) : (
                  [...importStatus.logs].reverse().map((log, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      fontSize: '11px',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      padding: '8px',
                      borderRadius: '6px',
                      borderLeft: `3px solid ${log.status === 'success' ? '#10b981' : '#ef4444'}`,
                      marginBottom: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px', fontWeight: 'bold' }}>
                          Linha {log.line}: {log.docTitle}
                        </span>
                        <span style={{ color: log.status === 'success' ? '#34d399' : '#f87171', fontSize: '10px', fontWeight: 'bold' }}>
                          {log.status === 'success' ? 'OK' : 'Falha'}
                        </span>
                      </div>
                      {log.payload && (
                        <div style={{ 
                          fontSize: '10px', 
                          color: '#94a3b8', 
                          backgroundColor: 'rgba(0,0,0,0.3)', 
                          padding: '6px', 
                          borderRadius: '4px', 
                          marginTop: '2px',
                          fontFamily: 'monospace',
                          wordBreak: 'break-all'
                        }}>
                          {Object.entries(log.payload).map(([k, v]) => `${k}: "${v}"`).join(', ')}
                        </div>
                      )}
                      {log.status === 'error' && log.details && (
                        <div style={{ color: '#f87171', fontSize: '10px', marginTop: '2px' }}>
                          Erro: {log.details}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Mini progress bar when minimized */}
          {importStatus.minimized && (
            <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <div style={{
                width: `${(importStatus.processed / importStatus.total) * 100}%`,
                height: '100%',
                backgroundColor: 'var(--primary)',
                transition: 'width 0.2s ease'
              }}></div>
            </div>
          )}
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

      {/* MODAL DE ENVIO ZAPSIGN */}
      {zapsignSendDoc && (
        <ZapSignSendModal 
          doc={zapsignSendDoc} 
          onClose={() => setZapsignSendDoc(null)} 
          onSuccess={fetchDocuments} 
        />
      )}

      {/* MODAL DE TIMELINE ZAPSIGN */}
      {zapsignTimelineDoc && (
        <ZapSignTimelineModal 
          doc={zapsignTimelineDoc} 
          onClose={() => setZapsignTimelineDoc(null)} 
          onSuccess={fetchDocuments}
        />
      )}
    </div>
  );
}

// ── COMPONENTE DE ENVIO PARA ASSINATURA DIGITAL (ZAPSIGN) ──
function ZapSignSendModal({ doc, onClose, onSuccess }) {
  const [signers, setSigners] = useState([{ name: '', email: '' }]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const handleAddSigner = () => {
    setSigners([...signers, { name: '', email: '' }]);
  };

  const handleRemoveSigner = (index) => {
    if (signers.length === 1) return;
    setSigners(signers.filter((_, i) => i !== index));
  };

  const handleInputChange = (index, field, value) => {
    const newSigners = [...signers];
    newSigners[index][field] = value;
    setSigners(newSigners);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validar signatários
    const validSigners = signers.filter(s => s.name.trim() && s.email.trim());
    if (validSigners.length === 0) {
      setError('Por favor, preencha pelo menos um signatário com Nome e E-mail.');
      return;
    }

    setIsSending(true);

    try {
      // 1. Criar um elemento DOM temporário para renderizar o HTML original e converter para PDF
      const element = document.createElement('div');
      element.innerHTML = doc.rendered_content;
      element.style.width = '210mm';
      element.style.padding = '0';
      element.style.background = '#ffffff';
      element.style.color = '#000000';
      document.body.appendChild(element);

      // Opções para o html2pdf.js gerar o PDF com fidelidade
      const opt = {
        margin: 0,
        filename: `${doc.title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Gerar o PDF na memória (Base64)
      const pdfDataUri = await html2pdf().set(opt).from(element).outputPdf('datauristring');
      document.body.removeChild(element); // Limpar elemento DOM

      const base64Pdf = pdfDataUri.split(',')[1]; // Extrair apenas a string base64 pura

      // 2. Chamar o backend para fazer o envio seguro para a ZapSign
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '::1'
        ? 'http://127.0.0.1:5000' : 'https://doc-generator-lrv6.onrender.com';

      const response = await fetch(`${baseUrl}/api/zapsign/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          document_id: doc.id,
          document_title: doc.title,
          base64_pdf: base64Pdf,
          signers: validSigners
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro na requisição para o servidor.');

      alert('Documento enviado para assinatura com sucesso! Os signatários receberão o link por e-mail.');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('❌ Erro no envio ZapSign:', err);
      setError(err.message || 'Ocorreu um erro ao gerar o PDF ou enviar para assinatura.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target.className === 'modal-backdrop' && onClose()}>
      <div className="modal-content" style={{ maxWidth: '600px', width: '90vw', padding: '0' }}>
        <button className="modal-close-btn" onClick={onClose} title="Fechar">
          <X size={18} />
        </button>

        <div style={{ borderBottom: '1px solid var(--bg-card-border)', padding: '24px 32px 16px 32px' }}>
          <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
            <Send size={20} color="var(--primary)" /> Assinatura Digital (ZapSign)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Envie o contrato <strong>"{doc.title}"</strong> para assinatura. Os signatários serão notificados por e-mail.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px 32px 32px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid var(--danger)',
              color: '#f87171', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
            <label className="input-label" style={{ marginBottom: '-8px' }}>Signatários do Documento</label>
            {signers.map((signer, index) => (
              <div key={index} style={{ 
                display: 'grid', 
                gridTemplateColumns: signers.length > 1 ? '1fr 1fr 40px' : '1fr 1fr', 
                gap: '12px', 
                alignItems: 'end',
                backgroundColor: 'rgba(255,255,255,0.01)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--bg-card-border)'
              }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" style={{ fontSize: '10px' }}>Nome Completo *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ex: João da Silva"
                    required
                    value={signer.name}
                    onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" style={{ fontSize: '10px' }}>E-mail *</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    placeholder="Ex: joao@email.com"
                    required
                    value={signer.email}
                    onChange={(e) => handleInputChange(index, 'email', e.target.value)}
                  />
                </div>
                {signers.length > 1 && (
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    style={{ padding: '0', height: '42px', width: '40px', borderRadius: '8px' }}
                    onClick={() => handleRemoveSigner(index)}
                    title="Remover signatário"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ width: '100%', height: '40px', fontSize: '13px', borderStyle: 'dashed' }}
            onClick={handleAddSigner}
          >
            + Adicionar Signatário
          </button>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ flex: 1, height: '48px' }} 
              onClick={onClose}
              disabled={isSending}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 2, height: '48px' }}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={18} />
                  Enviando p/ ZapSign...
                </>
              ) : (
                <>
                  <Send size={16} /> Enviar para Assinatura
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── COMPONENTE DE DETALHES E TIMELINE DE ASSINATURA (ZAPSIGN) ──
function ZapSignTimelineModal({ doc, onClose, onSuccess }) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [doc.id]);

  const fetchStatus = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '::1'
        ? 'http://127.0.0.1:5000' : 'https://doc-generator-lrv6.onrender.com';

      const response = await fetch(`${baseUrl}/api/zapsign/status/${doc.id}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao obter status.');

      setDetails(result);
      if (forceRefresh) {
        onSuccess(); // Recarregar lista do componente pai para sincronizar status
      }
    } catch (err) {
      console.error('❌ Erro ao buscar status/timeline:', err);
      setError(err.message || 'Falha ao conectar ao servidor para obter o status da assinatura.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleCopyLink = (url, index) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getStatusBadge = (status) => {
    if (status === 'signed') {
      return <span style={{ fontSize: '11px', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '3px 8px', borderRadius: '10px', fontWeight: 'bold' }}>Assinou</span>;
    }
    return <span style={{ fontSize: '11px', color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '3px 8px', borderRadius: '10px', fontWeight: 'bold' }}>Pendente</span>;
  };

  // Monta uma timeline visual com fallback elegante
  const renderTimelineEvents = () => {
    if (!details) return null;

    // Se temos eventos retornados da auditoria da ZapSign
    if (details.timeline && details.timeline.length > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '8px' }}>
          {details.timeline.map((event, index) => (
            <div key={index} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
              {index < details.timeline.length - 1 && (
                <div style={{ 
                  position: 'absolute', top: '24px', left: '10px', bottom: '-20px', 
                  width: '2px', backgroundColor: 'rgba(255,255,255,0.06)' 
                }} />
              )}
              
              {/* Círculo do Nó da Timeline */}
              <div style={{ 
                width: '22px', height: '22px', borderRadius: '50%', 
                backgroundColor: event.event === 'document_signed' || event.event === 'documento_assinado' ? '#10b981' : 'var(--primary)',
                border: '4px solid #121826', flexShrink: 0, zIndex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(0,0,0,0.5)'
              }}>
              </div>

              {/* Box de Conteúdo do Evento */}
              <div style={{ 
                flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--bg-card-border)', borderRadius: '8px', 
                padding: '12px 16px', marginTop: '-4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>{event.description || event.event}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(event.datetime).toLocaleString('pt-BR')}
                  </span>
                </div>
                {event.user && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Usuário: {event.user}</p>}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Fallback Visual Estruturado
    const meta = details.zapsign_metadata;
    const signers = meta.signers || [];
    const steps = [
      {
        title: 'Documento Criado',
        desc: `Gerado na plataforma: "${doc.title}"`,
        date: meta.created_at || doc.created_at,
        icon: <FileText size={12} color="white" />,
        color: 'var(--primary)'
      },
      {
        title: 'Enviado para ZapSign',
        desc: `Processado no ambiente de ${process.env.ZAPSIGN_ENV === 'production' ? 'Produção' : 'Sandbox'}`,
        date: meta.created_at || doc.created_at,
        icon: <Send size={12} color="white" />,
        color: 'var(--primary)'
      },
      ...signers.map(s => ({
        title: s.status === 'signed' ? `Assinado por ${s.name}` : `Aguardando Assinatura de ${s.name}`,
        desc: `E-mail: ${s.email}`,
        date: s.status === 'signed' ? new Date().toISOString() : null, // Fallback se não temos a data exata
        icon: s.status === 'signed' ? <CheckCircle2 size={12} color="white" /> : <Clock size={12} color="white" />,
        color: s.status === 'signed' ? '#10b981' : '#f59e0b'
      }))
    ];

    if (meta.status === 'signed') {
      steps.push({
        title: 'Documento Concluído',
        desc: 'Todos os signatários assinaram com sucesso!',
        date: new Date().toISOString(),
        icon: <CheckCircle2 size={12} color="white" />,
        color: '#10b981'
      });
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '8px' }}>
        {steps.map((step, index) => (
          <div key={index} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
            {index < steps.length - 1 && (
              <div style={{ 
                position: 'absolute', top: '24px', left: '10px', bottom: '-20px', 
                width: '2px', backgroundColor: 'rgba(255,255,255,0.06)' 
              }} />
            )}
            
            <div style={{ 
              width: '22px', height: '22px', borderRadius: '50%', 
              backgroundColor: step.color,
              border: '4px solid #121826', flexShrink: 0, zIndex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(0,0,0,0.5)'
            }}>
              {step.icon}
            </div>

            <div style={{ 
              flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--bg-card-border)', borderRadius: '8px', 
              padding: '12px 16px', marginTop: '-4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>{step.title}</h4>
                {step.date && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(step.date).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(11, 15, 25, 0.9)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '24px'
    }}>
      <div className="card" style={{
        maxWidth: '1200px', width: '100%', height: '90vh',
        display: 'flex', flexDirection: 'column', gap: '0',
        backgroundColor: '#121826', padding: '0', overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--bg-card-border)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          borderBottom: '1px solid var(--bg-card-border)', padding: '20px 24px' 
        }}>
          <div>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
              <PenTool size={20} color="var(--secondary)" /> Detalhes & Timeline da Assinatura
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
              Acompanhe o progresso das assinaturas do documento: <strong>{doc.title}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }} 
              onClick={() => fetchStatus(true)}
              disabled={isLoading || isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
              Atualizar Status
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '8px', borderRadius: '8px', color: 'var(--danger)' }}
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Painel Dividido (Split Screen) */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-secondary)', gap: '12px' }}>
            <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={36} color="var(--primary)" />
            <span>Consultando ZapSign...</span>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px', textAlign: 'center' }}>
            <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Erro ao buscar dados</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '24px' }}>{error}</p>
            <button className="btn btn-primary" onClick={() => fetchStatus(false)}>Tentar Novamente</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', flex: 1, height: 'calc(100% - 77px)', overflow: 'hidden' }}>
            {/* Lado Esquerdo: Iframe do Documento */}
            <div style={{ borderRight: '1px solid var(--bg-card-border)', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#070a12', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Visualização do Contrato original</span>
                {details?.zapsign_metadata?.status === 'signed' && details?.zapsign_metadata?.signed_file && (
                  <a 
                    href={details.zapsign_metadata.signed_file} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-primary" 
                    style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', height: 'auto' }}
                  >
                    <FileDown size={14} /> Baixar PDF Assinado
                  </a>
                )}
              </div>
              <iframe
                id="zapsign-preview-iframe"
                className="preview-iframe"
                srcDoc={doc.rendered_content}
                sandbox="allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                title="Pré-visualização da Assinatura"
                style={{ flex: 1, border: 'none', borderRadius: '8px', backgroundColor: '#ffffff', boxShadow: 'none', height: '100%' }}
              />
            </div>

            {/* Lado Direito: Timeline e Signatários */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '24px', gap: '24px', backgroundColor: 'rgba(11, 15, 25, 0.4)' }}>
              
              {/* Box de Status Geral */}
              <div style={{ 
                backgroundColor: details?.zapsign_metadata?.status === 'signed' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: `1px solid ${details?.zapsign_metadata?.status === 'signed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px'
              }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Status do Processo</span>
                <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'start', gap: '10px' }}>
                  {details?.zapsign_metadata?.status === 'signed' ? (
                    <>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#10b981' }}>TOTALMENTE ASSINADO</span>
                    </>
                  ) : (
                    <>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b', animation: 'pulse 1.5s infinite' }} />
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#f59e0b' }}>AGUARDANDO ASSINATURAS</span>
                    </>
                  )}
                </div>
              </div>

              {/* Lista de Signatários com Links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '14px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  Signatários ({details?.zapsign_metadata?.signers?.length || 0})
                </h3>
                
                {details?.zapsign_metadata?.signers?.map((signer, index) => (
                  <div key={index} style={{ 
                    backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--bg-card-border)', 
                    borderRadius: '8px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>{signer.name}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{signer.email}</span>
                      </div>
                      {getStatusBadge(signer.status)}
                    </div>
                    
                    {signer.status !== 'signed' && signer.sign_url && (
                      <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '4px' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ flex: 1, padding: '6px 12px', fontSize: '11px', height: '32px', borderRadius: '6px' }}
                          onClick={() => handleCopyLink(signer.sign_url, index)}
                        >
                          {copiedIndex === index ? (
                            <>✓ Copiado!</>
                          ) : (
                            <><Copy size={11} /> Copiar Link</>
                          )}
                        </button>
                        <a 
                          href={signer.sign_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-secondary" 
                          style={{ flex: 1, padding: '6px 12px', fontSize: '11px', height: '32px', borderRadius: '6px', color: 'var(--primary)', borderColor: 'rgba(99,102,241,0.2)' }}
                        >
                          <ExternalLink size={11} /> Ir p/ Assinar
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Timeline de Eventos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                <h3 style={{ fontSize: '14px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  Timeline / Log de Auditoria
                </h3>
                {renderTimelineEvents()}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

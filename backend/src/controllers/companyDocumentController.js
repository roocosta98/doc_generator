import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';
import xss from 'xss';

const AUTO_DOCUMENT_TYPES = [
  'auto_cnpj',
  'auto_qsa',
  'auto_simples',
  'auto_sintegra',
  'auto_cnd_federal',
  'auto_certidoes'
];

const createUserClient = (token) => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  auth: { persistSession: false }
});

const createWriteClient = (token) => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && serviceKey !== 'cole_a_service_role_key_aqui') {
    return createClient(process.env.SUPABASE_URL, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return createUserClient(token);
};

const cleanCnpj = (value = '') => String(value).replace(/\D/g, '').slice(0, 14);

const formatCnpj = (value = '') => {
  const digits = cleanCnpj(value);
  if (digits.length !== 14) return value || '';
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const formatDate = (value) => {
  if (!value) return 'Nao informado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('pt-BR');
};

const row = (label, value) => `
  <tr>
    <th>${xss(label)}</th>
    <td>${xss(value === null || value === undefined || value === '' ? 'Nao informado' : String(value))}</td>
  </tr>
`;

const wrapHtml = ({ title, companyName, cnpj, source, body }) => `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${xss(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #172033; margin: 32px; line-height: 1.5; }
    header { border-bottom: 3px solid #0A2540; margin-bottom: 24px; padding-bottom: 14px; }
    h1 { color: #0A2540; font-size: 22px; margin: 0 0 8px; }
    h2 { color: #0A2540; font-size: 16px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; font-size: 13px; }
    th, td { border: 1px solid #d8dee9; padding: 8px 10px; vertical-align: top; text-align: left; }
    th { width: 220px; background: #f4f6f8; color: #344054; }
    .note { background: #fff8e6; border: 1px solid #f4d58d; border-radius: 6px; padding: 12px; font-size: 13px; }
    .muted { color: #667085; font-size: 12px; }
    ul { margin-top: 8px; }
  </style>
</head>
<body>
  <header>
    <h1>${xss(title)}</h1>
    <div><strong>Cliente:</strong> ${xss(companyName || 'Nao informado')}</div>
    <div><strong>CNPJ:</strong> ${xss(formatCnpj(cnpj))}</div>
    <div class="muted">Gerado automaticamente pelo CRM em ${new Date().toLocaleString('pt-BR')}.</div>
    <div class="muted">Fonte consultada: ${xss(source)}</div>
  </header>
  ${body}
</body>
</html>`;

async function fetchJson(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`${url} retornou ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchCompanyData(cnpj) {
  try {
    const cnpjWs = await fetchJson(`https://publica.cnpj.ws/cnpj/${cnpj}`);
    return { source: 'CNPJ.ws', data: cnpjWs, provider: 'cnpjws' };
  } catch (primaryError) {
    const brasilApi = await fetchJson(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    return { source: 'BrasilAPI', data: brasilApi, provider: 'brasilapi', primaryError: primaryError.message };
  }
}

const getCompanyName = (lead, company) =>
  lead.company_name ||
  lead.legal_name ||
  company.razao_social ||
  company.nome_fantasia ||
  company.estabelecimento?.nome_fantasia ||
  'Cliente';

const buildCnpjDocument = ({ lead, cnpj, company, source }) => {
  const est = company.estabelecimento || company;
  const body = `
    <h2>Dados cadastrais</h2>
    <table>
      ${row('Razao social', company.razao_social)}
      ${row('Nome fantasia', est.nome_fantasia || company.nome_fantasia)}
      ${row('Situacao cadastral', est.situacao_cadastral || company.descricao_situacao_cadastral)}
      ${row('Data de abertura', formatDate(est.data_inicio_atividade || company.data_inicio_atividade))}
      ${row('Porte', company.porte?.descricao || company.porte)}
      ${row('Natureza juridica', company.natureza_juridica?.descricao || company.natureza_juridica)}
      ${row('Capital social', company.capital_social)}
      ${row('CNAE principal', est.atividade_principal?.descricao || company.cnae_fiscal_descricao)}
      ${row('Municipio/UF', `${est.cidade?.nome || company.municipio || lead.city || ''}/${est.estado?.sigla || company.uf || lead.state || ''}`)}
      ${row('Endereco', [est.tipo_logradouro, est.logradouro, est.numero, est.bairro, est.cep].filter(Boolean).join(', '))}
      ${row('E-mail', est.email || company.email)}
      ${row('Telefone', [est.ddd1 || company.ddd, est.telefone1 || company.telefone].filter(Boolean).join(' '))}
    </table>
  `;
  return wrapHtml({ title: 'Cartao CNPJ - consulta automatica', companyName: getCompanyName(lead, company), cnpj, source, body });
};

const buildQsaDocument = ({ lead, cnpj, company, source }) => {
  const socios = company.socios || company.qsa || [];
  const body = socios.length
    ? `<h2>Quadro societario</h2><table><thead><tr><th>Nome</th><th>Qualificacao</th><th>Entrada</th></tr></thead><tbody>${socios.map((partner) => `
        <tr>
          <td>${xss(partner.nome || partner.nome_socio || 'Nao informado')}</td>
          <td>${xss(partner.qualificacao_socio?.descricao || partner.qualificacao_socio || partner.qualificacao || 'Nao informado')}</td>
          <td>${xss(formatDate(partner.data_entrada || partner.data_entrada_sociedade))}</td>
        </tr>
      `).join('')}</tbody></table>`
    : '<div class="note">Nenhum socio retornado pela fonte publica consultada.</div>';
  return wrapHtml({ title: 'QSA - Quadro de Socios e Administradores', companyName: getCompanyName(lead, company), cnpj, source, body });
};

const buildSimplesDocument = ({ lead, cnpj, company, source }) => {
  const simples = company.simples || {};
  const body = `
    <h2>Opcao pelo Simples Nacional</h2>
    <table>
      ${row('Optante pelo Simples', simples.optante)}
      ${row('Data de opcao', formatDate(simples.data_opcao_simples))}
      ${row('Data de exclusao', formatDate(simples.data_exclusao_simples))}
      ${row('MEI', simples.mei)}
      ${row('Data opcao MEI', formatDate(simples.data_opcao_mei))}
      ${row('Data exclusao MEI', formatDate(simples.data_exclusao_mei))}
    </table>
    ${company.simples ? '' : '<div class="note">A fonte consultada nao retornou dados de opcao pelo Simples. Validar no portal oficial antes do fechamento.</div>'}
  `;
  return wrapHtml({ title: 'Opcao Simples Nacional', companyName: getCompanyName(lead, company), cnpj, source, body });
};

const buildSintegraDocument = ({ lead, cnpj, company, source }) => {
  const est = company.estabelecimento || {};
  const registrations = est.inscricoes_estaduais || [];
  const body = `
    <h2>Inscricoes estaduais retornadas</h2>
    ${registrations.length ? `<table><thead><tr><th>IE</th><th>UF</th><th>Status</th></tr></thead><tbody>${registrations.map((ie) => `
      <tr>
        <td>${xss(ie.inscricao_estadual || 'Nao informado')}</td>
        <td>${xss(ie.estado?.sigla || '')}</td>
        <td>${xss(ie.ativo === true ? 'Ativa' : ie.ativo === false ? 'Inativa' : 'Nao informado')}</td>
      </tr>
    `).join('')}</tbody></table>` : '<div class="note">Nenhuma inscricao estadual retornada pela consulta publica.</div>'}
    <div class="note">Sintegra nao possui uma API nacional unica e estavel para emissao automatica. Use este arquivo como conferencia inicial e valide no portal estadual do contribuinte.</div>
  `;
  return wrapHtml({ title: 'Sintegra - conferencia de inscricao estadual', companyName: getCompanyName(lead, company), cnpj, source, body });
};

const buildCertificatesDocument = ({ lead, cnpj, company, source }) => {
  const body = `
    <h2>Certidoes a emitir/conferir</h2>
    <div class="note">As certidoes oficiais geralmente exigem validacao no portal emissor, e algumas podem usar captcha. Este documento centraliza a trilha de conferencia para o time.</div>
    <table>
      ${row('Receita Federal / PGFN', 'Emitir Certidao de Debitos Relativos a Creditos Tributarios Federais e Divida Ativa da Uniao')}
      ${row('FGTS / CRF', 'Emitir Certificado de Regularidade do FGTS')}
      ${row('Trabalhista / CNDT', 'Emitir Certidao Negativa de Debitos Trabalhistas')}
      ${row('Estadual', `Validar certidao estadual na UF ${lead.state || company.estabelecimento?.estado?.sigla || company.uf || 'do cliente'}`)}
      ${row('Municipal', `Validar certidao municipal em ${lead.city || company.estabelecimento?.cidade?.nome || company.municipio || 'municipio do cliente'}`)}
    </table>
  `;
  return wrapHtml({ title: 'Certidoes - roteiro de emissao', companyName: getCompanyName(lead, company), cnpj, source, body });
};

const htmlToText = (html) => html
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<\/(h1|h2|p|div|tr)>/gi, '\n')
  .replace(/<\/(th|td)>/gi, '  ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

async function createPdfBuffer({ title, html, source }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: title } });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0A2540').text(title, { align: 'left' });
    doc.moveDown(0.35);
    doc.font('Helvetica').fontSize(8).fillColor('#667085').text(`Fonte/integração: ${source || 'CRM'}`);
    doc.moveDown(1);
    doc.font('Helvetica').fontSize(10).fillColor('#172033').text(htmlToText(html), {
      align: 'left',
      lineGap: 4
    });
    doc.end();
  });
}

const getSerproCredentials = () => {
  const key = process.env.SERPRO_CONSUMER_KEY;
  const secret = process.env.SERPRO_CONSUMER_SECRET;
  if (!key || !secret || key === 'cole_aqui' || secret === 'cole_aqui') return null;
  return { key, secret };
};

async function getSerproToken() {
  const credentials = getSerproCredentials();
  if (!credentials) return null;

  const basic = Buffer.from(`${credentials.key}:${credentials.secret}`).toString('base64');
  const response = await fetch(process.env.SERPRO_TOKEN_URL || 'https://gateway.apiserpro.serpro.gov.br/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`SERPRO token retornou ${response.status}`);
  }

  const payload = await response.json();
  return payload.access_token;
}

const normalizePdfBase64 = (value) => {
  if (!value) return null;
  const raw = String(value).includes(',') ? String(value).split(',').pop() : String(value);
  return raw.replace(/\s/g, '');
};

async function callSerproCnd({ cnpj, chave }) {
  const token = await getSerproToken();
  if (!token) return { unavailable: true, reason: 'Credenciais SERPRO não configuradas.' };

  const body = {
    TipoContribuinte: 1,
    ContribuinteConsulta: cnpj,
    CodigoIdentificacao: '9001',
    GerarCertidaoPdf: true,
    ...(chave ? { Chave: chave } : {})
  };

  const response = await fetch(process.env.SERPRO_CND_URL || 'https://gateway.apiserpro.serpro.gov.br/consulta-cnd/v1/certidao', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 201 && response.status !== 202) {
    throw new Error(payload.Mensagem || payload.message || `SERPRO CND retornou ${response.status}`);
  }
  return payload;
}

async function fetchFederalCndPdf(cnpj) {
  let payload = await callSerproCnd({ cnpj });
  if (payload.unavailable) return payload;

  for (let attempt = 0; payload.Status === 7 && payload.Chave && attempt < 8; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    payload = await callSerproCnd({ cnpj, chave: payload.Chave });
  }

  const pdfBase64 = normalizePdfBase64(payload.Certidao?.DocumentoPdf);
  if (!pdfBase64) {
    return {
      unavailable: true,
      reason: payload.Mensagem || 'SERPRO não retornou PDF para a CND Federal.',
      status: payload.Status
    };
  }

  return {
    source: 'SERPRO Consulta CND',
    buffer: Buffer.from(pdfBase64, 'base64'),
    status: payload.Status,
    metadata: payload.Certidao
  };
}

async function saveDocument({ supabase, lead, userId, documentType, fileName, buffer, mimeType }) {
  const safeName = fileName.replace(/[^a-zA-Z0-9_.-]+/g, '_');
  const filePath = `${lead.id}/auto/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from('crm_documents')
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false
    });
  if (uploadError) throw uploadError;

  const { data, error: insertError } = await supabase
    .from('documents')
    .insert({
      lead_id: lead.id,
      uploaded_by: userId,
      document_type: documentType,
      file_name: fileName,
      file_path: filePath,
      bucket_name: 'crm_documents',
      mime_type: mimeType,
      file_size: buffer.length
    })
    .select('id, file_name, document_type')
    .single();
  if (insertError) throw insertError;
  return data;
}

export const importCompanyDocuments = async (req, res, next) => {
  try {
    const { lead_id, cnpj } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Autenticacao necessaria.' });
    if (!lead_id) return res.status(400).json({ error: 'lead_id e obrigatorio.' });

    const clean = cleanCnpj(cnpj);
    if (clean.length !== 14) return res.status(400).json({ error: 'CNPJ invalido.' });

    const userClient = createUserClient(token);
    const writeClient = createWriteClient(token);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) return res.status(401).json({ error: 'Sessao invalida.' });

    const { data: lead, error: leadError } = await userClient
      .from('leads')
      .select('id, cnpj, company_name, legal_name, trade_name, city, state')
      .eq('id', lead_id)
      .single();
    if (leadError || !lead) return res.status(404).json({ error: 'Oportunidade nao encontrada ou sem acesso.' });

    const { data: existingDocs } = await writeClient
      .from('documents')
      .select('document_type')
      .eq('lead_id', lead_id)
      .in('document_type', AUTO_DOCUMENT_TYPES);
    const existingTypes = new Set((existingDocs || []).map((doc) => doc.document_type));

    const { data: company, source } = await fetchCompanyData(clean);
    const builders = [
      { type: 'auto_cnpj', title: 'Cartao CNPJ - consulta automatica', fileName: `CNPJ_${clean}.pdf`, build: buildCnpjDocument },
      { type: 'auto_qsa', title: 'QSA - Quadro de Socios e Administradores', fileName: `QSA_${clean}.pdf`, build: buildQsaDocument },
      { type: 'auto_simples', title: 'Opcao Simples Nacional', fileName: `Opcao_Simples_${clean}.pdf`, build: buildSimplesDocument },
      { type: 'auto_sintegra', title: 'Sintegra - conferencia de inscricao estadual', fileName: `Sintegra_${clean}.pdf`, build: buildSintegraDocument },
      { type: 'auto_certidoes', title: 'Certidoes - roteiro de emissao', fileName: `Certidoes_${clean}.pdf`, build: buildCertificatesDocument }
    ];

    const imported = [];
    const skipped = [];
    const warnings = [];

    if (!existingTypes.has('auto_cnd_federal')) {
      try {
        const cnd = await fetchFederalCndPdf(clean);
        if (cnd.buffer) {
          const saved = await saveDocument({
            supabase: writeClient,
            lead,
            userId: userData.user.id,
            documentType: 'auto_cnd_federal',
            fileName: `CND_Federal_${clean}.pdf`,
            buffer: cnd.buffer,
            mimeType: 'application/pdf'
          });
          imported.push(saved);
        } else {
          warnings.push(`CND Federal: ${cnd.reason || 'PDF oficial indisponivel.'}`);
        }
      } catch (error) {
        warnings.push(`CND Federal: ${error.message}`);
      }
    } else {
      skipped.push('auto_cnd_federal');
    }

    for (const item of builders) {
      if (existingTypes.has(item.type)) {
        skipped.push(item.type);
        continue;
      }
      const html = item.build({ lead, cnpj: clean, company, source });
      const buffer = await createPdfBuffer({ title: item.title, html, source });
      const saved = await saveDocument({
        supabase: writeClient,
        lead,
        userId: userData.user.id,
        documentType: item.type,
        fileName: item.fileName,
        buffer,
        mimeType: 'application/pdf'
      });
      imported.push(saved);
    }

    return res.status(200).json({
      success: true,
      imported,
      skipped,
      warnings,
      source
    });
  } catch (error) {
    next(error);
  }
};

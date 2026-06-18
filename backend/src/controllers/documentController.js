import { createClient } from '@supabase/supabase-js';
import xss from 'xss';
import fs from 'fs';

const createUserSupabaseClient = (token) => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    auth: {
      persistSession: false
    }
  }
);

const createServiceSupabaseClient = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'cole_a_service_role_key_aqui') return null;
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
};

// Função para aplicar a casca do papel timbrado baseado no tema escolhido
function applyLetterhead(content, visualIdentity, title) {
  const theme = visualIdentity.theme || 'classic';
  const primaryColor = visualIdentity.primaryColor || '#1e293b';
  const logoUrl = visualIdentity.logoUrl || '';
  const headerText = visualIdentity.headerText || '';
  const footerText = visualIdentity.footerText || '';
  const fontFamily = visualIdentity.fontFamily || 'Inter';
  const backgroundImageUrl = visualIdentity.backgroundImageUrl || '';
  
  // Margens (padrão A4)
  const margins = visualIdentity.margins || { top: '2.5cm', bottom: '2.5cm', left: '3.0cm', right: '2.0cm' };

  // Fontes do Google Fonts mapping
  const fontMapping = {
    'Inter': "'Inter', -apple-system, sans-serif",
    'Playfair Display': "'Playfair Display', Georgia, serif",
    'Montserrat': "'Montserrat', sans-serif",
    'Lora': "'Lora', Georgia, serif",
    'Roboto': "'Roboto', sans-serif",
    'Merriweather': "'Merriweather', serif",
    'Arial': "Arial, sans-serif",
    'Times New Roman': "'Times New Roman', Times, serif"
  };
  const selectedFont = fontMapping[fontFamily] || "'Inter', sans-serif";

  // Papel timbrado completo de fundo (background image)
  const backgroundStyle = backgroundImageUrl 
    ? `background-image: url('${xss(backgroundImageUrl)}'); background-size: 100% 100%; background-position: center; background-repeat: no-repeat;`
    : 'background-color: #ffffff;';

  let themeStyles = '';
  let headerHtml = '';
  let footerHtml = '';
  let extraWrapperStart = '';
  let extraWrapperEnd = '';

  // 1. Estilizações específicas baseadas no tema e fontes
  if (theme === 'classic') {
    themeStyles = `
      body {
        font-family: ${selectedFont};
        color: #1e293b;
        background-color: #f8fafc;
        margin: 0;
        padding: 40px;
        display: flex;
        justify-content: center;
      }
      .page {
        ${backgroundStyle}
        width: 210mm;
        min-height: 297mm;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        padding: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left};
        box-sizing: border-box;
        position: relative;
        border-top: 8px solid ${primaryColor};
      }
      .header-container {
        border-bottom: 2px double ${primaryColor};
        padding-bottom: 15px;
        margin-bottom: 30px;
        text-align: center;
      }
      .header-title {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 1px;
        color: ${primaryColor};
        margin: 0 0 5px 0;
        text-transform: uppercase;
        font-family: ${selectedFont};
      }
      .header-subtitle {
        font-size: 12px;
        color: #64748b;
        margin: 0;
        font-style: italic;
      }
      .document-body {
        font-size: 14px;
        line-height: 1.8;
        text-align: justify;
        color: #1e293b;
      }
      .document-body .contract-title {
        color: ${primaryColor};
        font-family: ${selectedFont};
        border-bottom: 1px solid rgba(0,0,0,0.05);
        padding-bottom: 6px;
      }
      .document-body .clause-title {
        color: ${primaryColor};
        font-family: ${selectedFont};
      }
      .footer-container {
        position: absolute;
        bottom: 25px;
        left: ${margins.left};
        right: ${margins.right};
        border-top: 1px solid #e2e8f0;
        padding-top: 10px;
        text-align: center;
        font-size: 10px;
        color: #94a3b8;
      }
    `;
    headerHtml = `
      <div class="header-container">
        ${logoUrl ? `<img src="${xss(logoUrl)}" alt="Logo" style="max-height: 50px; margin-bottom: 10px;" />` : ''}
        <h1 class="header-title">${xss(headerText || title)}</h1>
        <div class="header-subtitle">Documento Oficial Autenticado</div>
      </div>
    `;
    footerHtml = `
      <div class="footer-container">
        <div>${xss(footerText || 'Este documento é sigiloso e de uso restrito.')}</div>
        <div style="margin-top: 4px; font-weight: bold; color: ${primaryColor};">Papel de Impressão Oficial</div>
      </div>
    `;

  } else if (theme === 'modern') {
    themeStyles = `
      body {
        font-family: ${selectedFont};
        color: #0f172a;
        background-color: #f1f5f9;
        margin: 0;
        padding: 40px;
        display: flex;
        justify-content: center;
      }
      .page {
        ${backgroundStyle}
        width: 210mm;
        min-height: 297mm;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        padding: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left};
        box-sizing: border-box;
        position: relative;
        border-left: 10px solid ${primaryColor};
      }
      .header-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #f1f5f9;
        padding-bottom: 20px;
        margin-bottom: 40px;
      }
      .header-brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .header-logo-box {
        width: 40px;
        height: 40px;
        background-color: ${primaryColor};
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 18px;
      }
      .header-title {
        font-size: 18px;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
        font-family: ${selectedFont};
      }
      .header-meta {
        text-align: right;
        font-size: 11px;
        color: #64748b;
      }
      .document-body {
        font-size: 13px;
        line-height: 1.7;
        color: #334155;
      }
      .document-body .contract-title {
        color: #0f172a;
        font-family: ${selectedFont};
        border-bottom: 2px solid ${primaryColor};
        display: inline-block;
        padding-bottom: 4px;
      }
      .document-body .clause-title {
        color: ${primaryColor};
        font-family: ${selectedFont};
      }
      .footer-container {
        position: absolute;
        bottom: 25px;
        left: calc(${margins.left} + 10px);
        right: ${margins.right};
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: #64748b;
        border-top: 1px solid #f1f5f9;
        padding-top: 15px;
      }
    `;
    headerHtml = `
      <div class="header-container">
        <div class="header-brand">
          ${logoUrl 
            ? `<img src="${xss(logoUrl)}" alt="Logo" style="max-height: 40px;" />` 
            : `<div class="header-logo-box">${title.charAt(0).toUpperCase()}</div>`
          }
          <h1 class="header-title">${xss(headerText || title)}</h1>
        </div>
        <div class="header-meta">
          <div>Emissão: ${new Date().toLocaleDateString('pt-BR')}</div>
          <div style="font-weight: 600; color: ${primaryColor};">ID: DOC-${Math.floor(100000 + Math.random() * 900000)}</div>
        </div>
      </div>
    `;
    footerHtml = `
      <div class="footer-container">
        <span>${xss(footerText || 'Documento eletrônico gerado por DocGenerator.')}</span>
        <span style="font-weight: 600; color: ${primaryColor};">Confidencial</span>
      </div>
    `;

  } else if (theme === 'corporate') {
    themeStyles = `
      body {
        font-family: ${selectedFont};
        color: #1e293b;
        background-color: #f1f5f9;
        margin: 0;
        padding: 40px;
        display: flex;
        justify-content: center;
      }
      .page {
        ${backgroundStyle}
        width: 210mm;
        min-height: 297mm;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        padding: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left};
        box-sizing: border-box;
        position: relative;
      }
      .corporate-band {
        background-color: ${primaryColor};
        color: #ffffff;
        padding: 24px;
        margin-top: calc(-${margins.top});
        margin-left: calc(-${margins.left});
        margin-right: calc(-${margins.right});
        margin-bottom: 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .corporate-title {
        font-size: 20px;
        font-weight: 700;
        text-transform: uppercase;
        margin: 0;
        letter-spacing: 0.5px;
      }
      .corporate-sub {
        font-size: 11px;
        opacity: 0.8;
      }
      .document-body {
        font-size: 13.5px;
        line-height: 1.75;
        color: #1e293b;
      }
      .document-body .contract-title {
        color: ${primaryColor};
        font-family: ${selectedFont};
        margin-top: 10px;
        text-align: left !important;
      }
      .document-body .clause-title {
        color: ${primaryColor};
        font-family: ${selectedFont};
        border-left: 3px solid ${primaryColor};
        padding-left: 8px;
      }
      .footer-container {
        position: absolute;
        bottom: 25px;
        left: ${margins.left};
        right: ${margins.right};
        border-top: 2px solid ${primaryColor};
        padding-top: 12px;
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #475569;
      }
    `;
    headerHtml = `
      <div class="corporate-band">
        <div>
          <h1 class="corporate-title">${xss(headerText || title)}</h1>
          <div class="corporate-sub">Modelo Corporativo Padrão</div>
        </div>
        ${logoUrl ? `<img src="${xss(logoUrl)}" alt="Logo" style="max-height: 45px; filter: brightness(0) invert(1);" />` : ''}
      </div>
    `;
    footerHtml = `
      <div class="footer-container">
        <span>${xss(footerText || 'Em caso de dúvidas, consulte o emissor.')}</span>
        <span style="font-weight: bold;">DocGenerator Enterprise</span>
      </div>
    `;

  } else if (theme === 'executive') {
    themeStyles = `
      body {
        font-family: ${selectedFont};
        color: #0f172a;
        background-color: #f8fafc;
        margin: 0;
        padding: 40px;
        display: flex;
        justify-content: center;
      }
      .page {
        ${backgroundStyle}
        width: 210mm;
        min-height: 297mm;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        padding: calc(${margins.top} + 10px) calc(${margins.right} + 10px) calc(${margins.bottom} + 10px) calc(${margins.left} + 10px);
        box-sizing: border-box;
        position: relative;
      }
      .exec-border-outer {
        position: absolute;
        top: 20px;
        left: 20px;
        right: 20px;
        bottom: 20px;
        border: 1px solid ${primaryColor};
        pointer-events: none;
      }
      .exec-border-inner {
        position: absolute;
        top: 24px;
        left: 24px;
        right: 24px;
        bottom: 24px;
        border: 2px double ${primaryColor};
        pointer-events: none;
      }
      .header-container {
        text-align: center;
        margin-bottom: 35px;
        margin-top: 15px;
      }
      .header-title {
        font-size: 22px;
        font-weight: 800;
        color: ${primaryColor};
        margin: 0 0 8px 0;
        text-transform: uppercase;
        letter-spacing: 1.5px;
      }
      .header-line {
        width: 80px;
        height: 2px;
        background-color: ${primaryColor};
        margin: 12px auto;
      }
      .document-body {
        font-size: 14px;
        line-height: 1.8;
        color: #0f172a;
      }
      .document-body .contract-title {
        color: ${primaryColor};
        font-family: ${selectedFont};
        letter-spacing: 0.5px;
      }
      .document-body .clause-title {
        color: ${primaryColor};
        font-family: ${selectedFont};
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .footer-container {
        position: absolute;
        bottom: 40px;
        left: calc(${margins.left} + 20px);
        right: calc(${margins.right} + 20px);
        text-align: center;
        font-size: 10px;
        color: #64748b;
        letter-spacing: 0.5px;
      }
    `;
    extraWrapperStart = `
      <div class="exec-border-outer"></div>
      <div class="exec-border-inner"></div>
    `;
    headerHtml = `
      <div class="header-container">
        ${logoUrl ? `<img src="${xss(logoUrl)}" alt="Logo" style="max-height: 45px; margin-bottom: 12px;" />` : ''}
        <h1 class="header-title">${xss(headerText || title)}</h1>
        <div class="header-line"></div>
      </div>
    `;
    footerHtml = `
      <div class="footer-container">
        <div>${xss(footerText || 'Executado e assinado via plataforma digital DocGenerator.')}</div>
      </div>
    `;

  } else { // Minimalist
    themeStyles = `
      body {
        font-family: ${selectedFont};
        color: #27272a;
        background-color: #fafafa;
        margin: 0;
        padding: 40px;
        display: flex;
        justify-content: center;
      }
      .page {
        ${backgroundStyle}
        width: 210mm;
        min-height: 297mm;
        padding: calc(${margins.top} + 20px) ${margins.right} calc(${margins.bottom} + 20px) ${margins.left};
        box-sizing: border-box;
        position: relative;
      }
      .header-container {
        margin-bottom: 50px;
      }
      .header-logo-container {
        margin-bottom: 20px;
      }
      .header-title {
        font-size: 24px;
        font-weight: 300;
        color: #18181b;
        margin: 0;
        letter-spacing: -0.5px;
        font-family: ${selectedFont};
      }
      .header-divider {
        width: 40px;
        height: 2px;
        background-color: ${primaryColor};
        margin-top: 15px;
      }
      .document-body {
        font-size: 13.5px;
        line-height: 1.75;
        color: #3f3f46;
      }
      .document-body .contract-title {
        color: #18181b;
        font-family: ${selectedFont};
      }
      .document-body .clause-title {
        color: #18181b;
        font-family: ${selectedFont};
      }
      .footer-container {
        position: absolute;
        bottom: 30px;
        left: ${margins.left};
        right: ${margins.right};
        text-align: left;
        font-size: 11px;
        color: #a1a1aa;
      }
    `;
    headerHtml = `
      <div class="header-container">
        ${logoUrl ? `<div class="header-logo-container"><img src="${xss(logoUrl)}" alt="Logo" style="max-height: 30px; filter: grayscale(100%);" /></div>` : ''}
        <h1 class="header-title">${xss(headerText || title)}</h1>
        <div class="header-divider"></div>
      </div>
    `;
    footerHtml = `
      <div class="footer-container">
        <div>${xss(footerText || 'Documento simples gerado digitalmente.')}</div>
      </div>
    `;
  }

  // Retornar documento HTML completo com estilos auto-contidos
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${xss(title)}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@300;400;600;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Roboto:wght@300;400;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&display=swap" rel="stylesheet">
      <style>
        ${themeStyles}
        /* Garantias de impressão com alta fidelidade */
        @media print {
          @page {
            size: A4;
            margin: 0; /* Remove as margens padrões do navegador para controle total */
          }
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page {
            ${backgroundStyle}
            box-shadow: none !important;
            width: 210mm !important;
            min-height: 297mm !important;
            padding: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left} !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            position: relative !important;
            border-collapse: collapse !important;
            /* Mantém as bordas e cores originais de cada tema */
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Enforça fidelidade de cores de background e texto para todos os elementos */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        ${extraWrapperStart}
        ${headerHtml}
        <div class="document-body">
          ${content}
        </div>
        ${footerHtml}
        ${extraWrapperEnd}
      </div>
    </body>
    </html>
  `.trim();
}

// Controller Principal
export const generateDocument = async (req, res, next) => {
  try {
    const { template_id, form_data, document_title, lead_id, document_kind } = req.body;

    try {
      const logMsg = `[${new Date().toISOString()}] GENERATE REQUEST:\n` +
                     `  template_id: "${template_id}"\n` +
                     `  document_title: "${document_title}"\n` +
                     `  form_data: ${JSON.stringify(form_data, null, 2)}\n\n`;
      fs.appendFileSync('debug.log', logMsg);
    } catch (err) {
      console.error('Error writing to debug.log:', err);
    }

    if (!template_id) {
      return res.status(400).json({ error: 'O parâmetro template_id é obrigatório.' });
    }

    // 1. Inicializar cliente Supabase respeitando o RLS do usuário autenticado se presente
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    const supabase = createUserSupabaseClient(token);
    const readSupabase = createServiceSupabaseClient() || supabase;

    let currentUser = null;
    if (token) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!userError) currentUser = userData?.user || null;
    }

    // 2. Buscar o template no banco
    const { data: template, error: templateError } = await readSupabase
      .from('templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (templateError || !template) {
      console.error('❌ Erro ao buscar template:', templateError);
      return res.status(404).json({ 
        error: 'Template não encontrado ou acesso não autorizado.',
        details: templateError?.message 
      });
    }

    // 2b. Buscar os campos do template para ler configurações extras (como o formato do repetidor de cláusulas)
    const { data: fields, error: fieldsError } = await readSupabase
      .from('template_fields')
      .select('*')
      .eq('template_id', template_id)
      .order('display_order', { ascending: true });

    if (fieldsError) {
      console.warn('⚠️ Erro ao buscar template_fields (continuando com dados básicos):', fieldsError.message);
    }

    const fieldsMap = {};
    if (fields) {
      fields.forEach(f => {
        let config = {};
        if (f.placeholder && f.placeholder.startsWith('{') && f.placeholder.endsWith('}')) {
          try {
            config = JSON.parse(f.placeholder);
          } catch (e) {
            // Não é um JSON válido
          }
        }
        fieldsMap[f.key] = {
          ...f,
          config
        };
      });
    }

    // 3. Executar o motor de substituição (Regex) no conteúdo do template
    let compiledContent = template.content;

    // A. Processar blocos condicionais [if chave] ... [/if] ou [if chave == "valor"] ... [/if] no conteúdo
    let previousContent = '';
    let safetyCounter = 0;
    while (compiledContent !== previousContent && safetyCounter < 5) {
      previousContent = compiledContent;
      safetyCounter++;
      compiledContent = compiledContent.replace(/\[if\s+([a-zA-Z0-9_]+)(?:\s*(==|!=)\s*(["'])(.*?)\3)?\]([\s\S]*?)\[\/if\]/g, (match, key, operator, quote, val, body) => {
        const fieldValue = form_data ? form_data[key] : undefined;
        
        // Se não há operador, checa se o valor é "truthy" ou "true" ou "Sim"
        if (!operator) {
          const isTruthy = fieldValue === true || fieldValue === 'true' || fieldValue === 'Sim' || (fieldValue && fieldValue !== 'Não' && fieldValue !== 'false');
          return isTruthy ? body : '';
        }
        
        // Se há operador (== ou !=)
        if (operator === '==') {
          return String(fieldValue) === String(val) ? body : '';
        } else if (operator === '!=') {
          return String(fieldValue) !== String(val) ? body : '';
        }
        
        return '';
      });
    }
    
    // B. Substitui cada ocorrência do tipo {nome_campo} pelo valor correspondente em form_data
    let replacementsLog = '';
    compiledContent = compiledContent.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
      const val = form_data ? form_data[key] : undefined;
      replacementsLog += `  Replace {${key}}: val=${val !== undefined ? `"${val}"` : 'undefined'} (type=${typeof val})\n`;
      if (form_data && form_data[key] !== undefined && form_data[key] !== null) {
        const val = form_data[key];

        // Se o valor for um Array (repetidor de cláusulas 'clause_adder')
        if (Array.isArray(val)) {
          const fieldConfig = fieldsMap[key]?.config || {};
          const listType = fieldConfig.listType || 'ul'; // 'ul', 'ol', 'p'
          
          const filteredArray = val.map(item => String(item).trim()).filter(item => item !== '');
          if (filteredArray.length === 0) {
            return '';
          }
          
          if (listType === 'p') {
            return filteredArray.map(item => `<p>${xss(item)}</p>`).join('\n');
          }
          
          const tag = listType === 'ol' ? 'ol' : 'ul';
          const listStyle = 'margin: 10px 0; padding-left: 20px;';
          return `<${tag} style="${listStyle}">` + filteredArray.map(item => `<li style="margin-bottom: 5px;">${xss(item)}</li>`).join('') + `</${tag}>`;
        }

        // Se for booleano, converte amigavelmente
        if (typeof val === 'boolean') {
          return val ? 'Sim' : 'Não';
        }

        // Sanitizar valor inserido contra ataques XSS
        return xss(String(val));
      }
      // Se a variável estiver no texto mas não no formulário preenchido, mantém ou remove. 
      return `<span style="color: #ef4444; font-weight: bold;">[${key} não preenchido]</span>`;
    });

    try {
      fs.appendFileSync('debug.log', `Replacements log:\n${replacementsLog}\n`);
    } catch (err) {}

    // 4. Aplicar a envoltura do Papel Timbrado baseada na Identidade Visual
    const finalHTML = applyLetterhead(
      compiledContent, 
      template.visual_identity, 
      template.title
    );

    // 5. Opcional: Salvar o documento gerado no banco de dados para histórico
    // Apenas se o usuário estiver autenticado e o RLS permitir
    let savedDocument = null;
    if (token) {
      const filePath = `generated/${template.id}/${Date.now()}.html`;
      
      // Fazer upload do HTML para o Supabase Storage (bucket crm_documents)
      const { error: uploadError } = await supabase.storage
        .from('crm_documents')
        .upload(filePath, finalHTML, {
          contentType: 'text/html',
          upsert: true
        });
        
      if (uploadError) {
        console.warn('⚠️ Aviso: Erro ao fazer upload do HTML no storage:', uploadError.message);
      }

      const { data: docRecord, error: docError } = await supabase
        .from('documents')
        .insert({
          template_id: template.id,
          user_id: currentUser?.id || template.user_id,
          lead_id: lead_id || null,
          uploaded_by: currentUser?.id || template.user_id,
          title: document_title || `Cópia Gerada - ${template.title}`,
          file_name: `${(document_title || template.title).replace(/[^\w.-]+/g, '_')}.html`,
          file_path: filePath,
          bucket_name: 'crm_documents',
          mime_type: 'text/html',
          file_size: Buffer.byteLength(finalHTML, 'utf8'),
          document_type: document_kind || 'documento_gerado',
          document_kind: document_kind || 'outro',
          form_data: form_data || {},
          rendered_content: finalHTML
        })
        .select()
        .single();
        
      if (docError) {
        console.warn('⚠️ Aviso: Documento gerado com sucesso, mas houve erro ao salvar histórico (RLS):', docError.message);
      } else {
        savedDocument = docRecord;
      }
    }

    // 6. Retorna a resposta de sucesso com o HTML final compilado
    return res.status(200).json({
      success: true,
      message: 'Documento gerado com sucesso!',
      document_id: savedDocument?.id || null,
      html: finalHTML
    });

  } catch (error) {
    next(error);
  }
};

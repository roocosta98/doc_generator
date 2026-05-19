import { createClient } from '@supabase/supabase-js';
import xss from 'xss';

// Função para aplicar a casca do papel timbrado baseado no tema escolhido
function applyLetterhead(content, visualIdentity, title) {
  const theme = visualIdentity.theme || 'classic';
  const primaryColor = visualIdentity.primaryColor || '#1e293b';
  const logoUrl = visualIdentity.logoUrl || '';
  const headerText = visualIdentity.headerText || '';
  const footerText = visualIdentity.footerText || '';
  
  // Margens (padrão A4)
  const margins = visualIdentity.margins || { top: '2.5cm', bottom: '2.5cm', left: '3.0cm', right: '2.0cm' };

  let themeStyles = '';
  let headerHtml = '';
  let footerHtml = '';

  // 1. Estilizações específicas baseadas no tema
  if (theme === 'classic') {
    themeStyles = `
      body {
        font-family: 'Playfair Display', Georgia, serif;
        color: #1e293b;
        background-color: #f8fafc;
        margin: 0;
        padding: 40px;
        display: flex;
        justify-content: center;
      }
      .page {
        background: #ffffff;
        width: 210mm;
        min-height: 297mm;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        padding: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left};
        box-sizing: border-box;
        position: relative;
        border-top: 8px solid ${primaryColor};
      }
      .header-container {
        border-bottom: 2px double #e2e8f0;
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
      }
      .footer-container {
        position: absolute;
        bottom: ${margins.bottom};
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
        <div style="margin-top: 4px;">Pág. 1 de 1</div>
      </div>
    `;

  } else if (theme === 'modern') {
    themeStyles = `
      body {
        font-family: 'Inter', -apple-system, sans-serif;
        color: #0f172a;
        background-color: #f1f5f9;
        margin: 0;
        padding: 40px;
        display: flex;
        justify-content: center;
      }
      .page {
        background: #ffffff;
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
        border-bottom: 1px solid #f1f5f9;
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
      }
      .header-meta {
        text-align: right;
        font-size: 11px;
        color: #64748b;
      }
      .document-body {
        font-size: 13px;
        line-height: 1.6;
        color: #334155;
      }
      .footer-container {
        position: absolute;
        bottom: 30px;
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
        <span style="font-weight: 600;">Confidencial</span>
      </div>
    `;

  } else { // Minimalist
    themeStyles = `
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #27272a;
        background-color: #fafafa;
        margin: 0;
        padding: 40px;
        display: flex;
        justify-content: center;
      }
      .page {
        background: #ffffff;
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
      }
      .header-divider {
        width: 40px;
        height: 2px;
        background-color: #e4e4e7;
        margin-top: 15px;
      }
      .document-body {
        font-size: 13px;
        line-height: 1.7;
        color: #3f3f46;
      }
      .footer-container {
        position: absolute;
        bottom: 40px;
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
        <div>${xss(footerText || 'Gerado dinamicamente.')}</div>
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
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
      <style>
        ${themeStyles}
        /* Garantias de impressão */
        @media print {
          body {
            background-color: #ffffff;
            padding: 0;
          }
          .page {
            box-shadow: none;
            width: 100%;
            min-height: auto;
            border-left: none; /* remove bordas extras para impressão limpa se necessário */
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        ${headerHtml}
        <div class="document-body">
          ${content}
        </div>
        ${footerHtml}
      </div>
    </body>
    </html>
  `.trim();
}

// Controller Principal
export const generateDocument = async (req, res, next) => {
  try {
    const { template_id, form_data } = req.body;

    if (!template_id) {
      return res.status(400).json({ error: 'O parâmetro template_id é obrigatório.' });
    }

    // 1. Inicializar cliente Supabase respeitando o RLS do usuário autenticado se presente
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    const supabase = createClient(
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

    // 2. Buscar o template no banco
    const { data: template, error: templateError } = await supabase
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

    // 3. Executar o motor de substituição (Regex) no conteúdo do template
    let compiledContent = template.content;
    
    // Substitui cada ocorrência do tipo {nome_campo} pelo valor correspondente em form_data
    compiledContent = compiledContent.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
      if (form_data && form_data[key] !== undefined && form_data[key] !== null) {
        // Sanitizar valor inserido contra ataques XSS
        return xss(String(form_data[key]));
      }
      // Se a variável estiver no texto mas não no formulário preenchido, mantém ou remove. 
      // Por padrão empresarial, manteremos o marcador visualizado ou vazio se desejado.
      return `<span style="color: #ef4444; font-weight: bold;">[${key} não preenchido]</span>`;
    });

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
      const { data: docRecord, error: docError } = await supabase
        .from('documents')
        .insert({
          template_id: template.id,
          user_id: template.user_id, // Atribui ao dono do template
          title: `Cópia Gerada - ${template.title}`,
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

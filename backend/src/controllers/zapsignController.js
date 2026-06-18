import { createClient } from '@supabase/supabase-js';

// Auxiliar para obter a URL base da API do ZapSign conforme o ambiente
function getZapSignBaseUrl() {
  return 'https://api.zapsign.com.br/api/v1';
}

async function moveLeadToStage(supabase, leadId, stageSlug) {
  if (!leadId) return;
  const { data: stage, error: stageError } = await supabase
    .from('lead_stages')
    .select('id')
    .eq('slug', stageSlug)
    .single();
  if (stageError || !stage) return;

  await supabase
    .from('leads')
    .update({ stage_id: stage.id })
    .eq('id', leadId);
}

// 1. Enviar documento para assinatura digital na ZapSign
export const sendDocumentToZapSign = async (req, res, next) => {
  try {
    const { document_id, document_title, base64_pdf, signers } = req.body;

    if (!document_title || !base64_pdf || !signers || !Array.isArray(signers) || signers.length === 0) {
      return res.status(400).json({ error: 'Parâmetros document_title, base64_pdf e signers (array) são obrigatórios.' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Sessão expirada. Autenticação necessária.' });
    }

    const supabaseAuthClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false }
      }
    );

    const { data: { user }, error: userError } = await supabaseAuthClient.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido ou não autorizado.' });
    }

    const { data: profile, error: profileError } = await supabaseAuthClient
      .from('profiles')
      .select('zapsign_api_token, zapsign_env')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.zapsign_api_token) {
      return res.status(400).json({ error: 'Você precisa configurar sua chave de API do ZapSign nas configurações antes de enviar documentos.' });
    }

    const zapsignToken = profile.zapsign_api_token;
    const zapsignEnv = profile.zapsign_env || 'sandbox';

    const baseUrl = 'https://api.zapsign.com.br/api/v1';

    // Montar payload para a API do ZapSign
    // Nota: Removendo o prefixo "data:application/pdf;base64," se presente
    const cleanBase64 = base64_pdf.includes(';base64,') 
      ? base64_pdf.split(';base64,')[1] 
      : base64_pdf;

    const zapSignPayload = {
      name: document_title,
      base64_pdf: cleanBase64,
      lang: 'pt-br',
      signers: signers.map(s => ({
        name: s.name,
        email: s.email,
        phone_country: s.phone ? '55' : undefined,
        phone_number: s.phone || undefined,
        send_email: true
      })),
      sandbox: zapsignEnv.toLowerCase() !== 'production'
    };

    console.log(`📤 Enviando documento "${document_title}" para ZapSign (${process.env.ZAPSIGN_ENV || 'sandbox'})...`);

    const response = await fetch(`${baseUrl}/docs/?api_token=${zapsignToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(zapSignPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro retornado pela ZapSign:', result);
      throw new Error(result.detail || result.error || 'Falha ao enviar documento para o ZapSign.');
    }

    // Criar os metadados unificados para salvar no banco
    const zapsignMetadata = {
      doc_token: result.token,
      status: result.status || 'pending',
      original_file: result.original_file_url,
      signed_file: result.signed_file_url,
      created_at: new Date().toISOString(),
      signers: (result.signers || []).map(s => ({
        name: s.name,
        email: s.email,
        token: s.token,
        sign_url: s.sign_url,
        status: s.status || 'pending'
      }))
    };

    // Se houver um document_id associado, atualizar o registro no Supabase
    if (document_id) {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
          global: {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
          auth: { persistSession: false }
        }
      );

      const { error: updateError } = await supabase
        .from('documents')
        .update({ zapsign_metadata: zapsignMetadata })
        .eq('id', document_id);

      if (updateError) {
        console.warn('⚠️ Erro ao salvar zapsign_metadata no Supabase:', updateError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Documento enviado para assinatura com sucesso!',
      data: zapsignMetadata
    });

  } catch (error) {
    console.error('❌ Erro no envio para ZapSign:', error);
    next(error);
  }
};

// 2. Buscar status detalhado e timeline do documento na ZapSign e atualizar banco
export const getDocumentStatus = async (req, res, next) => {
  try {
    const { document_id } = req.params;

    if (!document_id) {
      return res.status(400).json({ error: 'O parâmetro document_id é obrigatório.' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Sessão expirada. Autenticação necessária.' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false }
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido ou não autorizado.' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('zapsign_api_token, zapsign_env')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.zapsign_api_token) {
      return res.status(400).json({ error: 'Você precisa configurar sua chave de API do ZapSign nas configurações antes de consultar o status.' });
    }

    const zapsignToken = profile.zapsign_api_token;
    const zapsignEnv = profile.zapsign_env || 'sandbox';

    const baseUrl = 'https://api.zapsign.com.br/api/v1';

    // 1. Obter o documento no banco para ler o doc_token
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single();

    if (dbError || !document) {
      return res.status(404).json({ error: 'Documento não encontrado ou acesso não autorizado.' });
    }

    const currentMeta = document.zapsign_metadata;
    if (!currentMeta || !currentMeta.doc_token) {
      return res.status(400).json({ error: 'Este documento ainda não foi enviado para assinatura digital no ZapSign.' });
    }

    const docToken = currentMeta.doc_token;

    // 2. Chamar a ZapSign para buscar os dados de status atualizados
    console.log(`🔄 Buscando detalhes do documento ${docToken} na ZapSign...`);
    const detailsResponse = await fetch(`${baseUrl}/docs/${docToken}/?api_token=${zapsignToken}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!detailsResponse.ok) {
      const detailsErr = await detailsResponse.json().catch(() => ({}));
      throw new Error(detailsErr.detail || 'Falha ao buscar detalhes do documento na ZapSign.');
    }

    const detailsResult = await detailsResponse.json();

    // 3. Chamar a ZapSign para buscar a timeline de auditoria (Signer Log)
    console.log(`📅 Buscando log de auditoria para o documento ${docToken}...`);
    const logResponse = await fetch(`${baseUrl}/docs/signer-log/${docToken}?download_pdf=false&api_token=${zapsignToken}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    let timeline = [];
    if (logResponse.ok) {
      timeline = await logResponse.json();
    } else {
      console.warn('⚠️ Não foi possível obter o log de auditoria da ZapSign.');
    }

    // 4. Estruturar os metadados atualizados
    const updatedMetadata = {
      ...currentMeta,
      status: detailsResult.status || currentMeta.status,
      original_file: detailsResult.original_file || currentMeta.original_file,
      signed_file: detailsResult.signed_file || currentMeta.signed_file,
      signers: (detailsResult.signers || []).map(s => {
        // Preservar o sign_url obtido na criação caso não retorne
        const existingSigner = (currentMeta.signers || []).find(es => es.email === s.email);
        return {
          name: s.name,
          email: s.email,
          token: s.token,
          sign_url: s.sign_url || existingSigner?.sign_url || '',
          status: s.status || 'pending'
        };
      })
    };

    // 5. Se o status for 'signed', faz o download do PDF e armazena no Supabase Storage
    let finalFilePath = document.file_path;
    let finalMimeType = document.mime_type;
    let finalFileSize = document.file_size;
    let finalFileName = document.file_name;
    
    // Se mudou para assinado e ainda não salvamos o arquivo final em anexo...
    const isAlreadyDownloaded = document.document_type === 'anexo' && finalFilePath && finalFilePath.includes('signed/');
    if (updatedMetadata.status === 'signed' && !isAlreadyDownloaded && updatedMetadata.signed_file) {
      try {
        console.log(`📥 Baixando documento assinado da ZapSign: ${updatedMetadata.signed_file}`);
        const pdfResponse = await fetch(updatedMetadata.signed_file);
        if (pdfResponse.ok) {
          const pdfBuffer = await pdfResponse.arrayBuffer();
          const fileName = `${document.title.replace(/[^\w.-]+/g, '_')}_Assinado.pdf`;
          const filePath = `signed/${document_id}/${Date.now()}_${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('crm_documents')
            .upload(filePath, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: true
            });
            
          if (!uploadError) {
            finalFilePath = filePath;
            finalMimeType = 'application/pdf';
            finalFileSize = pdfBuffer.byteLength;
            finalFileName = fileName;
            console.log(`✅ Documento assinado salvo no storage: ${filePath}`);
          } else {
            console.warn('⚠️ Erro ao fazer upload do PDF assinado:', uploadError.message);
          }
        }
      } catch (err) {
        console.warn('⚠️ Erro ao baixar ou salvar PDF assinado:', err.message);
      }
    }

    // 6. Atualizar o Supabase se o status ou arquivo tiver mudado
    const hasChanged = JSON.stringify(currentMeta) !== JSON.stringify(updatedMetadata) || finalFilePath !== document.file_path;
    if (hasChanged) {
      const { error: updateError } = await supabase
        .from('documents')
        .update({ 
          zapsign_metadata: updatedMetadata,
          file_path: finalFilePath,
          mime_type: finalMimeType,
          file_size: finalFileSize,
          file_name: finalFileName,
          document_type: updatedMetadata.status === 'signed' ? 'anexo' : document.document_type
        })
        .eq('id', document_id);

      if (updateError) {
        console.warn('⚠️ Erro ao atualizar documento no Supabase:', updateError.message);
      }
    }

    // 7. Retornar a resposta combinando detalhes do documento, signatários e timeline
    if (updatedMetadata.status === 'signed' && document.lead_id) {
      await moveLeadToStage(supabase, document.lead_id, 'ganho-onboarding');
    }

    return res.status(200).json({
      success: true,
      document_title: document.title,
      zapsign_metadata: updatedMetadata,
      timeline: timeline
    });

  } catch (error) {
    console.error('❌ Erro ao buscar status na ZapSign:', error);
    next(error);
  }
};

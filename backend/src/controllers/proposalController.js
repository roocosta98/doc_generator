import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

function createUserClient(token) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    auth: { persistSession: false }
  });
}

function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey === 'cole_a_service_role_key_aqui') return null;
  return createClient(process.env.SUPABASE_URL, serviceKey, {
    auth: { persistSession: false }
  });
}

function hashCode(code) {
  return crypto.createHash('sha256').update(`${code}:${process.env.PROPOSAL_CODE_SECRET || 'crm-documentacao'}`).digest('hex');
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html
  });
  return true;
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

export const sendProposalConfirmation = async (req, res, next) => {
  try {
    const { document_id, public_base_url } = req.body;
    if (!document_id) {
      return res.status(400).json({ error: 'document_id é obrigatório.' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Autenticação necessária.' });
    }

    const supabase = createUserClient(token);
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('id, title, lead_id, document_kind, lead:leads(company_name, contact_name, email)')
      .eq('id', document_id)
      .single();

    if (documentError || !document) {
      return res.status(404).json({ error: 'Documento não encontrado.' });
    }

    const publicToken = crypto.randomUUID();
    const verificationCode = generateCode();
    const publicUrl = `${(public_base_url || process.env.CRM_PUBLIC_BASE_URL || '').replace(/\/$/, '')}/propostas/${publicToken}`;

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        proposal_public_token: publicToken,
        proposal_confirmation_code_hash: hashCode(verificationCode),
        proposal_confirmation_sent_at: new Date().toISOString()
      })
      .eq('id', document_id);

    if (updateError) throw updateError;

    let emailSent = false;
    const clientEmail = document.lead?.email;
    if (clientEmail) {
      emailSent = await sendEmail({
        to: clientEmail,
        subject: `Confirmação da proposta - ${document.lead?.company_name || document.title}`,
        html: `
          <p>Olá, ${document.lead?.contact_name || 'cliente'}.</p>
          <p>Sua proposta está disponível para visualização e confirmação neste link:</p>
          <p><a href="${publicUrl}">${publicUrl}</a></p>
          <p>Código de confirmação: <strong>${verificationCode}</strong></p>
        `
      });
    }

    return res.status(200).json({
      success: true,
      public_token: publicToken,
      public_url: publicUrl,
      email_sent: emailSent,
      verification_code: emailSent ? undefined : verificationCode
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicProposal = async (req, res, next) => {
  try {
    const { token } = req.params;
    const supabase = createAdminClient();
    if (!supabase) {
      return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no backend.' });
    }

    const { data: document, error } = await supabase
      .from('documents')
      .select('id, title, rendered_content, lead_id, document_kind, viewed_at, proposal_confirmed_at, lead:leads(company_name)')
      .eq('proposal_public_token', token)
      .single();

    if (error || !document) {
      return res.status(404).json({ error: 'Proposta não encontrada.' });
    }

    if (!document.viewed_at) {
      await supabase
        .from('documents')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', document.id);
    }

    if (document.document_kind === 'proposta' && document.lead_id) {
      await moveLeadToStage(supabase, document.lead_id, 'em-fechamento');
    }

    return res.status(200).json({
      success: true,
      proposal: {
        title: document.title,
        rendered_content: document.rendered_content,
        lead_name: document.lead?.company_name || 'Cliente',
        confirmed_at: document.proposal_confirmed_at
      }
    });
  } catch (error) {
    next(error);
  }
};

export const confirmPublicProposal = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Código de confirmação obrigatório.' });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no backend.' });
    }

    const { data: document, error } = await supabase
      .from('documents')
      .select('id, lead_id, proposal_confirmation_code_hash')
      .eq('proposal_public_token', token)
      .single();

    if (error || !document) {
      return res.status(404).json({ error: 'Proposta não encontrada.' });
    }

    if (document.proposal_confirmation_code_hash !== hashCode(String(code).trim())) {
      return res.status(400).json({ error: 'Código inválido.' });
    }

    const confirmedAt = new Date().toISOString();
    await supabase
      .from('documents')
      .update({ proposal_confirmed_at: confirmedAt })
      .eq('id', document.id);

    await moveLeadToStage(supabase, document.lead_id, 'em-fechamento');

    return res.status(200).json({ success: true, confirmed_at: confirmedAt });
  } catch (error) {
    next(error);
  }
};

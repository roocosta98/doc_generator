import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import dns from 'dns';

// Workaround for Node.js fetch DNS resolution issues (IPv6 vs IPv4) on hosting providers like Render
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
import { generateDocument } from './controllers/documentController.js';
import { sendDocumentToZapSign, getDocumentStatus } from './controllers/zapsignController.js';
import { confirmPublicProposal, getPublicProposal, sendProposalConfirmation } from './controllers/proposalController.js';
import { importCompanyDocuments } from './controllers/companyDocumentController.js';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares Globais de Segurança e Utilidades
app.use(helmet({
  contentSecurityPolicy: false, // Desabilitado para permitir renderizações ricas de HTML/CSS de forma flexível em desenvolvimento
}));

app.use(cors({
  origin: '*', // Permitir todas as origens em desenvolvimento. Em produção, configurar domínio específico.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rota de Health Check
app.get('/health', async (req, res) => {
  let supabaseFetchResult = 'not_attempted';
  if (process.env.SUPABASE_URL) {
    try {
      const start = Date.now();
      const testRes = await fetch(process.env.SUPABASE_URL);
      supabaseFetchResult = `success (status: ${testRes.status}, time: ${Date.now() - start}ms)`;
    } catch (err) {
      supabaseFetchResult = `failed: ${err.message}`;
      if (err.cause) {
        supabaseFetchResult += ` (cause: ${err.cause.message || err.cause})`;
      }
    }
  }
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Document Generator API Engine',
    supabaseFetchResult,
    diagnostics: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      supabaseUrlLength: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.length : 0,
      hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
      hasSupabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV || 'not set'
    }
  });
});

// Rota Principal de Geração Dinâmica de Documento
app.post('/api/documents/generate', generateDocument);
app.post('/api/company-documents/import', importCompanyDocuments);
app.post('/api/proposals/send-confirmation', sendProposalConfirmation);
app.get('/api/proposals/public/:token', getPublicProposal);
app.post('/api/proposals/public/:token/confirm', confirmPublicProposal);

// Rotas da Integração com ZapSign
app.post('/api/zapsign/send', sendDocumentToZapSign);
app.get('/api/zapsign/status/:document_id', getDocumentStatus);

// Middleware Global de Tratamento de Erros
app.use((err, req, res, next) => {
  console.error('❌ Erro capturado pelo middleware global:', err.stack);
  res.status(500).json({
    error: 'Ocorreu um erro interno no servidor de geração de documentos.',
    details: err.message
  });
});

// Inicialização do Servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor de Geração de Documentos rodando na porta ${PORT}`);
  console.log(`📡 URL Base: http://localhost:${PORT}`);
});

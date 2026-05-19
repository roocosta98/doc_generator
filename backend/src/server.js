import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { generateDocument } from './controllers/documentController.js';

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

app.use(express.json());

// Rota de Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Document Generator API Engine'
  });
});

// Rota Principal de Geração Dinâmica de Documento
app.post('/api/documents/generate', generateDocument);

// Middleware Global de Tratamento de Erros
app.use((err, req, res, next) => {
  console.error('❌ Erro capturado pelo middleware global:', err.stack);
  res.status(500).json({
    error: 'Ocorreu um erro interno no servidor de geração de documentos.',
    details: err.message
  });
});

// Inicialização do Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Geração de Documentos rodando na porta ${PORT}`);
  console.log(`📡 URL Base: http://localhost:${PORT}`);
});

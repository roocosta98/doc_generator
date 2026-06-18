import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  User, 
  Users, 
  Shield, 
  Clock, 
  Search, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  Trash2, 
  UserPlus, 
  X, 
  CheckCircle2, 
  Lock, 
  Mail 
} from 'lucide-react';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Dados do Administrador Logado
  const [currentUser, setCurrentUser] = useState(null);

  // Estados do Modal e Cadastro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [newRole, setNewRole] = useState('client');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de Alertas de Ação (Sucesso/Erro)
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    // Buscar usuário atual da sessão
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('❌ Erro ao buscar lista de usuários:', err);
      setError(err.message || 'Não foi possível carregar a lista de usuários.');
    } finally {
      setIsLoading(false);
    }
  };

  // Exclusão de Usuário via RPC
  const handleDeleteUser = async (userId, userEmail) => {
    if (userId === currentUser?.id) {
      alert('Você não pode excluir o seu próprio perfil de administrador ativo.');
      return;
    }

    if (!window.confirm(`Deseja realmente remover permanentemente o usuário ${userEmail}? Esta ação excluirá todos os seus modelos e documentos e não pode ser desfeita.`)) {
      return;
    }

    setIsLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const { error } = await supabase.rpc('delete_user', { user_id: userId });
      
      if (error) throw error;

      setActionSuccess(`Usuário ${userEmail} removido com sucesso.`);
      fetchUsers();
    } catch (err) {
      console.error('❌ Erro ao remover usuário:', err);
      setActionError(err.message || 'Não foi possível remover o usuário.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cadastro de Usuário via RPC (Sem deslogar o Admin)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!newEmail.trim() || !newPassword || !newPasswordConfirm) {
      setActionError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setActionError('As senhas digitadas não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setActionError('A senha deve possuir pelo menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('create_user', {
        user_email: newEmail.trim(),
        user_password: newPassword,
        user_role: newRole
      });

      if (error) throw error;

      setActionSuccess(`Usuário ${newEmail.trim()} cadastrado com sucesso como ${newRole === 'admin' ? 'Administrador' : 'Cliente'}.`);
      
      // Resetar Formulário e Fechar Modal
      setNewEmail('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setNewRole('client');
      setIsModalOpen(false);

      fetchUsers();
    } catch (err) {
      console.error('❌ Erro ao criar usuário:', err);
      setActionError(err.message || 'Erro ao processar criação de conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtragem local baseada na barra de busca
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container">
      {/* Cabeçalho */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          marginBottom: '8px', 
          background: 'linear-gradient(135deg, #fff, #94a3b8)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent' 
        }}>
          Diretório de Usuários Cadastrados
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Painel de controle administrativo. Visualize, crie e remova contas de acesso da plataforma.
        </p>
      </div>

      {/* Alerta de Sucesso ou Erro Geral na Página */}
      {actionSuccess && (
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto 20px auto',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--success-glow)',
          border: '1px solid var(--success)',
          color: '#34d399',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          fontSize: '14px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CheckCircle2 size={16} />
          <span style={{ flex: 1 }}>{actionSuccess}</span>
          <button 
            onClick={() => setActionSuccess(null)}
            style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            Fechar
          </button>
        </div>
      )}

      {actionError && !isModalOpen && (
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto 20px auto',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid var(--danger)',
          color: '#f87171',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          fontSize: '14px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <AlertCircle size={16} />
          <span style={{ flex: 1 }}>{actionError}</span>
          <button 
            onClick={() => setActionError(null)}
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            Fechar
          </button>
        </div>
      )}

      {/* Barra de Pesquisa & Ações */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto 24px auto',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          minWidth: '280px'
        }}>
          <Search 
            size={18} 
            color="var(--text-muted)" 
            style={{ position: 'absolute', left: '16px', pointerEvents: 'none' }} 
          />
          <input 
            type="text"
            className="input-field"
            style={{ paddingLeft: '48px', height: '48px', borderRadius: 'var(--radius-md)' }}
            placeholder="Pesquisar usuário por e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-primary" 
          style={{ height: '48px', borderRadius: 'var(--radius-md)', padding: '0 24px' }}
          onClick={() => {
            setActionError(null);
            setActionSuccess(null);
            setIsModalOpen(true);
          }}
        >
          <UserPlus size={18} />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Tratamento de Estados (Erro, Carregamento, Sem Resultados, Lista) */}
      {isLoading && users.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '60px 0' }}>
          <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={32} color="var(--primary)" />
          <span style={{ color: 'var(--text-secondary)' }}>Carregando dados dos usuários...</span>
        </div>
      ) : error ? (
        <div className="card" style={{ 
          textAlign: 'center', 
          padding: '40px 24px', 
          border: '1px solid var(--danger)', 
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <AlertCircle size={36} color="var(--danger)" style={{ marginBottom: '16px', alignSelf: 'center', display: 'inline-block' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px', color: '#f87171' }}>Acesso Negado ou Erro de Rede</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
            {error === 'new row violates row-level security policy for table "profiles"' || error.includes('security policy')
              ? 'Você não tem permissão de administrador para visualizar esses registros.'
              : error}
          </p>
          <button className="btn btn-secondary" onClick={fetchUsers}>Tentar Novamente</button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', border: '1px dashed var(--bg-card-border)', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '56px', 
            height: '56px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(255,255,255,0.02)', 
            color: 'var(--text-muted)', 
            marginBottom: '16px' 
          }}>
            <Users size={26} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>
            {searchQuery ? 'Nenhum usuário correspondente' : 'Nenhum usuário cadastrado'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '380px', margin: '0 auto' }}>
            {searchQuery 
              ? `Não encontramos usuários correspondentes à busca por "${searchQuery}".`
              : 'Nenhum perfil de usuário foi encontrado na base de dados.'
            }
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden', maxWidth: '1000px', margin: '0 auto', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bg-card-border)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <th style={{ padding: '18px 24px', color: 'var(--text-secondary)', fontWeight: '600' }}>Identificação (E-mail)</th>
                  <th style={{ padding: '18px 24px', color: 'var(--text-secondary)', fontWeight: '600' }}>Cargo / Permissão</th>
                  <th style={{ padding: '18px 24px', color: 'var(--text-secondary)', fontWeight: '600' }}>Membro Desde</th>
                  <th style={{ padding: '18px 24px', color: 'var(--text-secondary)', fontWeight: '600' }}>ID Interno</th>
                  <th style={{ padding: '18px 24px', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((profile) => (
                  <tr key={profile.id} style={{ 
                    borderBottom: '1px solid var(--bg-card-border)', 
                    transition: 'var(--transition-fast)' 
                  }} className="table-row-hover">
                    <td style={{ padding: '18px 24px', fontWeight: '700', color: 'white' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: profile.role === 'admin' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: profile.role === 'admin' ? 'var(--secondary)' : 'var(--primary)'
                        }}>
                          <User size={16} />
                        </div>
                        <span>{profile.email}</span>
                      </div>
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      {profile.role === 'admin' ? (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          backgroundColor: 'rgba(168, 85, 247, 0.15)', 
                          color: 'var(--secondary)', 
                          border: '1px solid rgba(168, 85, 247, 0.3)', 
                          padding: '4px 10px', 
                          borderRadius: '12px'
                        }}>
                          <Shield size={12} />
                          <span>Administrador</span>
                        </span>
                      ) : (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                          color: 'var(--primary)', 
                          border: '1px solid rgba(99, 102, 241, 0.2)', 
                          padding: '4px 10px', 
                          borderRadius: '12px'
                        }}>
                          <span>Cliente</span>
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '18px 24px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <Clock size={14} color="var(--text-muted)" />
                        <span>{new Date(profile.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    </td>
                    <td style={{ padding: '18px 24px', color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'monospace' }}>
                      {profile.id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                      <button
                        className="btn"
                        style={{ 
                          padding: '8px', 
                          borderRadius: '8px', 
                          backgroundColor: profile.id === currentUser?.id ? 'transparent' : 'rgba(239, 68, 68, 0.1)', 
                          border: '1px solid rgba(239, 68, 68, 0.15)',
                          color: 'var(--danger)',
                          cursor: profile.id === currentUser?.id ? 'not-allowed' : 'pointer',
                          opacity: profile.id === currentUser?.id ? 0.3 : 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'var(--transition-fast)'
                        }}
                        disabled={profile.id === currentUser?.id}
                        onClick={() => handleDeleteUser(profile.id, profile.email)}
                        title={profile.id === currentUser?.id ? "Você não pode excluir sua própria conta" : "Remover Usuário"}
                        onMouseEnter={(e) => {
                          if (profile.id !== currentUser?.id) {
                            e.currentTarget.style.backgroundColor = 'var(--danger)';
                            e.currentTarget.style.color = 'white';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (profile.id !== currentUser?.id) {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.color = 'var(--danger)';
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Premium de Criação de Usuário */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{
            maxWidth: '460px',
            width: '100%',
            border: '1px solid var(--bg-card-border)',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
            overflow: 'hidden',
            padding: '28px',
            animation: 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Detalhe de Brilho Superior */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '20%',
              right: '20%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--primary), var(--secondary), transparent)',
            }}></div>

            {/* Botão de Fechar */}
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserPlus size={20} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Cadastrar Novo Usuário</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>O usuário será registrado com o acesso configurado abaixo.</p>
              </div>
            </div>

            {actionError && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                color: '#f87171',
                marginBottom: '20px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                fontSize: '13px'
              }}>
                <AlertCircle size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={12} /> Endereço de E-mail
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="exemplo@empresa.com"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={12} /> Senha Provisória
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Mínimo 6 caracteres"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={12} /> Confirmar Senha
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Repita a senha provisória"
                  required
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0, textAlign: 'left' }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={12} /> Nível de Acesso (Cargo)
                </label>
                <select
                  className="input-field"
                  style={{ cursor: 'pointer' }}
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="client">Cliente (Padrão)</option>
                  <option value="admin">Administrador (Total)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={16} /> Cadastrando...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} /> Cadastrar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

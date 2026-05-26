'use client'

import { useEffect, useState } from 'react'

const panelStyle = {
  borderRadius: '30px',
  padding: '24px',
  background: '#ffffff',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 18px 42px rgba(15, 23, 42, 0.08)',
}

const titleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '24px',
  fontWeight: 900,
  letterSpacing: '-0.04em',
}

const textStyle = {
  margin: '10px 0 0',
  color: '#52637a',
  fontSize: '15px',
  lineHeight: 1.7,
}

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '12px',
  marginTop: '18px',
}

const statCardStyle = {
  padding: '16px',
  borderRadius: '18px',
  background: '#f8fafc',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  textAlign: 'center',
}

const statLabelStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const statValueStyle = {
  margin: '8px 0 0',
  color: '#10233e',
  fontSize: '28px',
  fontWeight: 900,
  letterSpacing: '-0.05em',
}

const filterRowStyle = {
  display: 'flex',
  gap: '12px',
  marginTop: '18px',
  flexWrap: 'wrap',
}

const filterButtonStyle = (active) => ({
  padding: '8px 14px',
  borderRadius: '999px',
  border: active ? '1px solid #2563eb' : '1px solid rgba(148, 163, 184, 0.18)',
  background: active ? '#2563eb' : '#f8fafc',
  color: active ? '#ffffff' : '#52637a',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s',
})

const tableContainerStyle = {
  marginTop: '18px',
  overflowX: 'auto',
  borderRadius: '18px',
  border: '1px solid rgba(148, 163, 184, 0.18)',
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px',
}

const thStyle = {
  padding: '14px',
  background: '#f8fafc',
  textAlign: 'left',
  fontWeight: 900,
  color: '#10233e',
  borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
}

const tdStyle = {
  padding: '14px',
  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
  color: '#52637a',
}

const badgeStyle = (type) => {
  const styles = {
    admin: { background: '#fee2e2', color: '#7f1d1d' },
    developer: { background: '#dbeafe', color: '#1e40af' },
    operational: { background: '#dcfce7', color: '#166534' },
  }
  return {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    ...styles[type],
  }
}

const buttonStyle = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: 'none',
  background: '#ff8c00',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s',
}

const messageStyle = (type) => ({
  margin: '18px 0 0',
  padding: '12px 14px',
  borderRadius: '14px',
  border: type === 'error' ? '1px solid rgba(239, 68, 68, 0.18)' : '1px solid rgba(34, 197, 94, 0.18)',
  background: type === 'error' ? '#fff1f2' : '#f0fdf4',
  color: type === 'error' ? '#9f1239' : '#166534',
  fontSize: '14px',
  fontWeight: 700,
})

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const modalStyle = {
  background: '#ffffff',
  borderRadius: '20px',
  padding: '28px',
  maxWidth: '500px',
  width: '90%',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
}

const modalTitleStyle = {
  margin: 0,
  fontSize: '22px',
  fontWeight: 900,
  color: '#10233e',
}

const modalTextStyle = {
  margin: '12px 0 0',
  color: '#52637a',
  fontSize: '15px',
  lineHeight: 1.6,
}

const codeBlockStyle = {
  margin: '14px 0',
  padding: '12px',
  background: '#f1f5f9',
  borderRadius: '8px',
  fontFamily: 'monospace',
  fontSize: '13px',
  color: '#10233e',
  overflowX: 'auto',
}

const modalButtonsStyle = {
  display: 'flex',
  gap: '12px',
  marginTop: '20px',
  justifyContent: 'flex-end',
}

const modalButtonStyle = (primary) => ({
  padding: '10px 16px',
  borderRadius: '8px',
  border: primary ? 'none' : '1px solid rgba(148, 163, 184, 0.18)',
  background: primary ? '#2563eb' : '#f8fafc',
  color: primary ? '#ffffff' : '#52637a',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
})

function formatDate(dateString) {
  if (!dateString) return 'Sem registo'
  try {
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  } catch {
    return 'Data invalida'
  }
}

export default function UserManagementPanel() {
  const [users, setUsers] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [resetModal, setResetModal] = useState(null)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/developer/users')
      if (!res.ok) throw new Error('Erro ao carregar utilizadores')
      const data = await res.json()
      setUsers(data.users)
      setSummary(data.summary)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword() {
    if (!resetModal) return
    try {
      setResetLoading(true)
      setResetMessage(null)
      const res = await fetch('/api/developer/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetModal.id, type: resetModal.type }),
      })
      if (!res.ok) throw new Error('Erro ao redefinir palavra-passe')
      const data = await res.json()
      setResetMessage({
        type: 'success',
        tempPassword: data.temporaryPassword,
      })
    } catch (err) {
      setResetMessage({ type: 'error', message: err.message })
    } finally {
      setResetLoading(false)
    }
  }

  const filteredUsers =
    filter === 'all' ? users : users.filter(user => user.type === filter)

  if (loading) {
    return (
      <section style={panelStyle}>
        <h2 style={titleStyle}>Gestão de Contas</h2>
        <p style={textStyle}>A carregar utilizadores...</p>
      </section>
    )
  }

  return (
    <>
      <section style={panelStyle}>
        <h2 style={titleStyle}>Gestão de Contas</h2>
        <p style={textStyle}>
          Gerir utilizadores: admins, programadores e staff operacional. Vê os ultimos logins
          e reseta palavras-passe quando necessario.
        </p>

        {error && <div style={messageStyle('error')}>{error}</div>}

        {summary && (
          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Total</p>
              <p style={statValueStyle}>{summary.total}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Admins</p>
              <p style={statValueStyle}>{summary.admins}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Programadores</p>
              <p style={statValueStyle}>{summary.developers}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Operacional</p>
              <p style={statValueStyle}>{summary.operational}</p>
            </div>
          </div>
        )}

        <div style={filterRowStyle}>
          <button
            style={filterButtonStyle(filter === 'all')}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button
            style={filterButtonStyle(filter === 'admin')}
            onClick={() => setFilter('admin')}
          >
            Admins
          </button>
          <button
            style={filterButtonStyle(filter === 'developer')}
            onClick={() => setFilter('developer')}
          >
            Programadores
          </button>
          <button
            style={filterButtonStyle(filter === 'operational')}
            onClick={() => setFilter('operational')}
          >
            Operacional
          </button>
        </div>

        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Nome</th>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Último Login</th>
                <th style={thStyle}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={`${user.type}-${user.id}`}>
                  <td style={tdStyle}>{user.name}</td>
                  <td style={tdStyle}>{user.username}</td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(user.type)}>
                      {user.type === 'admin'
                        ? 'Admin'
                        : user.type === 'developer'
                          ? 'Programador'
                          : 'Operacional'}
                    </span>
                  </td>
                  <td style={tdStyle}>{formatDate(user.lastLoginAt)}</td>
                  <td style={tdStyle}>
                    <button
                      style={buttonStyle}
                      onClick={() => setResetModal(user)}
                    >
                      Reset Palavra-passe
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {resetModal && (
        <div style={modalOverlayStyle} onClick={() => !resetLoading && setResetModal(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={modalTitleStyle}>Redefinir Palavra-passe</h3>
            <p style={modalTextStyle}>
              Tem a certeza que quer redefinir a palavra-passe de <strong>{resetModal.name}</strong> (
              {resetModal.username})?
            </p>
            <p style={modalTextStyle}>
              Uma palavra-passe temporaria sera gerada. O utilizador devera altera-la no proximo
              login.
            </p>

            {resetMessage && resetMessage.type === 'success' && (
              <div>
                <div style={messageStyle('success')}>
                  Palavra-passe redefinida com sucesso!
                </div>
                <p style={{ ...modalTextStyle, marginTop: '16px', fontWeight: 'bold' }}>
                  Palavra-passe temporária:
                </p>
                <div style={codeBlockStyle}>{resetMessage.tempPassword}</div>
                <p style={modalTextStyle}>
                  Partilhe esta palavra-passe com o utilizador de forma segura. Sera valida ate
                  ele fazer login.
                </p>
              </div>
            )}

            {resetMessage && resetMessage.type === 'error' && (
              <div style={messageStyle('error')}>{resetMessage.message}</div>
            )}

            {!resetMessage && (
              <div style={modalButtonsStyle}>
                <button
                  style={modalButtonStyle(false)}
                  onClick={() => setResetModal(null)}
                  disabled={resetLoading}
                >
                  Cancelar
                </button>
                <button
                  style={modalButtonStyle(true)}
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                >
                  {resetLoading ? 'A processar...' : 'Redefinir Palavra-passe'}
                </button>
              </div>
            )}

            {resetMessage && resetMessage.type === 'success' && (
              <div style={modalButtonsStyle}>
                <button
                  style={modalButtonStyle(true)}
                  onClick={() => {
                    setResetModal(null)
                    setResetMessage(null)
                  }}
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

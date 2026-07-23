'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  fetchDeveloperUser,
  fetchDeveloperUsers,
  resetDeveloperUserPassword,
  updateDeveloperUser,
} from '../../frontend/controllers/developer-controller.js'

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

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
}

const buttonStyle = (variant = 'ghost') => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '38px',
  padding: '0 14px',
  borderRadius: '999px',
  border: variant === 'primary' ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
  background: variant === 'primary' ? '#ff8c00' : '#f8fafc',
  color: variant === 'primary' ? '#ffffff' : '#10233e',
  fontSize: '13px',
  fontWeight: 800,
  cursor: 'pointer',
})

const messageStyle = type => ({
  marginTop: '18px',
  padding: '12px 14px',
  borderRadius: '14px',
  border: type === 'error' ? '1px solid rgba(239, 68, 68, 0.18)' : '1px solid rgba(34, 197, 94, 0.18)',
  background: type === 'error' ? '#fff1f2' : '#f0fdf4',
  color: type === 'error' ? '#9f1239' : '#166534',
  fontSize: '14px',
  fontWeight: 700,
})

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
  gap: '10px',
  marginTop: '18px',
  flexWrap: 'wrap',
  alignItems: 'center',
}

const advancedFilterGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '10px',
  marginTop: '12px',
}

const searchInputStyle = {
  padding: '10px 14px',
  borderRadius: '999px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: '#f8fafc',
  color: '#10233e',
  fontSize: '14px',
  minWidth: '200px',
  maxWidth: '300px',
  flexGrow: 1,
}

const filterSelectStyle = {
  minHeight: '42px',
  padding: '0 14px',
  borderRadius: '14px',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: '#ffffff',
  color: '#10233e',
  fontSize: '14px',
  fontWeight: 700,
}

const filterMetaStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 800,
}

const filterButtonStyle = active => ({
  padding: '8px 14px',
  borderRadius: '999px',
  border: active ? '1px solid rgba(255, 140, 0, 0.28)' : '1px solid rgba(148, 163, 184, 0.18)',
  background: active ? '#ff8c00' : '#f8fafc',
  color: active ? '#ffffff' : '#52637a',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
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
  whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '14px',
  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
  color: '#52637a',
  verticalAlign: 'top',
}

const badgeStyle = type => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '88px',
  padding: '6px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 800,
  background:
    type === 'admin'
      ? '#fee2e2'
      : type === 'developer'
        ? '#dbeafe'
        : '#dcfce7',
  color:
    type === 'admin'
      ? '#7f1d1d'
      : type === 'developer'
        ? '#1e40af'
        : '#166534',
})

const statusBadgeStyle = statusKey => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '84px',
  padding: '6px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 800,
  background:
    statusKey === 'blocked'
      ? '#fff1f2'
      : statusKey === 'inactive'
        ? '#f1f5f9'
        : '#ecfdf3',
  color:
    statusKey === 'blocked'
      ? '#9f1239'
      : statusKey === 'inactive'
        ? '#475569'
        : '#166534',
  border:
    statusKey === 'blocked'
      ? '1px solid rgba(244, 63, 94, 0.18)'
      : statusKey === 'inactive'
        ? '1px solid rgba(148, 163, 184, 0.18)'
        : '1px solid rgba(34, 197, 94, 0.18)',
})

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(7, 18, 38, 0.52)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  zIndex: 1000,
}

const modalStyle = {
  width: 'min(760px, 100%)',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#ffffff',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.28)',
  display: 'grid',
  gap: '18px',
}

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '14px',
}

const fieldStyle = {
  display: 'grid',
  gap: '6px',
}

const labelStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const valueBoxStyle = {
  minHeight: '44px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 14px',
  borderRadius: '14px',
  background: '#f8fafc',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  color: '#10233e',
  fontSize: '14px',
  fontWeight: 700,
}

const selectStyle = {
  minHeight: '44px',
  padding: '0 14px',
  borderRadius: '14px',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: '#ffffff',
  color: '#10233e',
  fontSize: '14px',
  fontWeight: 700,
}

const actionStripStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
}

const modalFooterStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
  borderTop: '1px solid rgba(148, 163, 184, 0.18)',
  paddingTop: '16px',
}

const warningBoxStyle = {
  padding: '14px 16px',
  borderRadius: '18px',
  background: '#fff7ed',
  border: '1px solid rgba(249, 115, 22, 0.18)',
  color: '#9a3412',
  display: 'grid',
  gap: '8px',
}

function formatDateTime(value) {
  if (!value) {
    return 'Sem registo'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Sem registo'
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getAccountTypeBadgeLabel(accountType) {
  if (accountType === 'admin') return 'Admin'
  if (accountType === 'developer') return 'Developer'
  return 'Operacional'
}

export default function UserManagementPanel() {
  const [users, setUsers] = useState([])
  const [summary, setSummary] = useState(null)
  const [accessProfiles, setAccessProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [accessProfileFilter, setAccessProfileFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [modalForm, setModalForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      setError(null)
      const { response, data } = await fetchDeveloperUsers()

      if (!response.ok) {
        throw new Error('Erro ao carregar utilizadores')
      }

      setUsers(Array.isArray(data.users) ? data.users : [])
      setSummary(data.summary || null)
      setAccessProfiles(Array.isArray(data.accessProfiles) ? data.accessProfiles : [])
    } catch (fetchError) {
      setError(fetchError.message || 'Erro ao carregar utilizadores')
    } finally {
      setLoading(false)
    }
  }

  async function openUserModal(userId) {
    try {
      setDetailLoading(true)
      setError(null)
      setResetMessage(null)
      const { response, data } = await fetchDeveloperUser(userId)

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar a conta')
      }

      const user = {
        ...data.user,
        lockoutProtection: data.lockoutProtection || null,
      }
      const profileOptions = Array.isArray(data.accessProfiles) ? data.accessProfiles : accessProfiles
      const suggestedProfileId =
        user.accessProfileId ||
        profileOptions.find(profile => profile.key === user.suggestedAccessProfileKey)?.id ||
        ''

      setSelectedUser(user)
      setAccessProfiles(profileOptions)
      setModalForm({
        accessProfileId: suggestedProfileId,
        active: user.active !== false,
        unlockBlocked: false,
      })
      setMessage(null)
    } catch (fetchError) {
      setError(fetchError.message || 'Erro ao carregar a conta')
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleSaveUser() {
    if (!selectedUser || !modalForm) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      setMessage(null)
      const { response, data } = await updateDeveloperUser(selectedUser.id, {
        accessProfileId: modalForm.accessProfileId,
        active: modalForm.active,
        unlockBlocked: modalForm.unlockBlocked,
      })

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao guardar a conta')
      }

      const nextUser = {
        ...data.user,
        lockoutProtection: data.lockoutProtection || null,
      }

      setSelectedUser(nextUser)
      setModalForm(currentForm =>
        currentForm
          ? {
              ...currentForm,
              active: nextUser.active !== false,
              accessProfileId:
                nextUser.accessProfileId ||
                accessProfiles.find(profile => profile.key === nextUser.suggestedAccessProfileKey)?.id ||
                '',
              unlockBlocked: false,
            }
          : currentForm,
      )
      setMessage(data.message || 'Conta atualizada com sucesso.')
      await fetchUsers()
    } catch (saveError) {
      setError(saveError.message || 'Erro ao guardar a conta')
    } finally {
      setSaving(false)
    }
  }

  async function handleResetPassword() {
    if (!selectedUser) {
      return
    }

    try {
      setResetLoading(true)
      setResetMessage(null)
      const { response, data } = await resetDeveloperUserPassword({
        userId: selectedUser.id,
        type: selectedUser.accountType,
      })

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao redefinir password')
      }

      setResetMessage({
        type: 'success',
        temporaryPassword: data.temporaryPassword,
      })
    } catch (resetError) {
      setResetMessage({
        type: 'error',
        message: resetError.message,
      })
    } finally {
      setResetLoading(false)
    }
  }

  const roleOptions = useMemo(() => {
    const roles = new Map()

    users.forEach(user => {
      if (!user.role) {
        return
      }

      roles.set(user.role, {
        value: user.role,
        label: user.roleLabel || user.role,
      })
    })

    return Array.from(roles.values()).sort((left, right) => left.label.localeCompare(right.label, 'pt-PT'))
  }, [users])

  const accessProfileOptions = useMemo(() => {
    const profiles = new Map()

    accessProfiles.forEach(profile => {
      if (!profile?.id) {
        return
      }

      profiles.set(String(profile.id), {
        value: String(profile.id),
        label: profile.name,
      })
    })

    return Array.from(profiles.values()).sort((left, right) => left.label.localeCompare(right.label, 'pt-PT'))
  }, [accessProfiles])

  const statusOptions = useMemo(() => {
    const statuses = new Map()

    users.forEach(user => {
      if (!user.statusKey) {
        return
      }

      statuses.set(user.statusKey, {
        value: user.statusKey,
        label: user.statusLabel || user.statusKey,
      })
    })

    return Array.from(statuses.values())
  }, [users])

  const filteredUsers = useMemo(() => {
    let result = users

    if (filter === 'all') {
      result = users
    } else if (filter === 'blocked') {
      result = users.filter(user => user.statusKey === 'blocked')
    } else if (filter === 'without_profile') {
      result = users.filter(user => !user.hasExplicitAccessProfile)
    } else {
      result = users.filter(user => user.accountType === filter)
    }

    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter)
    }

    if (accessProfileFilter === 'without_profile') {
      result = result.filter(user => !user.hasExplicitAccessProfile)
    } else if (accessProfileFilter !== 'all') {
      result = result.filter(user => String(user.accessProfileId || '') === accessProfileFilter)
    }

    if (statusFilter !== 'all') {
      result = result.filter(user => user.statusKey === statusFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        user =>
          user.name.toLowerCase().includes(query) ||
          user.username.toLowerCase().includes(query) ||
          String(user.roleLabel || '').toLowerCase().includes(query) ||
          String(user.accountTypeLabel || '').toLowerCase().includes(query) ||
          String(user.accessProfileName || user.suggestedAccessProfileName || 'Sem perfil').toLowerCase().includes(query) ||
          String(user.statusLabel || '').toLowerCase().includes(query),
      )
    }

    return result
  }, [accessProfileFilter, filter, roleFilter, searchQuery, statusFilter, users])

  const selectedUserProtection = selectedUser?.lockoutProtection || null
  const lastDeveloperProtected = selectedUserProtection?.isLastAvailableDeveloper === true

  function isAccessProfileOptionDisabled(profile) {
    if (!lastDeveloperProtected) {
      return false
    }

    return profile.hasCriticalDeveloperPermissions !== true
  }

  if (loading) {
    return (
      <section style={panelStyle}>
        <h2 style={titleStyle}>Gestao de Contas</h2>
        <p style={textStyle}>A carregar contas tecnicas...</p>
      </section>
    )
  }

  return (
    <>
      <section style={panelStyle}>
        <div style={topBarStyle}>
          <div>
            <h2 style={titleStyle}>Gestao de Contas</h2>
            <p style={textStyle}>Leitura e manutencao tecnica de contas, perfis de acesso e estado operacional.</p>
          </div>
          <button type="button" style={buttonStyle()} onClick={fetchUsers}>
            Recarregar
          </button>
        </div>

        {error ? <div style={messageStyle('error')}>{error}</div> : null}
        {message ? <div style={messageStyle('success')}>{message}</div> : null}

        {summary ? (
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
              <p style={statLabelStyle}>Developer</p>
              <p style={statValueStyle}>{summary.developers}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Operacional</p>
              <p style={statValueStyle}>{summary.operational}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Bloqueadas</p>
              <p style={statValueStyle}>{summary.blocked}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Sem perfil</p>
              <p style={statValueStyle}>{summary.withoutAccessProfile}</p>
            </div>
          </div>
        ) : null}

        <div style={filterRowStyle}>
          <input
            type="search"
            placeholder="Pesquisar por nome, username, role ou perfil..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
          <button type="button" style={filterButtonStyle(filter === 'all')} onClick={() => setFilter('all')}>
            Todos
          </button>
          <button type="button" style={filterButtonStyle(filter === 'admin')} onClick={() => setFilter('admin')}>
            Admin
          </button>
          <button type="button" style={filterButtonStyle(filter === 'developer')} onClick={() => setFilter('developer')}>
            Developer
          </button>
          <button type="button" style={filterButtonStyle(filter === 'operational')} onClick={() => setFilter('operational')}>
            Operacional
          </button>
          <button type="button" style={filterButtonStyle(filter === 'blocked')} onClick={() => setFilter('blocked')}>
            Bloqueado
          </button>
          <button type="button" style={filterButtonStyle(filter === 'without_profile')} onClick={() => setFilter('without_profile')}>
            Sem perfil
          </button>
        </div>

        <p style={filterMetaStyle}>
          {filteredUsers.length} conta(s) visivel(is). Filtros adicionais por role, accessProfile e estado.
        </p>

        <div style={advancedFilterGridStyle}>
          <div style={fieldStyle}>
            <p style={filterMetaStyle}>Role</p>
            <select
              value={roleFilter}
              onChange={event => setRoleFilter(event.target.value)}
              style={filterSelectStyle}
            >
              <option value="all">Todas as roles</option>
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <p style={filterMetaStyle}>AccessProfile</p>
            <select
              value={accessProfileFilter}
              onChange={event => setAccessProfileFilter(event.target.value)}
              style={filterSelectStyle}
            >
              <option value="all">Todos os profiles</option>
              <option value="without_profile">Sem perfil explicito</option>
              {accessProfileOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <p style={filterMetaStyle}>Estado</p>
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              style={filterSelectStyle}
            >
              <option value="all">Todos os estados</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Nome</th>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>AccessProfile</th>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>Ultimo login</th>
                <th style={thStyle}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td style={tdStyle}>{user.name}</td>
                    <td style={tdStyle}>{user.username}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <span style={badgeStyle(user.accountType)}>{getAccountTypeBadgeLabel(user.accountType)}</span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{user.roleLabel}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'grid', gap: '4px' }}>
                        <span style={{ color: '#10233e', fontWeight: 800 }}>
                          {user.accessProfileName || 'Sem perfil'}
                        </span>
                        {!user.accessProfileName && user.suggestedAccessProfileName ? (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Sugestao: {user.suggestedAccessProfileName}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={statusBadgeStyle(user.statusKey)}>{user.statusLabel}</span>
                    </td>
                    <td style={tdStyle}>{formatDateTime(user.lastLoginAt)}</td>
                    <td style={tdStyle}>
                      <button type="button" style={buttonStyle()} onClick={() => openUserModal(user.id)}>
                        Gerir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#64748b' }} colSpan={7}>
                    Nenhuma conta corresponde aos filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedUser && modalForm ? (
        <div style={modalOverlayStyle} onClick={() => !saving && !resetLoading && setSelectedUser(null)}>
          <div style={modalStyle} onClick={event => event.stopPropagation()}>
            <div style={topBarStyle}>
              <div>
                <h3 style={{ ...titleStyle, fontSize: '22px' }}>Conta tecnica</h3>
                <p style={{ ...textStyle, marginTop: '8px' }}>{selectedUser.name} · {selectedUser.username}</p>
              </div>
              <button type="button" style={buttonStyle()} onClick={() => setSelectedUser(null)}>
                Fechar
              </button>
            </div>

            {detailLoading ? <p style={{ ...textStyle, margin: 0 }}>A carregar detalhe da conta...</p> : null}
            {resetMessage?.type === 'error' ? <div style={messageStyle('error')}>{resetMessage.message}</div> : null}
            {resetMessage?.type === 'success' ? (
              <div style={messageStyle('success')}>
                Password temporaria: <strong>{resetMessage.temporaryPassword}</strong>
              </div>
            ) : null}

            {lastDeveloperProtected ? (
              <article style={warningBoxStyle}>
                <strong>{selectedUserProtection.message}</strong>
                <span>
                  Esta conta e o ultimo developer disponivel. O profile tecnico e a ativacao da conta ficam
                  protegidos para evitar lockout.
                </span>
              </article>
            ) : null}

            <div style={formGridStyle}>
              <div style={fieldStyle}>
                <p style={labelStyle}>Nome</p>
                <div style={valueBoxStyle}>{selectedUser.name}</div>
              </div>
              <div style={fieldStyle}>
                <p style={labelStyle}>Username</p>
                <div style={valueBoxStyle}>{selectedUser.username}</div>
              </div>
              <div style={fieldStyle}>
                <p style={labelStyle}>Role</p>
                <div style={valueBoxStyle}>{selectedUser.roleLabel}</div>
              </div>
              <div style={fieldStyle}>
                <p style={labelStyle}>AccountType</p>
                <div style={valueBoxStyle}>{selectedUser.accountTypeLabel}</div>
              </div>
              <div style={fieldStyle}>
                <p style={labelStyle}>AccessProfile</p>
                <select
                  style={selectStyle}
                  value={modalForm.accessProfileId}
                  onChange={event =>
                    setModalForm(currentForm => ({
                      ...currentForm,
                      accessProfileId: Number(event.target.value),
                    }))
                  }
                >
                  {accessProfiles.map(profile => (
                    <option
                      key={profile.id}
                      value={profile.id}
                      disabled={isAccessProfileOptionDisabled(profile)}
                    >
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={fieldStyle}>
                <p style={labelStyle}>Estado atual</p>
                <div style={valueBoxStyle}>
                  <span style={statusBadgeStyle(selectedUser.statusKey)}>{selectedUser.statusLabel}</span>
                </div>
              </div>
              <div style={fieldStyle}>
                <p style={labelStyle}>Ultimo login</p>
                <div style={valueBoxStyle}>{formatDateTime(selectedUser.lastLoginAt)}</div>
              </div>
            </div>

            <div style={actionStripStyle}>
              <button
                type="button"
                style={buttonStyle(modalForm.active ? 'primary' : 'ghost')}
                onClick={() => setModalForm(currentForm => ({ ...currentForm, active: true }))}
              >
                Ativar conta
              </button>
              <button
                type="button"
                style={buttonStyle(!modalForm.active ? 'primary' : 'ghost')}
                onClick={() => setModalForm(currentForm => ({ ...currentForm, active: false }))}
                disabled={lastDeveloperProtected}
              >
                Desativar conta
              </button>
              {selectedUser.statusKey === 'blocked' ? (
                <button
                  type="button"
                  style={buttonStyle(modalForm.unlockBlocked ? 'primary' : 'ghost')}
                  onClick={() => setModalForm(currentForm => ({ ...currentForm, unlockBlocked: !currentForm.unlockBlocked }))}
                >
                  {modalForm.unlockBlocked ? 'Desbloqueio preparado' : 'Desbloquear conta'}
                </button>
              ) : null}
              <button type="button" style={buttonStyle()} onClick={handleResetPassword} disabled={resetLoading}>
                {resetLoading ? 'A redefinir...' : 'Reset password'}
              </button>
            </div>

            <div style={modalFooterStyle}>
              <p style={{ ...textStyle, margin: 0 }}>
                Ultimo login: {formatDateTime(selectedUser.lastLoginAt)}
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="button" style={buttonStyle()} onClick={() => setSelectedUser(null)}>
                  Cancelar
                </button>
                <button type="button" style={buttonStyle('primary')} onClick={handleSaveUser} disabled={saving}>
                  {saving ? 'A guardar...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

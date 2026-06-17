'use client'

import { useEffect, useMemo, useState } from 'react'

const panelStyle = {
  borderRadius: '30px',
  padding: '24px',
  background: '#ffffff',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 18px 42px rgba(15, 23, 42, 0.08)',
}

const searchInputStyle = {
  padding: '10px 14px',
  borderRadius: '999px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: '#f8fafc',
  color: '#10233e',
  fontSize: '14px',
  width: '100%',
  maxWidth: '300px',
}

const searchToolbarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
  marginBottom: '12px',
}

const searchToolbarActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap',
}

const categoryHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  marginTop: '12px',
  marginBottom: '8px',
  borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
}

const categoryCounterStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '24px',
  height: '24px',
  padding: '0 8px',
  borderRadius: '999px',
  background: '#eff6ff',
  color: '#0369a1',
  fontSize: '12px',
  fontWeight: 900,
}

const criticalIndicatorStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 10px',
  borderRadius: '999px',
  background: '#fef3c7',
  color: '#92400e',
  fontSize: '11px',
  fontWeight: 800,
}

const expandCollapseButtonStyle = {
  background: 'none',
  border: 'none',
  padding: '8px 12px',
  cursor: 'pointer',
  color: '#64748b',
  fontSize: '14px',
  fontWeight: 800,
}

const sectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
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

const buttonStyle = (variant = 'ghost') => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '40px',
  padding: '0 16px',
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

const cardGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '14px',
  marginTop: '18px',
}

const profileCardStyle = selected => ({
  display: 'grid',
  gap: '10px',
  padding: '18px',
  borderRadius: '22px',
  border: selected ? '1px solid rgba(255, 140, 0, 0.32)' : '1px solid rgba(148, 163, 184, 0.18)',
  background: selected ? 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)' : '#f8fafc',
  cursor: 'pointer',
  textAlign: 'left',
})

const profileNameStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '18px',
  fontWeight: 900,
}

const statRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '10px',
}

const statBoxStyle = {
  padding: '12px',
  borderRadius: '16px',
  background: '#ffffff',
  border: '1px solid rgba(148, 163, 184, 0.14)',
}

const statLabelStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '11px',
  fontWeight: 900,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const statValueStyle = {
  margin: '8px 0 0',
  color: '#10233e',
  fontSize: '24px',
  fontWeight: 900,
  letterSpacing: '-0.04em',
}

const detailShellStyle = {
  marginTop: '22px',
  padding: '20px',
  borderRadius: '24px',
  background: '#f8fafc',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  display: 'grid',
  gap: '18px',
}

const detailHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px',
  flexWrap: 'wrap',
}

const tabsStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
}

const tabButtonStyle = active => ({
  padding: '10px 14px',
  borderRadius: '999px',
  border: active ? '1px solid rgba(255, 140, 0, 0.28)' : '1px solid rgba(148, 163, 184, 0.18)',
  background: active ? '#ff8c00' : '#ffffff',
  color: active ? '#ffffff' : '#10233e',
  fontSize: '13px',
  fontWeight: 800,
  cursor: 'pointer',
})

const permissionListStyle = {
  display: 'grid',
  gap: '10px',
}

const permissionRowStyle = isCritical => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '14px',
  padding: '14px 16px',
  borderRadius: '18px',
  background: isCritical ? '#fff7ed' : '#ffffff',
  border: isCritical
    ? '1px solid rgba(249, 115, 22, 0.18)'
    : '1px solid rgba(148, 163, 184, 0.16)',
})

const permissionTextWrapStyle = {
  display: 'grid',
  gap: '4px',
}

const permissionNameStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '14px',
  fontWeight: 800,
}

const permissionMetaStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '12px',
  lineHeight: 1.6,
}

const checkboxStyle = {
  width: '18px',
  height: '18px',
  accentColor: '#ff8c00',
  cursor: 'pointer',
  flexShrink: 0,
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

const emptyStateStyle = {
  padding: '16px 18px',
  borderRadius: '18px',
  background: '#ffffff',
  border: '1px dashed rgba(148, 163, 184, 0.28)',
  color: '#64748b',
  fontSize: '14px',
  lineHeight: 1.6,
}

const userListStyle = {
  display: 'grid',
  gap: '10px',
}

const userRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr) auto',
  gap: '12px',
  alignItems: 'center',
  padding: '14px 16px',
  borderRadius: '18px',
  background: '#ffffff',
  border: '1px solid rgba(148, 163, 184, 0.16)',
}

const userNameStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '14px',
  fontWeight: 800,
}

const userMetaStyle = {
  margin: '4px 0 0',
  color: '#64748b',
  fontSize: '12px',
}

const statusBadgeStyle = statusKey => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '88px',
  padding: '7px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 900,
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

function groupPermissions(permissions) {
  return permissions.reduce((groups, permission) => {
    const category = permission.category || 'other'
    const currentGroup = groups.get(category) || []
    currentGroup.push(permission)
    groups.set(category, currentGroup)
    return groups
  }, new Map())
}

export default function AccessProfilesPanel() {
  const [profiles, setProfiles] = useState([])
  const [permissionsCatalog, setPermissionsCatalog] = useState([])
  const [selectedProfileId, setSelectedProfileId] = useState(null)
  const [profileDetail, setProfileDetail] = useState(null)
  const [draftPermissionKeys, setDraftPermissionKeys] = useState([])
  const [activeTab, setActiveTab] = useState('permissions')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [permissionSearchQuery, setPermissionSearchQuery] = useState('')
  const [expandedPermissionCategories, setExpandedPermissionCategories] = useState(new Set())

  function toggleCategoryExpansion(category) {
    setExpandedPermissionCategories(current => {
      const next = new Set(current)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  function filterPermissionsBySearch(permissions, query) {
    if (!query.trim()) return permissions
    const lowerQuery = query.toLowerCase()
    return permissions.filter(
      p =>
        p.key.toLowerCase().includes(lowerQuery) ||
        p.name.toLowerCase().includes(lowerQuery) ||
        (p.description && p.description.toLowerCase().includes(lowerQuery)),
    )
  }

  function expandAllVisibleCategories() {
    setExpandedPermissionCategories(new Set(visiblePermissionCategories))
  }

  function collapseAllCategories() {
    setExpandedPermissionCategories(new Set())
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (!selectedProfileId) {
      return
    }

    fetchProfileDetail(selectedProfileId)
  }, [selectedProfileId])

  async function fetchInitialData() {
    try {
      setLoading(true)
      setError(null)
      const [profilesRes, permissionsRes] = await Promise.all([
        fetch('/api/developer/access-profiles'),
        fetch('/api/developer/permissions'),
      ])

      if (!profilesRes.ok) {
        throw new Error('Erro ao carregar perfis.')
      }

      if (!permissionsRes.ok) {
        throw new Error('Erro ao carregar permissoes.')
      }

      const profilesData = await profilesRes.json()
      const permissionsData = await permissionsRes.json()
      const nextProfiles = Array.isArray(profilesData.profiles) ? profilesData.profiles : []
      setProfiles(nextProfiles)
      setPermissionsCatalog(Array.isArray(permissionsData.permissions) ? permissionsData.permissions : [])

      if (nextProfiles.length > 0) {
        setSelectedProfileId(currentId => currentId || nextProfiles[0].id)
      }
    } catch (fetchError) {
      setError(fetchError.message || 'Erro ao carregar perfis.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchProfileDetail(profileId) {
    try {
      setDetailLoading(true)
      setError(null)
      const response = await fetch(`/api/developer/access-profiles/${profileId}`)

      if (!response.ok) {
        throw new Error('Erro ao carregar o perfil selecionado.')
      }

      const data = await response.json()
      setProfileDetail(data.profile || null)
      setDraftPermissionKeys(data.profile?.assignedPermissionKeys || [])
      setMessage(null)
    } catch (fetchError) {
      setError(fetchError.message || 'Erro ao carregar o perfil selecionado.')
    } finally {
      setDetailLoading(false)
    }
  }

  function handleTogglePermission(permissionKey) {
    setDraftPermissionKeys(currentKeys =>
      currentKeys.includes(permissionKey)
        ? currentKeys.filter(key => key !== permissionKey)
        : [...currentKeys, permissionKey],
    )
  }

  async function handleSavePermissions() {
    if (!profileDetail) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      setMessage(null)
      const response = await fetch(`/api/developer/access-profiles/${profileDetail.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissionKeys: draftPermissionKeys,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao guardar permissoes.')
      }

      setProfileDetail(data.profile || null)
      setDraftPermissionKeys(data.profile?.assignedPermissionKeys || [])
      setProfiles(currentProfiles =>
        currentProfiles.map(profile =>
          profile.id === data.profile?.id
            ? {
                ...profile,
                permissionsCount: data.profile.permissionsCount,
              }
            : profile,
        ),
      )
      setMessage(data.message || 'Permissoes atualizadas com sucesso.')
    } catch (saveError) {
      setError(saveError.message || 'Erro ao guardar permissoes.')
    } finally {
      setSaving(false)
    }
  }

  const mergedPermissions = useMemo(() => {
    const detailPermissions = Array.isArray(profileDetail?.permissions) ? profileDetail.permissions : []

    if (detailPermissions.length > 0) {
      return detailPermissions
    }

    return permissionsCatalog.map(permission => ({
      ...permission,
      enabled: draftPermissionKeys.includes(permission.key),
    }))
  }, [draftPermissionKeys, permissionsCatalog, profileDetail])

  const groupedPermissions = useMemo(() => groupPermissions(mergedPermissions), [mergedPermissions])
  const visiblePermissionCategories = useMemo(
    () =>
      Array.from(groupedPermissions.entries())
        .filter(([, permissions]) => filterPermissionsBySearch(permissions, permissionSearchQuery).length > 0)
        .map(([category]) => category),
    [groupedPermissions, permissionSearchQuery],
  )
  const hasVisiblePermissions = visiblePermissionCategories.length > 0
  const shouldLockCriticalDeveloperPermissions =
    profileDetail?.lockoutProtection?.applies &&
    profileDetail?.lockoutProtection?.availableDeveloperCount > 0 &&
    profileDetail?.lockoutProtection?.availableDeveloperCount ===
      profileDetail?.lockoutProtection?.availableDevelopersUsingProfile

  if (loading) {
    return (
      <section style={panelStyle}>
        <h2 style={titleStyle}>Perfis e Permissoes</h2>
        <p style={textStyle}>A carregar perfis tecnicos...</p>
      </section>
    )
  }

  return (
    <section style={panelStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={titleStyle}>Perfis e Permissoes</h2>
          <p style={textStyle}>Perfis fixos da app com permissoes configuraveis por accessProfile.</p>
        </div>
        <button type="button" style={buttonStyle()} onClick={fetchInitialData}>
          Recarregar
        </button>
      </div>

      {error ? <div style={messageStyle('error')}>{error}</div> : null}
      {message ? <div style={messageStyle('success')}>{message}</div> : null}

      <div style={cardGridStyle}>
        {profiles.map(profile => (
          <button
            key={profile.id}
            type="button"
            style={profileCardStyle(profile.id === selectedProfileId)}
            onClick={() => {
              setSelectedProfileId(profile.id)
              setActiveTab('permissions')
            }}
          >
            <p style={profileNameStyle}>{profile.name}</p>
            <p style={{ ...textStyle, margin: 0, fontSize: '13px' }}>{profile.description}</p>
            <div style={statRowStyle}>
              <div style={statBoxStyle}>
                <p style={statLabelStyle}>Permissoes</p>
                <p style={statValueStyle}>{profile.permissionsCount}</p>
              </div>
              <div style={statBoxStyle}>
                <p style={statLabelStyle}>Utilizadores</p>
                <p style={statValueStyle}>{profile.usersCount}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedProfileId ? (
        <div style={detailShellStyle}>
          {detailLoading ? (
            <p style={{ ...textStyle, margin: 0 }}>A carregar detalhe do perfil...</p>
          ) : profileDetail ? (
            <>
              <div style={detailHeaderStyle}>
                <div>
                  <h3 style={{ ...titleStyle, fontSize: '22px' }}>{profileDetail.name}</h3>
                  <p style={{ ...textStyle, marginTop: '8px' }}>{profileDetail.description}</p>
                </div>
                <div style={statRowStyle}>
                  <div style={statBoxStyle}>
                    <p style={statLabelStyle}>Permissoes</p>
                    <p style={statValueStyle}>{draftPermissionKeys.length}</p>
                  </div>
                  <div style={statBoxStyle}>
                    <p style={statLabelStyle}>Utilizadores</p>
                    <p style={statValueStyle}>{profileDetail.usersCount}</p>
                  </div>
                </div>
              </div>

              <div style={tabsStyle}>
                <button
                  type="button"
                  style={tabButtonStyle(activeTab === 'permissions')}
                  onClick={() => setActiveTab('permissions')}
                >
                  Permissoes
                </button>
                <button
                  type="button"
                  style={tabButtonStyle(activeTab === 'users')}
                  onClick={() => setActiveTab('users')}
                >
                  Utilizadores
                </button>
              </div>

              {activeTab === 'permissions' ? (
                <div style={permissionListStyle}>
                  {profileDetail.lockoutProtection?.applies ? (
                    <article style={warningBoxStyle}>
                      <strong>{profileDetail.lockoutProtection.message}</strong>
                      <span>
                        Este perfil sustenta acesso tecnico. As permissoes criticas ficam protegidas quando todos
                        os developers disponiveis dependem deste profile.
                      </span>
                    </article>
                  ) : null}

                  <div style={searchToolbarStyle}>
                    <input
                      type="search"
                      placeholder="Pesquisar permissoes..."
                      value={permissionSearchQuery}
                      onChange={e => setPermissionSearchQuery(e.target.value)}
                      style={searchInputStyle}
                    />
                    <div style={searchToolbarActionsStyle}>
                      <button
                        type="button"
                        style={buttonStyle()}
                        onClick={expandAllVisibleCategories}
                        disabled={!hasVisiblePermissions}
                      >
                        Expandir tudo
                      </button>
                      <button
                        type="button"
                        style={buttonStyle()}
                        onClick={collapseAllCategories}
                        disabled={expandedPermissionCategories.size === 0}
                      >
                        Recolher tudo
                      </button>
                    </div>
                  </div>

                  {!hasVisiblePermissions ? (
                    <article style={emptyStateStyle}>
                      Nenhuma permissao corresponde a esta pesquisa.
                    </article>
                  ) : null}

                  {Array.from(groupedPermissions.entries()).map(([category, allCategoryPermissions]) => {
                    const filteredPermissions = filterPermissionsBySearch(allCategoryPermissions, permissionSearchQuery)
                    const isExpanded = expandedPermissionCategories.has(category)
                    const criticalCount = filteredPermissions.filter(
                      p => profileDetail.lockoutProtection?.criticalPermissionKeys?.includes(p.key),
                    ).length

                    if (filteredPermissions.length === 0 && permissionSearchQuery.trim()) {
                      return null
                    }

                    return (
                      <div key={category} style={{ display: 'grid', gap: '8px' }}>
                        <button
                          type="button"
                          style={{
                            ...expandCollapseButtonStyle,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 0',
                          }}
                          onClick={() => toggleCategoryExpansion(category)}
                        >
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span>{isExpanded ? '▼' : '▶'}</span>
                            <span style={{ textTransform: 'capitalize', fontWeight: 900 }}>{category}</span>
                            <span style={categoryCounterStyle}>{filteredPermissions.length}</span>
                            {criticalCount > 0 ? (
                              <span style={criticalIndicatorStyle}>⚠ {criticalCount} crítica(s)</span>
                            ) : null}
                          </div>
                        </button>

                        {isExpanded ? (
                          <div style={{ display: 'grid', gap: '8px', paddingLeft: '8px' }}>
                            {filteredPermissions.map(permission => {
                              const isCriticalDeveloperPermission =
                                profileDetail.lockoutProtection?.criticalPermissionKeys?.includes(permission.key) ===
                                true
                              const disableToggle =
                                saving ||
                                (shouldLockCriticalDeveloperPermissions &&
                                  isCriticalDeveloperPermission &&
                                  draftPermissionKeys.includes(permission.key))

                              return (
                                <label key={permission.key} style={permissionRowStyle(isCriticalDeveloperPermission)}>
                                  <div style={permissionTextWrapStyle}>
                                    <p style={permissionNameStyle}>{permission.key}</p>
                                    <p style={permissionMetaStyle}>
                                      {permission.name}
                                      {permission.description ? ` · ${permission.description}` : ''}
                                    </p>
                                    {isCriticalDeveloperPermission ? (
                                      <p style={{ ...permissionMetaStyle, color: '#c2410c' }}>
                                        Permissao critica do developer
                                      </p>
                                    ) : null}
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={draftPermissionKeys.includes(permission.key)}
                                    onChange={() => handleTogglePermission(permission.key)}
                                    style={checkboxStyle}
                                    disabled={disableToggle}
                                  />
                                </label>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button type="button" style={buttonStyle('primary')} onClick={handleSavePermissions} disabled={saving}>
                      {saving ? 'A guardar...' : 'Guardar alteracoes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={userListStyle}>
                  {profileDetail.users.length === 0 ? (
                    <p style={{ ...textStyle, margin: 0 }}>Sem utilizadores associados a este perfil.</p>
                  ) : (
                    profileDetail.users.map(user => (
                      <article key={user.id} style={userRowStyle}>
                        <div>
                          <p style={userNameStyle}>{user.name}</p>
                          <p style={userMetaStyle}>{user.username}</p>
                        </div>
                        <div>
                          <p style={userNameStyle}>{user.roleLabel}</p>
                          <p style={userMetaStyle}>{user.accountTypeLabel}</p>
                        </div>
                        <span style={statusBadgeStyle(user.statusKey)}>{user.statusLabel}</span>
                      </article>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <p style={{ ...textStyle, margin: 0 }}>Nao foi possivel carregar o perfil selecionado.</p>
          )}
        </div>
      ) : null}
    </section>
  )
}

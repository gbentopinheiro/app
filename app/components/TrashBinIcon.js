export const trashBinButtonStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '999px',
  border: '1.5px solid #dc2626',
  background: 'linear-gradient(145deg, #fff7f7 0%, #ffe4e6 100%)',
  color: '#dc2626',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  textDecoration: 'none',
  cursor: 'pointer',
  boxShadow: '0 12px 26px rgba(220, 38, 38, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.92)',
}

export default function TrashBinIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.75 7.25h14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9.25 4.75h5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7.4 7.25l.7 10.15a1.8 1.8 0 0 0 1.8 1.67h4.2a1.8 1.8 0 0 0 1.8-1.67l.7-10.15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 10.4v5.55" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M14 10.4v5.55" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

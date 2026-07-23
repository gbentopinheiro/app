export const editPencilButtonStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '999px',
  border: '1.5px solid #ff8a00',
  background: 'linear-gradient(145deg, #fffaf3 0%, #fff1df 100%)',
  color: '#ff7a00',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  textDecoration: 'none',
  cursor: 'pointer',
  boxShadow: '0 12px 26px rgba(255, 122, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
}

export default function EditPencilIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6.15 17.85l1.12-4.04 8.93-8.93a2.02 2.02 0 0 1 2.86 2.86l-8.93 8.93-3.98 1.18Z" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.65 6.45l2.9 2.9" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.27 13.81l2.86 2.86" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" opacity="0.72" />
      <path d="M13.35 19.05h4.9" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
    </svg>
  )
}

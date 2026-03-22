import Link from 'next/link'

const pageStyle = {
  minHeight: '100vh',
  padding: '40px 24px',
  background: 'linear-gradient(180deg, #f3ede0 0%, #dce8df 100%)',
  color: '#1d2a24',
  fontFamily: 'Georgia, serif',
}

const containerStyle = {
  maxWidth: '1120px',
  margin: '0 auto',
  display: 'grid',
  gap: '24px',
}

const cardsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '18px',
}

const cardStyle = {
  display: 'grid',
  gap: '12px',
  padding: '24px',
  borderRadius: '22px',
  background: 'rgba(255, 251, 245, 0.88)',
  border: '1px solid #d6d3ca',
  boxShadow: '0 18px 44px rgba(49, 65, 57, 0.10)',
  textDecoration: 'none',
  color: 'inherit',
}

export default function Home() {
  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={{ maxWidth: '760px' }}>
          <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: '#5f6f66' }}>
            Vila Plano
          </p>
          <h1 style={{ margin: '10px 0 14px', fontSize: '48px', lineHeight: 1.05 }}>
            Centro de gestao operacional
          </h1>
          <p style={{ margin: 0, color: '#4d5c55', fontSize: '18px', lineHeight: 1.6 }}>
            Escolhe a area onde queres trabalhar. A landing page da aplicacao da agora acesso direto a obras, pessoas e
            plano diario.
          </p>
        </section>

        <section style={cardsStyle}>
          <Link href="/works" style={cardStyle}>
            <p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5f6f66' }}>
              Opcao 1
            </p>
            <h2 style={{ margin: 0, fontSize: '28px' }}>Gestao de obra</h2>
            <p style={{ margin: 0, color: '#506059' }}>
              Consulta as obras existentes e os valores por defeito por hora definidos para cada obra.
            </p>
          </Link>

          <Link href="/people" style={cardStyle}>
            <p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5f6f66' }}>
              Opcao 2
            </p>
            <h2 style={{ margin: 0, fontSize: '28px' }}>Gestao de pessoas</h2>
            <p style={{ margin: 0, color: '#506059' }}>
              Ve a lista de pessoas carregadas, com os respetivos precos e dados disponiveis na API.
            </p>
          </Link>

          <Link href="/daily-plan" style={cardStyle}>
            <p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5f6f66' }}>
              Opcao 3
            </p>
            <h2 style={{ margin: 0, fontSize: '28px' }}>Plano diario</h2>
            <p style={{ margin: 0, color: '#506059' }}>
              Entra na area de planeamento diario para organizar as prioridades operacionais do dia.
            </p>
          </Link>
        </section>
      </div>
    </main>
  )
}

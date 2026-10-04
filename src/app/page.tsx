export default function Home() {
  return (
    <main
      style={{
        display: 'flex',
        minHeight: '100dvh',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        textAlign: 'center',
      }}
    >
      <h1 style={{ margin: 0 }}>Cadence</h1>
      <p style={{ margin: 0 }}>Foundation ready. Features land next.</p>
    </main>
  );
}

import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '32px',
          fontFamily: 'var(--font, sans-serif)',
          color: 'var(--dark, #1a1a2e)',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Algo salió mal</h1>
          <p style={{ fontSize: '14px', color: 'var(--mid, #666)', margin: 0, maxWidth: '400px' }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              background: 'var(--primary, #7c6fcd)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

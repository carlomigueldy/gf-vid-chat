import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConnectionQuality } from './connection-quality'

describe('ConnectionQuality', () => {
  it('renders a labelled status for a good connection', () => {
    render(<ConnectionQuality info={{ quality: 'good', isRelayed: false, rttMs: 80 }} />)
    expect(screen.getByRole('status', { name: /connection quality: good/i })).toBeInTheDocument()
  })

  it('announces relay and shows a Relay chip when relayed', () => {
    render(<ConnectionQuality info={{ quality: 'poor', isRelayed: true, rttMs: 600 }} />)
    expect(screen.getByRole('status', { name: /connection quality: poor, relayed/i })).toBeInTheDocument()
    expect(screen.getByText('Relay')).toBeInTheDocument()
  })

  it('renders nothing when quality is unknown', () => {
    const { container } = render(<ConnectionQuality info={{ quality: 'unknown', isRelayed: false, rttMs: null }} />)
    expect(container).toBeEmptyDOMElement()
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VideoGrid } from './video-grid'

function fakeStream() {
  return {} as unknown as MediaStream
}

describe('VideoGrid', () => {
  beforeEach(() => localStorage.clear())

  it('shows the waiting state with the QR code while waiting', () => {
    render(
      <VideoGrid localStream={null} remoteStream={null} roomUrl="https://x/room/abc" connectionState="waiting" />
    )
    expect(screen.getByRole('figure', { name: /QR code to join room/i })).toBeInTheDocument()
    expect(screen.getByText(/waiting for your partner/i)).toBeInTheDocument()
  })

  it('renders a PiP swap control when connected and swaps on click', () => {
    render(
      <VideoGrid
        localStream={fakeStream()}
        remoteStream={fakeStream()}
        roomUrl="https://x/room/abc"
        connectionState="connected"
      />
    )
    const swap = screen.getByRole('button', { name: /show your video full screen/i })
    expect(swap).toBeInTheDocument()
    fireEvent.click(swap)
    expect(screen.getByRole('button', { name: /show partner video full screen/i })).toBeInTheDocument()
  })
})

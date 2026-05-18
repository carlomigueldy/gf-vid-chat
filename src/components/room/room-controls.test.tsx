import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RoomControls } from './room-controls'

const defaultProps = {
  isMicOn: true,
  isCameraOn: true,
  onToggleMic: vi.fn(),
  onToggleCamera: vi.fn(),
  onHangUp: vi.fn(),
  onToggleFullscreen: vi.fn(),
  isFullscreen: false,
}

describe('RoomControls', () => {
  it('renders toolbar with all control buttons', () => {
    render(<RoomControls {...defaultProps} />)
    const toolbar = screen.getByRole('toolbar', { name: 'Call controls' })
    expect(toolbar).toBeInTheDocument()
  })

  it('renders mic button with correct label when on', () => {
    render(<RoomControls {...defaultProps} isMicOn={true} />)
    expect(screen.getByRole('button', { name: 'Mute microphone' })).toBeInTheDocument()
  })

  it('renders mic button with correct label when off', () => {
    render(<RoomControls {...defaultProps} isMicOn={false} />)
    expect(screen.getByRole('button', { name: 'Unmute microphone' })).toBeInTheDocument()
  })

  it('renders camera button with correct label when on', () => {
    render(<RoomControls {...defaultProps} isCameraOn={true} />)
    expect(screen.getByRole('button', { name: 'Turn off camera' })).toBeInTheDocument()
  })

  it('renders camera button with correct label when off', () => {
    render(<RoomControls {...defaultProps} isCameraOn={false} />)
    expect(screen.getByRole('button', { name: 'Turn on camera' })).toBeInTheDocument()
  })

  it('renders fullscreen button', () => {
    render(<RoomControls {...defaultProps} isFullscreen={false} />)
    expect(screen.getByRole('button', { name: 'Enter fullscreen' })).toBeInTheDocument()
  })

  it('renders exit fullscreen button when fullscreen', () => {
    render(<RoomControls {...defaultProps} isFullscreen={true} />)
    expect(screen.getByRole('button', { name: 'Exit fullscreen' })).toBeInTheDocument()
  })

  it('renders hang up button', () => {
    render(<RoomControls {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'End call' })).toBeInTheDocument()
  })

  it('calls onToggleMic when mic button clicked', () => {
    const onToggleMic = vi.fn()
    render(<RoomControls {...defaultProps} onToggleMic={onToggleMic} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mute microphone' }))
    expect(onToggleMic).toHaveBeenCalledOnce()
  })

  it('calls onToggleCamera when camera button clicked', () => {
    const onToggleCamera = vi.fn()
    render(<RoomControls {...defaultProps} onToggleCamera={onToggleCamera} />)
    fireEvent.click(screen.getByRole('button', { name: 'Turn off camera' }))
    expect(onToggleCamera).toHaveBeenCalledOnce()
  })

  it('calls onHangUp when end call button clicked', () => {
    const onHangUp = vi.fn()
    render(<RoomControls {...defaultProps} onHangUp={onHangUp} />)
    fireEvent.click(screen.getByRole('button', { name: 'End call' }))
    expect(onHangUp).toHaveBeenCalledOnce()
  })

  it('calls onToggleFullscreen when fullscreen button clicked', () => {
    const onToggleFullscreen = vi.fn()
    render(<RoomControls {...defaultProps} onToggleFullscreen={onToggleFullscreen} />)
    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }))
    expect(onToggleFullscreen).toHaveBeenCalledOnce()
  })

  it('mic off button has red styling classes', () => {
    render(<RoomControls {...defaultProps} isMicOn={false} />)
    const micBtn = screen.getByRole('button', { name: 'Unmute microphone' })
    expect(micBtn.className).toContain('red')
  })
})

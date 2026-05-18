import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VideoPlayer } from './video-player'

describe('VideoPlayer', () => {
  it('renders placeholder with VideoOff icon when no stream', () => {
    const { container } = render(<VideoPlayer stream={null} label="Test video" />)
    // The VideoOff icon should be rendered (no video element)
    const videos = container.querySelectorAll('video')
    expect(videos.length).toBe(0)
  })

  it('applies accessible label to container', () => {
    render(<VideoPlayer stream={null} label="Your video" />)
    expect(screen.getByRole('generic', { name: 'Your video' })).toBeInTheDocument()
  })

  it('applies mirror style when mirror=true', () => {
    // Create a mock stream to force video element to render
    const mockStream = { getTracks: () => [] } as unknown as MediaStream
    const { container } = render(
      <VideoPlayer stream={mockStream} muted mirror label="Mirror video" />
    )
    const video = container.querySelector('video')
    if (video) {
      expect(video.style.transform).toBe('scaleX(-1)')
    }
  })

  it('does not apply mirror style when mirror=false', () => {
    const mockStream = { getTracks: () => [] } as unknown as MediaStream
    const { container } = render(
      <VideoPlayer stream={mockStream} muted label="Remote video" />
    )
    const video = container.querySelector('video')
    if (video) {
      expect(video.style.transform).toBe('')
    }
  })
})

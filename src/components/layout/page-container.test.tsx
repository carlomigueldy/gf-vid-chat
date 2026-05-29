import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageContainer } from './page-container'

describe('PageContainer', () => {
  it('renders children', () => {
    render(
      <PageContainer>
        <p>Test content</p>
      </PageContainer>
    )
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('applies max-w-2xl and responsive padding classes', () => {
    const { container } = render(
      <PageContainer>
        <span>child</span>
      </PageContainer>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('max-w-2xl')
    expect(wrapper.className).toContain('mx-auto')
  })

  it('merges additional className', () => {
    const { container } = render(
      <PageContainer className="extra-class">
        <span>child</span>
      </PageContainer>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('extra-class')
  })

  it('allows max-w override via className', () => {
    const { container } = render(
      <PageContainer className="max-w-md">
        <span />
      </PageContainer>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('max-w-md')
    expect(wrapper.className).not.toContain('max-w-2xl')
  })
})

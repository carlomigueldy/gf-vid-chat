import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { SegmentedControl, type SegmentedOption } from './segmented-control'

type V = 'a' | 'b' | 'c'
const OPTIONS: SegmentedOption<V>[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie' },
]

function setup(value: V = 'a') {
  const onChange = vi.fn()
  render(
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onChange={onChange}
      ariaLabel="Test group"
      layoutId="test-thumb"
    />
  )
  return { onChange }
}

describe('SegmentedControl', () => {
  it('renders a radiogroup with one radio per option', () => {
    setup()
    const group = screen.getByRole('radiogroup', { name: 'Test group' })
    expect(within(group).getAllByRole('radio')).toHaveLength(3)
  })

  it('marks the selected option with aria-checked', () => {
    setup('b')
    expect(screen.getByRole('radio', { name: 'Bravo' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Alpha' })).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onChange when a radio is clicked', () => {
    const { onChange } = setup('a')
    fireEvent.click(screen.getByRole('radio', { name: 'Charlie' }))
    expect(onChange).toHaveBeenCalledWith('c')
  })

  it('moves selection with ArrowRight / ArrowLeft', () => {
    const { onChange } = setup('a')
    const selected = screen.getByRole('radio', { name: 'Alpha' })
    fireEvent.keyDown(selected, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('b')
    fireEvent.keyDown(selected, { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenCalledWith('c') // wraps to last
  })
})

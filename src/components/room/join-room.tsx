import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanLine, Upload, Link } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/segmented-control'
import { QrScanner } from '@/components/qr/qr-scanner'
import { QrUpload } from '@/components/qr/qr-upload'

type Method = 'scan' | 'upload' | 'paste'

const METHODS: SegmentedOption<Method>[] = [
  { value: 'scan', label: 'Scan', Icon: ScanLine },
  { value: 'upload', label: 'Upload', Icon: Upload },
  { value: 'paste', label: 'Paste', Icon: Link },
]

function extractRoomId(input: string): string | null {
  input = input.trim()
  try {
    const url = new URL(input)
    const match = url.pathname.match(/\/room\/([^/?]+)/)
    if (match) return match[1]
  } catch {
    // not a URL — treat as raw room ID
  }
  if (/^[a-zA-Z0-9_-]{4,30}$/.test(input)) return input
  return null
}

export function JoinRoom() {
  const [method, setMethod] = useState<Method>('scan')
  const [pasteValue, setPasteValue] = useState('')
  const [pasteError, setPasteError] = useState('')
  const navigate = useNavigate()

  function handleJoin(url: string) {
    const roomId = extractRoomId(url)
    if (roomId) navigate(`/room/${roomId}?role=joiner`)
  }

  function handlePasteJoin() {
    setPasteError('')
    const roomId = extractRoomId(pasteValue)
    if (roomId) {
      navigate(`/room/${roomId}?role=joiner`)
    } else {
      setPasteError('Please enter a valid room link or room ID.')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handlePasteJoin()
  }

  return (
    <Card className="p-6 space-y-4">
      <SegmentedControl
        options={METHODS}
        value={method}
        onChange={setMethod}
        ariaLabel="Join method"
        layoutId="join-method-thumb"
        size="sm"
      />

      <div>
        {method === 'scan' && <QrScanner onResult={handleJoin} />}
        {method === 'upload' && <QrUpload onResult={handleJoin} />}
        {method === 'paste' && (
          <div className="flex flex-col gap-3 pt-1">
            <div>
              <input
                type="text"
                value={pasteValue}
                onChange={(e) => {
                  setPasteValue(e.target.value)
                  setPasteError('')
                }}
                onKeyDown={handleKeyDown}
                placeholder="Paste room link or ID…"
                aria-label="Room link or ID"
                aria-describedby={pasteError ? 'paste-error' : undefined}
                aria-invalid={pasteError ? true : undefined}
                className="w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--background)] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-shadow"
              />
              {pasteError && (
                <p id="paste-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1.5">
                  {pasteError}
                </p>
              )}
            </div>
            <Button onClick={handlePasteJoin} className="w-full" disabled={!pasteValue.trim()}>
              Join Room
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanLine, Upload, Link } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QrScanner } from '@/components/qr/qr-scanner'
import { QrUpload } from '@/components/qr/qr-upload'
import { cn } from '@/lib/utils'

type TabId = 'scan' | 'upload' | 'paste'

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'scan',   label: 'Scan QR',   Icon: ScanLine },
  { id: 'upload', label: 'Upload QR', Icon: Upload },
  { id: 'paste',  label: 'Paste',     Icon: Link },
]

function extractRoomId(input: string): string | null {
  input = input.trim()
  // Full URL: https://example.com/room/abc123?role=...
  try {
    const url = new URL(input)
    const match = url.pathname.match(/\/room\/([^/?]+)/)
    if (match) return match[1]
  } catch {
    // not a URL — treat as raw room ID
  }
  // Raw room ID (alphanumeric, 6-20 chars)
  if (/^[a-zA-Z0-9_-]{4,30}$/.test(input)) return input
  return null
}

export function JoinRoom() {
  const [activeTab, setActiveTab] = useState<TabId>('scan')
  const [pasteValue, setPasteValue] = useState('')
  const [pasteError, setPasteError] = useState('')
  const navigate = useNavigate()

  function handleJoin(url: string) {
    const roomId = extractRoomId(url)
    if (roomId) {
      navigate(`/room/${roomId}?role=joiner`)
    }
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

  function handleTabKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === 'ArrowRight') {
      const next = TABS[(index + 1) % TABS.length]
      setActiveTab(next.id)
    } else if (e.key === 'ArrowLeft') {
      const prev = TABS[(index - 1 + TABS.length) % TABS.length]
      setActiveTab(prev.id)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl">Join a Room</CardTitle>
        <CardDescription>
          Scan, upload, or paste a room link to connect
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div
          role="tablist"
          aria-label="Join method"
          className="grid grid-cols-3 bg-[var(--muted)] rounded-lg p-1 gap-1 mb-4"
        >
          {TABS.map(({ id, label, Icon }, index) => (
            <button
              key={id}
              id={`tab-${id}`}
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`tabpanel-${id}`}
              tabIndex={activeTab === id ? 0 : -1}
              onClick={() => setActiveTab(id)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1',
                activeTab === id
                  ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {TABS.map(({ id }) => (
          <div
            key={id}
            id={`tabpanel-${id}`}
            role="tabpanel"
            aria-labelledby={`tab-${id}`}
            hidden={activeTab !== id}
          >
            {id === 'scan' && activeTab === 'scan' && (
              <QrScanner onResult={handleJoin} />
            )}
            {id === 'upload' && (
              <QrUpload onResult={handleJoin} />
            )}
            {id === 'paste' && (
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
                    className="border border-[var(--input)] bg-[var(--background)] rounded-[var(--radius)] px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-shadow"
                  />
                  {pasteError && (
                    <p
                      id="paste-error"
                      role="alert"
                      className="text-xs text-red-600 dark:text-red-400 mt-1.5"
                    >
                      {pasteError}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handlePasteJoin}
                  className="w-full"
                  disabled={!pasteValue.trim()}
                >
                  Join Room
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

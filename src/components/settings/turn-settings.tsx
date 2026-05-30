import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePreferences } from '@/hooks/use-preferences'

function isValidTurnUrl(url: string): boolean {
  return /^turns?:/i.test(url.trim())
}

const inputClass =
  'w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--background)] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-shadow'

export function TurnSettings() {
  const { turnServer, setTurnServer } = usePreferences()
  const [urls, setUrls] = useState(turnServer?.urls ?? '')
  const [username, setUsername] = useState(turnServer?.username ?? '')
  const [credential, setCredential] = useState(turnServer?.credential ?? '')
  const [error, setError] = useState('')

  const configured = turnServer !== null

  function handleSave() {
    if (!isValidTurnUrl(urls)) {
      setError('Enter a valid TURN URL starting with turn: or turns:')
      return
    }
    setError('')
    setTurnServer({
      urls: urls.trim(),
      username: username.trim() || undefined,
      credential: credential.trim() || undefined,
    })
  }

  function handleRemove() {
    setTurnServer(null)
    setUrls('')
    setUsername('')
    setCredential('')
    setError('')
  }

  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Connectivity</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          If a call won't connect on a strict network, add a TURN relay server to fall back to.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="turn-url" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
            TURN URL
          </label>
          <input
            id="turn-url"
            type="text"
            value={urls}
            onChange={(e) => {
              setUrls(e.target.value)
              setError('')
            }}
            placeholder="turn:turn.example.com:3478"
            aria-label="TURN URL"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'turn-error' : undefined}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="turn-username" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
            Username
          </label>
          <input
            id="turn-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="optional"
            aria-label="TURN username"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="turn-credential" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
            Password
          </label>
          <input
            id="turn-credential"
            type="password"
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            placeholder="optional"
            aria-label="TURN password"
            className={inputClass}
          />
        </div>
        {error && (
          <p id="turn-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave}>Save relay</Button>
        {configured && (
          <Button variant="ghost" onClick={handleRemove}>
            Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-[var(--muted-foreground)]">
        {configured ? 'Relay configured — calls can fall back to it.' : 'No relay — using STUN only.'}
      </p>
    </Card>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { Html5Qrcode } from 'html5-qrcode'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QrScannerProps {
  onResult: (url: string) => void
  onError?: (error: string) => void
}

type ScannerState = 'loading' | 'scanning' | 'error'

export function QrScanner({ onResult, onError }: QrScannerProps) {
  const [state, setState] = useState<ScannerState>('loading')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerId = 'qr-scanner-container'
  const liveRegionRef = useRef<HTMLDivElement>(null)

  function announceSuccess(url: string) {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = `QR code detected: ${url}`
    }
  }

  async function startScanner() {
    setState('loading')
    setErrorMsg('')
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode(containerId)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          announceSuccess(decodedText)
          stopScanner()
          onResult(decodedText)
        },
        () => {
          // scan error — ignore, keep scanning
        }
      )
      setState('scanning')
    } catch {
      const msg = 'Camera access denied'
      setState('error')
      setErrorMsg(msg)
      onError?.(msg)
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch {
        // already stopped
      }
      scannerRef.current = null
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void startScanner()
    })
    return () => {
      void stopScanner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div role="region" aria-label="QR code camera scanner" className="flex flex-col items-center gap-3">
      <div className="relative aspect-square w-full max-w-64 overflow-hidden rounded-3xl bg-[var(--muted)] shadow-warm-md">
        {state === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-8 text-[var(--muted-foreground)] animate-spin" />
          </div>
        )}
        <div id={containerId} className="h-full w-full" aria-label="Camera viewfinder" />

        {state === 'scanning' && (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute top-3 left-3 size-7 rounded-tl-lg border-l-[3px] border-t-[3px] border-[var(--primary)]" />
            <div aria-hidden="true" className="pointer-events-none absolute top-3 right-3 size-7 rounded-tr-lg border-r-[3px] border-t-[3px] border-[var(--primary)]" />
            <div aria-hidden="true" className="pointer-events-none absolute bottom-3 left-3 size-7 rounded-bl-lg border-b-[3px] border-l-[3px] border-[var(--primary)]" />
            <div aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 size-7 rounded-br-lg border-b-[3px] border-r-[3px] border-[var(--primary)]" />
            <div aria-hidden="true" className="animate-scanline pointer-events-none absolute left-4 right-4 h-0.5 rounded-full bg-[var(--primary)]/70 shadow-[0_0_8px_var(--glow-primary)]" />
          </>
        )}
      </div>

      {state === 'error' && (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {errorMsg}
          </p>
          <Button variant="ghost" size="sm" onClick={startScanner}>
            Retry
          </Button>
        </div>
      )}

      {state === 'scanning' && (
        <p className="mt-1 text-sm text-[var(--muted-foreground)] text-center">Point camera at QR code</p>
      )}

      <div ref={liveRegionRef} aria-live="polite" aria-atomic="true" className="sr-only" />
    </div>
  )
}

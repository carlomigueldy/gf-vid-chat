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
    <div
      role="region"
      aria-label="QR code camera scanner"
      className="flex flex-col items-center gap-3"
    >
      <div className="relative aspect-square max-w-64 w-full rounded-xl overflow-hidden bg-[var(--muted)]">
        {state === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-8 text-[var(--muted-foreground)] animate-spin" />
          </div>
        )}
        <div id={containerId} className="w-full h-full" aria-label="Camera viewfinder" />

        {state === 'scanning' && (
          <>
            <div className="absolute top-2 left-2 size-6 border-t-2 border-l-2 border-[var(--primary)] rounded-tl" />
            <div className="absolute top-2 right-2 size-6 border-t-2 border-r-2 border-[var(--primary)] rounded-tr" />
            <div className="absolute bottom-2 left-2 size-6 border-b-2 border-l-2 border-[var(--primary)] rounded-bl" />
            <div className="absolute bottom-2 right-2 size-6 border-b-2 border-r-2 border-[var(--primary)] rounded-br" />
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
        <p className="text-sm text-[var(--muted-foreground)] text-center mt-2">
          Point camera at QR code
        </p>
      )}

      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </div>
  )
}

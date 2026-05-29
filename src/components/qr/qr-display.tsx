import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { qrReveal } from '@/lib/animations'

interface QrDisplayProps {
  url: string
  size?: number
}

// Small rose heart, inlined as a data URI for the QR center mark.
const HEART_MARK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23e0457b'%3E%3Cpath d='M12 21s-8-4.6-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 11c0 5.4-8 10-8 10z'/%3E%3C/svg%3E"

export function QrDisplay({ url, size = 220 }: QrDisplayProps) {
  const [copied, setCopied] = useState(false)
  const truncatedUrl = url.length > 40 ? `${url.slice(0, 40)}…` : url

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard access denied — silently fail
    }
  }

  return (
    <figure aria-label="QR code to join room" className="flex flex-col items-center gap-3 p-6">
      <motion.div
        variants={qrReveal}
        initial="initial"
        animate="animate"
        className="rounded-3xl bg-white p-4 shadow-glow"
      >
        <QRCodeSVG
          value={url}
          size={size}
          level="H"
          imageSettings={{ src: HEART_MARK, height: 34, width: 34, excavate: true }}
        />
      </motion.div>

      <figcaption className="sr-only">Scan to join or share the link below</figcaption>

      <p className="font-display text-sm font-semibold text-[var(--foreground)]">Scan to join</p>

      <p className="max-w-[260px] break-all text-center font-mono text-xs text-[var(--muted-foreground)]">
        {truncatedUrl}
      </p>

      <Button variant="ghost" size="sm" onClick={handleCopy} aria-label="Copy join link" className="gap-1.5">
        {copied ? (
          <>
            <Check className="size-3" /> Copied!
          </>
        ) : (
          <>
            <Copy className="size-3" /> Copy link
          </>
        )}
      </Button>
    </figure>
  )
}

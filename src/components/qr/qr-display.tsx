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
    <figure
      aria-label="QR code to join room"
      className="flex flex-col items-center gap-3 p-6"
    >
      <motion.div
        variants={qrReveal}
        initial="initial"
        animate="animate"
        className="bg-white p-3 rounded-xl shadow-sm"
      >
        <QRCodeSVG value={url} size={size} />
      </motion.div>

      <figcaption className="sr-only">
        Scan to join or share the link below
      </figcaption>

      <p className="text-sm font-medium text-[var(--muted-foreground)]">
        Scan to join
      </p>

      <p className="text-xs font-mono text-[var(--muted-foreground)] break-all text-center max-w-[260px]">
        {truncatedUrl}
      </p>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        aria-label="Copy join link"
        className="gap-1.5"
      >
        {copied ? (
          <>
            <Check className="size-3" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="size-3" />
            Copy link
          </>
        )}
      </Button>
    </figure>
  )
}

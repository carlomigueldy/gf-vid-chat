import { useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QrUploadProps {
  onResult: (url: string) => void
}

type UploadState = 'idle' | 'dragging' | 'processing' | 'success' | 'error'

export function QrUpload({ onResult }: QrUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [decodedUrl, setDecodedUrl] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  function announce(msg: string) {
    if (statusRef.current) {
      statusRef.current.textContent = msg
    }
  }

  async function decodeFile(file: File) {
    setUploadState('processing')
    announce('Decoding QR code…')

    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        setUploadState('error')
        announce('Failed to process image.')
        URL.revokeObjectURL(url)
        return
      }
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const result = jsQR(imageData.data, imageData.width, imageData.height)
      URL.revokeObjectURL(url)

      if (result) {
        setDecodedUrl(result.data)
        setUploadState('success')
        announce(`QR code detected: ${result.data}`)
        onResult(result.data)
      } else {
        setUploadState('error')
        announce('No QR code detected in this image.')
      }
    }

    img.onerror = () => {
      setUploadState('error')
      announce('Failed to load image.')
      URL.revokeObjectURL(url)
    }

    img.src = url
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) return
    decodeFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setUploadState('dragging')
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setUploadState('idle')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setUploadState('idle')
    handleFiles(e.dataTransfer.files)
  }

  function handleReset() {
    setUploadState('idle')
    setDecodedUrl('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const isDragging = uploadState === 'dragging'
  const truncated = decodedUrl.length > 40 ? `${decodedUrl.slice(0, 40)}…` : decodedUrl

  return (
    <div
      role="region"
      aria-label="Upload QR code image"
      className="flex flex-col gap-3"
    >
      <label
        className={cn(
          'block cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition-colors duration-150',
          isDragging
            ? 'border-[var(--primary)] bg-[var(--accent)] shadow-glow'
            : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--accent)]'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleChange}
          tabIndex={-1}
          aria-hidden="true"
        />

        {uploadState === 'idle' || uploadState === 'dragging' ? (
          <>
            <Upload className="size-8 text-[var(--muted-foreground)] mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--foreground)]">
              Drop screenshot here
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              or click to select a file
            </p>
          </>
        ) : uploadState === 'processing' ? (
          <div className="flex flex-col items-center gap-2">
            <div
              role="status"
              aria-label="Processing image"
              className="size-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"
            />
            <p className="text-sm text-[var(--muted-foreground)]">
              Decoding QR code…
            </p>
          </div>
        ) : uploadState === 'success' ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              QR code detected
            </p>
            <p className="text-xs font-mono text-[var(--muted-foreground)]">
              {truncated}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="size-8 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              No QR code detected in this image
            </p>
          </div>
        )}
      </label>

      {uploadState === 'error' && (
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-[var(--primary)] underline underline-offset-4 text-center hover:opacity-80 transition-opacity"
        >
          Try a different image
        </button>
      )}

      <div
        ref={statusRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </div>
  )
}

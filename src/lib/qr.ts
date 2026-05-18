import { validateRoomId } from '@/lib/room-id'
import jsQR from 'jsqr'

export function encodeRoomUrl(roomId: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  return `${base}/room/${roomId}?role=joiner`
}

export function decodeRoomUrl(url: string): string | null {
  try {
    let pathname: string
    try {
      const parsed = new URL(url)
      pathname = parsed.pathname
    } catch {
      pathname = url
    }

    const match = pathname.match(/\/room\/([^/?#]+)/)
    if (match) {
      const roomId = match[1]
      return validateRoomId(roomId) ? roomId : null
    }

    const trimmed = url.trim()
    return validateRoomId(trimmed) ? trimmed : null
  } catch {
    return null
  }
}

export async function decodeQrFromImage(file: File): Promise<string | null> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = new Image()

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = objectUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    const result = jsQR(imageData.data, canvas.width, canvas.height)
    if (!result) return null

    return decodeRoomUrl(result.data)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

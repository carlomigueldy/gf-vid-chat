import { useParams } from 'react-router-dom'

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">Room</h1>
      <p className="text-[var(--muted-foreground)] font-mono">{roomId}</p>
    </div>
  )
}

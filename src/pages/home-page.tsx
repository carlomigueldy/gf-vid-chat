export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-4xl font-bold text-[var(--foreground)]">
        gf-vid-chat
      </h1>
      <p className="text-[var(--muted-foreground)] text-lg">
        Peer-to-peer video chat — no servers, just you two.
      </p>
    </div>
  )
}

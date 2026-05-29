export function formatDuration(ms: number): string {
  const minutes = ms / 60_000
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  return hours === 1 ? '1 hr' : `${hours} hr`
}

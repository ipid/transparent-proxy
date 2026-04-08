function formatTimestamp(now: Date): string {
  const pad = (value: number, length: number) => String(value).padStart(length, '0')

  return [
    pad(now.getFullYear() % 100, 2),
    pad(now.getMonth() + 1, 2),
    pad(now.getDate(), 2),
    '-',
    pad(now.getHours(), 2),
    pad(now.getMinutes(), 2),
    pad(now.getSeconds(), 2),
  ].join('')
}

export function generateLogFileName(): string {
  return `${formatTimestamp(new Date())}-${Math.random().toString(36).slice(2)}`
}

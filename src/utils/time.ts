export function formatTimestamp(
  now: Date = new Date(),
  highResolutionMillis: number = performance.now(),
): string {
  const pad = (value: number, length: number) => String(value).padStart(length, '0')
  const microseconds = pad(Math.floor((highResolutionMillis * 1000) % 1000), 3)

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1, 2),
    pad(now.getDate(), 2),
    pad(now.getHours(), 2),
    pad(now.getMinutes(), 2),
    pad(now.getSeconds(), 2),
    pad(now.getMilliseconds(), 3),
    microseconds,
  ].join('')
}

import { useEffect, useState } from 'react'

// Returns a live-ticking { hours, minutes, seconds, totalSeconds, expired }
// counting down to targetDate (a Date, ISO string, or null).
export const useCountdown = (targetDate) => {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!targetDate) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (!targetDate) return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, expired: true }

  const target = new Date(targetDate).getTime()
  const totalSeconds = Math.max(0, Math.floor((target - now) / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { hours, minutes, seconds, totalSeconds, expired: totalSeconds <= 0 }
}

export const formatCountdown = ({ hours, minutes, seconds }) => {
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

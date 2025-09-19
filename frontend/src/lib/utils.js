import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api`

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const res = await fetch(url, config)
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = data?.message || data?.error || `API request failed (${res.status})`
    throw new Error(msg)
  }

  return data
}

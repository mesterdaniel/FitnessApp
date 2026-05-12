"use client"

import { useEffect } from "react"

export function PwaRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
    }
  }, [])

  return null
}

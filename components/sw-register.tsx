"use client"

import { useEffect } from "react"

export function SWRegister() {
  useEffect(() => {
    // Only register service worker in production and if supported
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered:", registration.scope)
        })
        .catch((error) => {
          console.log("[PWA] Service Worker registration failed:", error)
        })
    }
  }, [])

  return null
}

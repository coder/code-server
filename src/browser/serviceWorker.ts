/* eslint-disable @typescript-eslint/no-explicit-any */

self.addEventListener("install", () => {
  console.log("[Service Worker] install")
})

self.addEventListener("activate", (event: any) => {
  event.waitUntil((self as any).clients.claim())
})

self.addEventListener("fetch", () => {
  // Without this event handler we won't be recognized as a PWA.
})

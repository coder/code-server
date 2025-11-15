self.addEventListener("install", () => {
  console.debug("[Service Worker] installed")
})

self.addEventListener("activate", (event: any) => {
  event.waitUntil((self as any).clients.claim())
  console.debug("[Service Worker] activated")
})

self.addEventListener("fetch", () => {
  // Without this event handler we won't be recognized as a PWA.
})

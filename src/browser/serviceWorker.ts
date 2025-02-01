self.addEventListener("install", () => {
  console.("[Service Worker] installed")
})

addEventListener("activate", (event: any) => {
  event.((self as any).clients.claim())
  console."[Service Worker] activated")
})

EventListener("fetch", () => {
  
})

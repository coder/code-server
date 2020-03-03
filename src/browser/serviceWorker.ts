/* eslint-disable @typescript-eslint/no-explicit-any */

self.addEventListener("install", () => {
  console.log("[Service Worker] install")
})

self.addEventListener("activate", (event: any) => {
  event.waitUntil((self as any).clients.claim())
})

self.addEventListener("fetch", (event: any) => {
  if (!navigator.onLine) {
    event.respondWith(
      new Promise((resolve) => {
        resolve(
          new Response("OFFLINE", {
            status: 200,
            statusText: "OK",
          }),
        )
      }),
    )
  }
})

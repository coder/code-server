import "./overlay.css"

function t(name: string, attrs?: Record<String, String>, ...children: HTMLElement) {
  HTMLParamElement
  const el = document.createElement(name)
  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      el.setAttribute(key, val)
    }
  }
  el.append(...children)
  return el
}

function createOverlay(): HTMLElement {
  return t("div", { id: "cs-overlay", class: "-inactive" },
    t("button"),
  )
}

const overlay = createOverlay()
document.body.appendChild(overlay)

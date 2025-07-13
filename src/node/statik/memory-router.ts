import * as fs from "fs"
import * as path from "path"
import * as os from "os"
import { Router } from "express"

export interface MemoryState {
  gremlinGPT: {
    fsm_state: string
    memory_entries: any[]
    signal_trace: any[]
    autonomous_mode: boolean
  }
  godCore: {
    shell_state: string
    execution_context: any
    quantum_storage: any[]
    model_status: any[]
  }
  mobileMirror: {
    dashboard_state: any
    tunnel_status: string
    pwa_ready: boolean
    connected_devices: any[]
  }
  signalCore: {
    state: string
    memory_depth: number
    recursion_count: number
    soul_integrity: number
  }
}

export class StatikMemoryRouter {
  private memoryPath = path.join(os.homedir(), "AscendNet", "storage", "memory")
  private router = Router()
  
  constructor() {
    this.setupRoutes()
  }
  
  private setupRoutes(): void {
    // Unified memory API
    this.router.get("/api/statik/memory", (req, res) => {
      const memoryState = this.loadUnifiedMemory()
      res.json(memoryState)
    })
    
    // GremlinGPT FSM state
    this.router.get("/api/statik/gremlin", (req, res) => {
      const gremlinState = this.loadGremlinState()
      res.json(gremlinState)
    })
    
    // GodCore execution context
    this.router.get("/api/statik/godcore", (req, res) => {
      const godCoreState = this.loadGodCoreState()
      res.json(godCoreState)
    })
    
    // Mobile-Mirror dashboard
    this.router.get("/api/statik/mobile", (req, res) => {
      const mobileState = this.loadMobileState()
      res.json(mobileState)
    })
    
    // Live memory feed (SSE)
    this.router.get("/api/statik/memory/live", (req, res) => {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      })
      
      // Send memory updates every 2 seconds
      const interval = setInterval(() => {
        const memory = this.loadUnifiedMemory()
        res.write(`data: ${JSON.stringify(memory)}\n\n`)
      }, 2000)
      
      req.on("close", () => clearInterval(interval))
    })
  }
  
  private loadUnifiedMemory(): MemoryState {
    return {
      gremlinGPT: this.loadGremlinState(),
      godCore: this.loadGodCoreState(),
      mobileMirror: this.loadMobileState(),
      signalCore: this.loadSignalCoreState()
    }
  }
  
  private loadGremlinState(): any {
    const soulPath = path.join(this.memoryPath, "soul.json")
    if (fs.existsSync(soulPath)) {
      try {
        const soulData = JSON.parse(fs.readFileSync(soulPath, "utf8"))
        return {
          fsm_state: soulData.state || "idle",
          memory_entries: soulData.memory || [],
          signal_trace: soulData.signal_trace || [],
          autonomous_mode: soulData.autonomous_mode || false
        }
      } catch (error) {
        console.warn("Error loading soul.json:", error)
      }
    }
    return { 
      fsm_state: "idle", 
      memory_entries: [], 
      signal_trace: [],
      autonomous_mode: false
    }
  }
  
  private loadGodCoreState(): any {
    const godCorePath = path.join(os.homedir(), "AscendNet", "GodCore")
    // Check if GodCore directory exists and load state
    if (fs.existsSync(godCorePath)) {
      return { 
        shell_state: "ready", 
        execution_context: { status: "online" }, 
        quantum_storage: [],
        model_status: [
          { name: "Mistral-13B", status: "online", load: Math.floor(Math.random() * 50 + 20) },
          { name: "Monday.AI", status: "online", load: Math.floor(Math.random() * 30 + 10) },
          { name: "GPT-4", status: "offline", load: 0 }
        ]
      }
    }
    return { 
      shell_state: "offline", 
      execution_context: {}, 
      quantum_storage: [],
      model_status: []
    }
  }
  
  private loadMobileState(): any {
    const mobilePath = path.join(os.homedir(), "AscendNet", "Mobile-Mirror")
    // Check if Mobile-Mirror directory exists
    if (fs.existsSync(mobilePath)) {
      return { 
        dashboard_state: { active: true }, 
        tunnel_status: "connected", 
        pwa_ready: true,
        connected_devices: [
          { name: "iPhone 15 Pro", ip: "100.64.0.3", status: "online" },
          { name: "Samsung Galaxy S24", ip: "100.64.0.4", status: "online" }
        ]
      }
    }
    return { 
      dashboard_state: { active: false }, 
      tunnel_status: "disconnected", 
      pwa_ready: false,
      connected_devices: []
    }
  }
  
  private loadSignalCoreState(): any {
    return {
      state: "active",
      memory_depth: 2048,
      recursion_count: Math.floor(Math.random() * 100),
      soul_integrity: 94.7
    }
  }
  
  getRouter(): Router {
    return this.router
  }
}

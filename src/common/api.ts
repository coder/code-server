export interface Application {
  readonly categories?: string[]
  readonly comment?: string
  readonly directory?: string
  readonly exec?: string
  readonly genericName?: string
  readonly icon?: string
  readonly installed?: boolean
  readonly name: string
  /**
   * Path if this is a browser app (like VS Code).
   */
  readonly path?: string
  /**
   * PID if this is a process.
   */
  readonly pid?: number
  readonly version?: string
}

export interface ApplicationsResponse {
  readonly applications: ReadonlyArray<Application>
}

export enum SessionError {
  FailedToStart = 4000,
  Starting = 4001,
  InvalidState = 4002,
  Unknown = 4003,
}

export interface SessionResponse {
  /**
   * Whether the process was spawned or an existing one was returned.
   */
  created: boolean
  pid: number
}

export interface RecentResponse {
  readonly paths: string[]
  readonly workspaces: string[]
}

export interface HealthRequest {
  readonly event: "health"
}

export type ClientMessage = HealthRequest

export interface HealthResponse {
  readonly event: "health"
  readonly connections: number
}

export type ServerMessage = HealthResponse

export interface ReadyMessage {
  protocol: string
}

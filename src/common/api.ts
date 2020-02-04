export interface Application {
  readonly comment?: string
  readonly directory?: string
  readonly exec?: string
  readonly icon?: string
  readonly loaded?: boolean
  readonly name: string
  readonly path: string
  readonly sessionId?: string
}

export interface ApplicationsResponse {
  readonly applications: ReadonlyArray<Application>
}

export enum SessionError {
  NotFound = 4000,
  FailedToStart,
  Starting,
  InvalidState,
  Unknown,
}

export interface LoginResponse {
  success: boolean
}

export interface CreateSessionResponse {
  sessionId: string
}

export interface ExecutableApplication extends Application {
  exec: string
}

export const isExecutableApplication = (app: Application): app is ExecutableApplication => {
  return !!(app as ExecutableApplication).exec
}

export interface RunningApplication extends ExecutableApplication {
  sessionId: string
}

export const isRunningApplication = (app: Application): app is RunningApplication => {
  return !!(app as RunningApplication).sessionId
}

export interface RecentResponse {
  readonly recent: ReadonlyArray<Application>
  readonly running: ReadonlyArray<RunningApplication>
}

export interface FileEntry {
  readonly type: "file" | "directory"
  readonly name: string
  readonly size: number
}

export interface FilesResponse {
  files: FileEntry[]
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

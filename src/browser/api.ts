import { getBasepath } from "hookrouter"
import {
  Application,
  ApplicationsResponse,
  CreateSessionResponse,
  FilesResponse,
  LoginResponse,
  RecentResponse,
} from "../common/api"
import { ApiEndpoint, HttpCode, HttpError } from "../common/http"

export interface AuthBody {
  password: string
}

/**
 * Set authenticated status.
 */
export function setAuthed(authed: boolean): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).setAuthed(authed)
}

/**
 * Try making a request. Throw an error if the request is anything except OK.
 * Also set authed to false if the request returns unauthorized.
 */
const tryRequest = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const response = await fetch(getBasepath() + "/api" + endpoint + "/", options)
  if (response.status === HttpCode.Unauthorized) {
    setAuthed(false)
  }
  if (response.status !== HttpCode.Ok) {
    const text = await response.text()
    throw new HttpError(text || response.statusText || "unknown error", response.status)
  }
  return response
}

/**
 * Try authenticating.
 */
export const authenticate = async (body?: AuthBody): Promise<LoginResponse> => {
  const response = await tryRequest(ApiEndpoint.login, {
    method: "POST",
    body: JSON.stringify({ ...body, basePath: getBasepath() }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    },
  })
  return response.json()
}

export const getFiles = async (): Promise<FilesResponse> => {
  const response = await tryRequest(ApiEndpoint.files)
  return response.json()
}

export const getRecent = async (): Promise<RecentResponse> => {
  const response = await tryRequest(ApiEndpoint.recent)
  return response.json()
}

export const getApplications = async (): Promise<ApplicationsResponse> => {
  const response = await tryRequest(ApiEndpoint.applications)
  return response.json()
}

export const getSession = async (app: Application): Promise<CreateSessionResponse> => {
  const response = await tryRequest(ApiEndpoint.session, {
    method: "POST",
    body: JSON.stringify(app),
  })
  return response.json()
}

export const killSession = async (app: Application): Promise<Response> => {
  return tryRequest(ApiEndpoint.session, {
    method: "DELETE",
    body: JSON.stringify(app),
  })
}

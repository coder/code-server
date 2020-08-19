import * as http from "http"
import { HttpCode, HttpError } from "../../common/http"
import { HttpProvider, HttpResponse, Route, Heart, HttpProviderOptions } from "../http"

/**
 * Check the heartbeat.
 */
export class HealthHttpProvider extends HttpProvider {

    public constructor(
        options: HttpProviderOptions,
        private readonly heart: Heart
      ) {
        super(options)
    }

    private alive(): Boolean {
        const now = Date.now()
        return (now - this.heart.lastHeartbeat < this.heart.heartbeatInterval)
    }

    public async handleRequest(route: Route, request: http.IncomingMessage): Promise<HttpResponse> {
        if (!this.authenticated(request)) {
            if (this.isRoot(route)) {
            return { redirect: "/login", query: { to: route.fullPath } }
            }
            throw new HttpError("Unauthorized", HttpCode.Unauthorized)
        }

        const result = {
            cache: false,
            mime: 'application/json',
            content: {
                status: (this.alive()) ? 'alive' : 'expired',
                lastHeartbeat: this.heart.lastHeartbeat

            }
        }

        return result
        
    }
}

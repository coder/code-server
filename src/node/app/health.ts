import { Heart } from "../heart"
import { HttpProvider, HttpProviderOptions, HttpResponse } from "../http"

/**
 * Check the heartbeat.
 */
export class HealthHttpProvider extends HttpProvider {
  public constructor(options: HttpProviderOptions, private readonly heart: Heart) {
    super(options)
  }

  public async handleRequest(): Promise<HttpResponse> {
    return {
      cache: false,
      mime: "application/json",
      content: {
        status: this.heart.alive() ? "alive" : "expired",
        lastHeartbeat: this.heart.lastHeartbeat,
      },
    }
  }
}

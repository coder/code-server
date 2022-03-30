import { HttpCode, HttpError } from "../../../src/common/http"

describe("http", () => {
  describe("HttpCode", () => {
    it("should return the correct HTTP codes", () => {
      expect(HttpCode.Ok).toBe(200)
      expect(HttpCode.Redirect).toBe(302)
      expect(HttpCode.NotFound).toBe(404)
      expect(HttpCode.BadRequest).toBe(400)
      expect(HttpCode.Unauthorized).toBe(401)
      expect(HttpCode.LargePayload).toBe(413)
      expect(HttpCode.ServerError).toBe(500)
    })
  })

  describe("HttpError", () => {
    it("should work as expected", () => {
      const message = "Bad request from client"
      const httpError = new HttpError(message, HttpCode.BadRequest)

      expect(httpError.message).toBe(message)
      expect(httpError.statusCode).toBe(400)
      expect(httpError.details).toBeUndefined()
    })
    it("should have details if provided", () => {
      const details = {
        message: "User needs to be signed-in in order to perform action",
      }
      const message = "Unauthorized"
      const httpError = new HttpError(message, HttpCode.BadRequest, details)

      expect(httpError.details).toStrictEqual(details)
    })
  })
})

import express from "express"
import { errorHandler } from "../../../../src/node/routes/errors"

describe("error page is rendered for text/html requests", () => {
  it("escapes any html in the error messages", async () => {
    const next = jest.fn()
    const err = {
      code: "ENOENT",
      statusCode: 404,
      message: ";>hello<script>alert(1)</script>",
    }
    const req = createRequest()
    const res = {
      status: jest.fn().mockReturnValue(this),
      send: jest.fn().mockReturnValue(this),
      set: jest.fn().mockReturnValue(this),
    } as unknown as express.Response

    await errorHandler(err, req, res, next)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.send).toHaveBeenCalledWith(expect.not.stringContaining("<script>"))
  })
})

function createRequest(): express.Request {
  return {
    headers: {
      accept: ["text/html"],
    },
    originalUrl: "http://example.com/test",
    query: {
      to: "test",
    },
  } as unknown as express.Request
}

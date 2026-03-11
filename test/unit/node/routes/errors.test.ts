import express from "express"
import { UserProvidedArgs, setDefaults } from "../../../../src/node/cli"
import { errorHandler } from "../../../../src/node/routes/errors"

describe("error page is rendered for text/html requests", () => {
  it("escapes any html in the error messages", async () => {
    const next = jest.fn()
    const err = {
      code: "ENOENT",
      statusCode: 404,
      message: ";>hello<script>alert(1)</script>",
    }
    const req = await createRequest()
    const res = {
      status: jest.fn().mockReturnValue(this),
      send: jest.fn().mockReturnValue(this),
      set: jest.fn().mockReturnValue(this),
    } as unknown as express.Response

    await errorHandler(err, req, res, next)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.send).toHaveBeenCalledWith(expect.not.stringContaining("<script>"))
  })

  it("should use custom app-name in error page title", async () => {
    const err = {
      statusCode: 404,
      message: "Not found",
    }
    const req = await createRequest({ "app-name": "MyCodeServer" })
    const res = {
      status: jest.fn().mockReturnValue(this),
      send: jest.fn().mockReturnValue(this),
      set: jest.fn().mockReturnValue(this),
    } as unknown as express.Response

    await errorHandler(err, req, res, jest.fn())
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining("<title>404 - MyCodeServer</title>"))
  })

  it("should use default 'code-server' when app-name is not set", async () => {
    const err = {
      statusCode: 500,
      message: "Internal error",
    }
    const req = await createRequest()
    const res = {
      status: jest.fn().mockReturnValue(this),
      send: jest.fn().mockReturnValue(this),
      set: jest.fn().mockReturnValue(this),
    } as unknown as express.Response

    await errorHandler(err, req, res, jest.fn())
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining("<title>500 - code-server</title>"))
  })
})

async function createRequest(args: UserProvidedArgs = {}): Promise<express.Request> {
  return {
    headers: {
      accept: ["text/html"],
    },
    originalUrl: "http://example.com/test",
    query: {
      to: "test",
    },
    args: await setDefaults(args),
  } as unknown as express.Request
}

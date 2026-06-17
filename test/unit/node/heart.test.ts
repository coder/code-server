import { logger } from "@coder/logger"
import { readFile, writeFile, stat, utimes } from "fs/promises"
import { setImmediate } from "timers"
import { Heart } from "../../../src/node/heart"
import { clean, mockLogger, tmpdir } from "../../utils/helpers"

describe("Heart", () => {
  const testName = "heartTests"
  let testDir = ""
  let heart: Heart

  beforeAll(async () => {
    mockLogger()
    await clean(testName)
    testDir = await tmpdir(testName)
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  beforeEach(() => {
    heart = new Heart(`${testDir}/shutdown.txt`, jest.fn().mockResolvedValue(true))
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.useRealTimers()
    if (heart) {
      heart.dispose()
    }
  })

  it("should write to a file when given a valid file path", async () => {
    // Set up heartbeat file with contents
    const text = "test"
    const pathToFile = `${testDir}/file.txt`
    await writeFile(pathToFile, text)
    const fileContents = await readFile(pathToFile, { encoding: "utf8" })
    // Explicitly set the modified time to 0 so that we can check
    // that the file was indeed modified after calling heart.beat().
    // This works around any potential race conditions.
    // Docs: https://nodejs.org/api/fs.html#fspromisesutimespath-atime-mtime
    await utimes(pathToFile, 0, 0)

    expect(fileContents).toBe(text)

    heart = new Heart(pathToFile, jest.fn().mockResolvedValue(true))
    await heart.beat()
    // Check that the heart wrote to the heartbeatFilePath and overwrote our text
    const fileContentsAfterBeat = await readFile(pathToFile, { encoding: "utf8" })
    expect(fileContentsAfterBeat).not.toBe(text)
    // Make sure the modified timestamp was updated.
    const fileStatusAfterEdit = await stat(pathToFile)
    expect(fileStatusAfterEdit.mtimeMs).toBeGreaterThan(0)
  })

  it("should log a warning when given an invalid file path", async () => {
    heart = new Heart(`fakeDir/fake.txt`, jest.fn().mockResolvedValue(false))
    await heart.beat()
    expect(logger.warn).toHaveBeenCalled()
  })

  it("should be active after calling beat", async () => {
    await heart.beat()

    const isAlive = heart.alive()
    expect(isAlive).toBe(true)
  })

  it("should not be active after dispose is called", () => {
    heart.dispose()

    const isAlive = heart.alive()
    expect(isAlive).toBe(false)
  })

  it("should beat twice without warnings", async () => {
    heart = new Heart(`${testDir}/hello.txt`, jest.fn().mockResolvedValue(true))
    await heart.beat()
    jest.runAllTimers()
    expect(logger.warn).not.toHaveBeenCalled()
  })
})

describe("heartbeatTimer", () => {
  const testName = "heartbeatTimer"
  let testDir = ""

  beforeAll(async () => {
    await clean(testName)
    testDir = await tmpdir(testName)
    mockLogger()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it("should call isActive when timeout expires", async () => {
    const mockIsActive = jest.fn().mockResolvedValue(true)
    const heart = new Heart(`${testDir}/shutdown.txt`, mockIsActive)
    await heart.beat()
    jest.advanceTimersByTime(60 * 1000)
    expect(mockIsActive).toHaveBeenCalled()
  })

  it("should log a warning when isActive rejects", async () => {
    const error = new Error("oh no")
    const mockIsActive = jest.fn().mockRejectedValue(error)
    const heart = new Heart(`${testDir}/shutdown.txt`, mockIsActive)
    await heart.beat()
    jest.advanceTimersByTime(60 * 1000)
    expect(mockIsActive).toHaveBeenCalled()

    // The timer callback waits on mockIsActive, so we need to yield to let the
    // callback finish.
    await new Promise((resolve) => setImmediate(resolve))

    expect(logger.warn).toHaveBeenCalledWith(error.message)
  })
})

describe("stateChange", () => {
  const testName = "stateChange"
  let testDir = ""
  let heart: Heart

  beforeAll(async () => {
    await clean(testName)
    testDir = await tmpdir(testName)
    mockLogger()
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.useRealTimers()
    if (heart) {
      heart.dispose()
    }
  })

  it("should change to alive after a beat", async () => {
    const mockIsActive = jest.fn().mockResolvedValue(true)
    heart = new Heart(`${testDir}/shutdown.txt`, mockIsActive)
    const mockOnChange = jest.fn()
    heart.onChange(mockOnChange)

    await heart.beat()

    expect(mockOnChange.mock.calls[0][0]).toBe("alive")
  })

  it("should change to expired when not active", async () => {
    const mockIsActive = jest.fn().mockResolvedValue(false)
    heart = new Heart(`${testDir}/shutdown.txt`, mockIsActive)
    const mockOnChange = jest.fn()
    heart.onChange(mockOnChange)

    await heart.beat()
    jest.advanceTimersByTime(60 * 1000)
    expect(mockIsActive).toHaveBeenCalled()

    // The timer callback waits on the isActive promise, so we need to yield to
    // let the callback finish.
    await new Promise((resolve) => setImmediate(resolve))

    expect(mockOnChange.mock.calls[1][0]).toBe("expired")
  })
})

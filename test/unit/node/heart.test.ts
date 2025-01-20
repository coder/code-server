import { logger } from "@coder/logger"
import { readFile, writeFile, stat, utimes } from "fs/promises"
import { Heart, heartbeatTimer } from "../../../src/node/heart"
import { clean, mockLogger, tmpdir } from "../../utils/helpers"

const mockIsActive = (resolveTo: boolean) => jest.fn().mockResolvedValue(resolveTo)

describe("Heart", () => {
  const testName = "heartTests"
  let testDir = ""
  let heart: Heart

  beforeAll(async () => {
    mockLogger()
    await clean(testName)
    testDir = await tmpdir(testName)
  })
  beforeEach(() => {
    heart = new Heart(`${testDir}/shutdown.txt`, mockIsActive(true))
  })
  afterAll(() => {
    jest.restoreAllMocks()
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

    heart = new Heart(pathToFile, mockIsActive(true))
    await heart.beat()
    // Check that the heart wrote to the heartbeatFilePath and overwrote our text
    const fileContentsAfterBeat = await readFile(pathToFile, { encoding: "utf8" })
    expect(fileContentsAfterBeat).not.toBe(text)
    // Make sure the modified timestamp was updated.
    const fileStatusAfterEdit = await stat(pathToFile)
    expect(fileStatusAfterEdit.mtimeMs).toBeGreaterThan(0)
  })
  it("should log a warning when given an invalid file path", async () => {
    heart = new Heart(`fakeDir/fake.txt`, mockIsActive(false))
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
    // Use fake timers so we can speed up setTimeout
    jest.useFakeTimers()
    heart = new Heart(`${testDir}/hello.txt`, mockIsActive(true))
    await heart.beat()
    // we need to speed up clocks, timeouts
    // call heartbeat again (and it won't be alive I think)
    // then assert no warnings were called
    jest.runAllTimers()
    expect(logger.warn).not.toHaveBeenCalled()
  })
})

describe("heartbeatTimer", () => {
  beforeAll(() => {
    mockLogger()
  })
  afterAll(() => {
    jest.restoreAllMocks()
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it("should call beat when isActive resolves to true", async () => {
    const isActive = true
    const mockIsActive = jest.fn().mockResolvedValue(isActive)
    const mockBeatFn = jest.fn()
    await heartbeatTimer(mockIsActive, mockBeatFn)
    expect(mockIsActive).toHaveBeenCalled()
    expect(mockBeatFn).toHaveBeenCalled()
  })
  it("should log a warning when isActive rejects", async () => {
    const errorMsg = "oh no"
    const error = new Error(errorMsg)
    const mockIsActive = jest.fn().mockRejectedValue(error)
    const mockBeatFn = jest.fn()
    await heartbeatTimer(mockIsActive, mockBeatFn)
    expect(mockIsActive).toHaveBeenCalled()
    expect(mockBeatFn).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith(errorMsg)
  })
})

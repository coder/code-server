export const loggerModule = {
  field: jest.fn(),
  level: 2,
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    trace: jest.fn(),
    warn: jest.fn(),
  },
}

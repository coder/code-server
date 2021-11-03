// see: http://man7.org/linux/man-pages/man2/accept.2.html#ERRORS
var offlineErrorCodes = [
  'EAI_AGAIN',
  'ENETDOWN',
  'EPROTO',
  'ENOPROTOOPT',
  'EHOSTDOWN',
  'ENONET',
  'EHOSTUNREACH',
  'EOPNOTSUPP',
  'ENETUNREACH',
]

module.exports = offlineErrorCodes

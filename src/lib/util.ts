

export function uniqueId () {
  const now = Date.now()
  const random = Math.random()
  return `${now}-${random}`
}

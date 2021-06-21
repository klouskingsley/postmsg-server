

export function uniqueId () {
  const now = Date.now()
  const random = Math.random()
  return `${now}-${random}`
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

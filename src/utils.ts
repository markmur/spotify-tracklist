export const get = (obj: any, key: string, fallback: any) => {
  if (!obj) return fallback

  return (
    key
      .split('.')
      .reduce(
        (state: any, x: string) => (state && state[x] ? state[x] : null),
        obj
      ) || fallback
  )
}

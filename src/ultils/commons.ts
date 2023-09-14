export const convertEnumToArray = (enumNumber: { [key: string]: string | number }) => {
  return Object.values(enumNumber).filter((item) => typeof item === 'number') as number[]
}

export function randomPassword() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2)
}

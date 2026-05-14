export function required(v) {
  return v ? undefined : 'Required'
}

export function isEmail(v) {
  return /\S+@\S+\.\S+/.test(v) ? undefined : 'Invalid email'
}

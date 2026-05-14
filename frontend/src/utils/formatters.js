export function formatPhone(n) {
  if (!n) return ''
  return n
}

export function shortDate(d) {
  return d ? new Date(d).toLocaleDateString() : ''
}

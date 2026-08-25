export function formatToday(locale = 'es-CR') {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
}

export function formatShortToday(locale = 'es-CR') {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(new Date())
}

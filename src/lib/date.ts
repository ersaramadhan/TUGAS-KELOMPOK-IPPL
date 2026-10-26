export function formatAppDate(date = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function formatMonthPeriod(date = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric"
  }).format(date);
}

export function formatDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

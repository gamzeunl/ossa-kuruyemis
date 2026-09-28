/** `<input type="datetime-local">` değeri — yerel saat, saniyesiz (`YYYY-MM-DDTHH:mm`). */
export function toDateTimeLocalValue(date: Date | null): string {
  if (!date) {
    return "";
  }
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

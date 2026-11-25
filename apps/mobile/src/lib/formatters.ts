export function formatBrazilianPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length === 0 ? "" : `(${digits}`;

  const areaCode = digits.slice(0, 2);
  const number = digits.slice(2);
  const prefixLength = digits.length === 11 ? 5 : 4;
  const formattedNumber = number.length > prefixLength
    ? `${number.slice(0, prefixLength)}-${number.slice(prefixLength)}`
    : number;

  return `(${areaCode}) ${formattedNumber}`;
}

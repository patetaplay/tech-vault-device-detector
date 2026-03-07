export function toCurrency(value: number): string {
  return `R$ ${value.toFixed(2)}`;
}

export function toDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR');
}

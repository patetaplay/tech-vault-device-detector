export function toCurrency(value) {
    return `R$ ${value.toFixed(2)}`;
}
export function toDateTime(iso) {
    return new Date(iso).toLocaleString('pt-BR');
}

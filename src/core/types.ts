export type Route =
  | '#/dashboard'
  | '#/clientes'
  | '#/produtos'
  | '#/estoque'
  | '#/estoque-relatorio'
  | '#/servicos'
  | '#/os'
  | '#/caixa'
  | '#/vendas'
  | '#/financeiro';

export interface SessionUser {
  id: string;
  name: string;
  role: string;
}

export interface AppContext {
  render: () => void;
}

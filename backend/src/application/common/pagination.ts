export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

export interface PageRequest {
  /** Número de página, desde 1. */
  page: number;
  /** Elementos por página. */
  pageSize: number;
}

/** Una página de resultados y los datos para pedir las demás. */
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  /** Total de elementos en todas las páginas. */
  total: number;
  totalPages: number;
}

/**
 * Deja la página y el tamaño dentro de límites razonables. Los DTOs ya
 * rechazan valores inválidos con un 400; esto protege a quien llame al caso
 * de uso desde otro lugar.
 */
export function normalizePageRequest(
  input: Partial<PageRequest> = {},
): PageRequest {
  const page = Number.isInteger(input.page) ? Math.max(1, input.page!) : 1;
  const size = Number.isInteger(input.pageSize)
    ? input.pageSize!
    : DEFAULT_PAGE_SIZE;
  return { page, pageSize: Math.min(Math.max(1, size), MAX_PAGE_SIZE) };
}

export function buildPage<T>(
  items: T[],
  request: PageRequest,
  total: number,
): Page<T> {
  return {
    items,
    page: request.page,
    pageSize: request.pageSize,
    total,
    totalPages: Math.ceil(total / request.pageSize),
  };
}

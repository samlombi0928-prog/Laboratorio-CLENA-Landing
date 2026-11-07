/** Página que se pide en un listado. page empieza en 1. */
export interface PageRequest {
  page: number;
  pageSize: number;
}

/** Una página de resultados y el total de elementos que hay en todas. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

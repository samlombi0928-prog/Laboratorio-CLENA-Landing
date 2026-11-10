/** Solo acepta rutas internas, para que nadie pueda armar un enlace que lleve a otro sitio. */
export function rutaInternaSegura(ruta: string | null): string | null {
  return ruta && ruta.startsWith('/') && !ruta.startsWith('//') ? ruta : null
}

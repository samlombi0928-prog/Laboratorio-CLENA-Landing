import { describe, expect, it } from 'vitest'
import { rutaInternaSegura } from './rutas'

describe('rutaInternaSegura', () => {
  it('acepta rutas internas', () => {
    expect(rutaInternaSegura('/panel')).toBe('/panel')
    expect(rutaInternaSegura('/panel/usuarios?pagina=2')).toBe('/panel/usuarios?pagina=2')
  })

  it('rechaza enlaces que el navegador toma como otro sitio', () => {
    expect(rutaInternaSegura('https://sitio-falso.com')).toBeNull()
    expect(rutaInternaSegura('//sitio-falso.com')).toBeNull()
    expect(rutaInternaSegura('/\\sitio-falso.com')).toBeNull()
  })

  it('rechaza lo vacío', () => {
    expect(rutaInternaSegura(null)).toBeNull()
    expect(rutaInternaSegura('')).toBeNull()
  })
})

/**
 * Puerto que el caso de uso necesita para saber si la base de datos responde.
 * La infraestructura lo implementa; el módulo lo provee con este token.
 */
export interface DatabaseChecker {
  isAvailable(): Promise<boolean>;
}

export const DATABASE_CHECKER = Symbol('DatabaseChecker');

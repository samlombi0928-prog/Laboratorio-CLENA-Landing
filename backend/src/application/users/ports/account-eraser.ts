export interface AccountToErase {
  id: string;
  /** Correo ya normalizado: con él se encuentran las inscripciones a eventos. */
  email: string;
}

export interface ErasedAccount {
  /**
   * Claves de los archivos que eran de la cuenta (por ejemplo las portadas de
   * sus recorridos). La base ya no los menciona, pero siguen en el
   * almacenamiento hasta que se borren.
   */
  storedFileKeys: string[];
}

/**
 * Elimina una cuenta y todo lo que depende de ella, en una sola transacción:
 * o se borra todo o no se borra nada (derecho de supresión, Ley 1581 de 2012).
 *
 * Borra la cuenta y, con ella, sus sesiones y sus recorridos; borra también las
 * inscripciones a eventos hechas con su correo, que no están ligadas a la
 * cuenta. Las imágenes de la galería que subió se conservan, sin su nombre.
 */
export interface AccountEraser {
  erase(account: AccountToErase): Promise<ErasedAccount>;
}

export const ACCOUNT_ERASER = Symbol('AccountEraser');

import type { ImageContentType } from './ports/file-storage.js';

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWith(content: Uint8Array, signature: number[]): boolean {
  return (
    content.length >= signature.length &&
    signature.every((byte, index) => content[index] === byte)
  );
}

/**
 * Reconoce el tipo de imagen por sus primeros bytes, no por la extensión ni
 * por el tipo que dice el navegador, que se pueden falsificar. Devuelve null
 * si no es JPG ni PNG.
 */
export function detectImageType(content: Uint8Array): ImageContentType | null {
  if (startsWith(content, JPEG_SIGNATURE)) return 'image/jpeg';
  if (startsWith(content, PNG_SIGNATURE)) return 'image/png';
  return null;
}

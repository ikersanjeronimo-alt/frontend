/**
 * Activado en dev mientras el backend no está completo. Cuando esté:
 *  - `useApi` deja de caer al mock en errores de red y propaga el error.
 *  - Las escrituras (sendBottle, sendLetter, updateUsername) dejan de fingir
 *    éxito cuando el back no responde y muestran el error al usuario.
 *  - El banner "Modo demostración" desaparece.
 *
 * En `.env`:
 *   VITE_USE_MOCK_FALLBACK=true   (desarrollo sin back)
 *   VITE_USE_MOCK_FALLBACK=false  (cuando el back funcione)
 */
export const ALLOW_MOCK_FALLBACK =
  import.meta.env.VITE_USE_MOCK_FALLBACK === 'true'

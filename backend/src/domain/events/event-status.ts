/** En qué momento de su publicación está un evento. */
export enum EventStatus {
  /** Su periodo de publicación todavía no empieza. */
  Scheduled = 'scheduled',
  /** Se ve en la agenda y recibe inscripciones. */
  Published = 'published',
  /** Ya no se ve: terminó su periodo de publicación o el evento ya empezó. */
  Closed = 'closed',
}

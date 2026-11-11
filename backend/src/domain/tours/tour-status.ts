/** Estado de un recorrido. */
export enum TourStatus {
  /** Recién creado: solo lo ve su creador. */
  Draft = 'draft',
  /** Visible para todos (#22). */
  Published = 'published',
}

export const TOUR_STATUSES = Object.values(TourStatus);

export interface PanelisteCampagne {
  id?: number;
  panelisteId: number;
  campagneId: number;
  dateParticipation?: Date;
  statut: PanelisteCampagneStatut;
  feedback?: string;
  dateCompletion?: Date;
}

export enum PanelisteCampagneStatut {
  INVITE = 'INVITE',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
  EN_COURS = 'EN_COURS',
  COMPLETE = 'COMPLETE'
}

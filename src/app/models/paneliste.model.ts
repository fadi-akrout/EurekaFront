import { PanelisteCampagne } from './paneliste-campagne.model';

export interface Paneliste {
  id?: number;
  nom: string;
  email: string;
  motDePasse: string;
  dateInscription: Date;
  interets: string[];
  campagnesParticipees?: PanelisteCampagne[];
}

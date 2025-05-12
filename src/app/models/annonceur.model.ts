import { Campagne } from './campagne.model';

export interface Annonceur {
  id?: number;
  nom: string;
  email: string;
  motDePasse: string;
  dateInscription: Date;
  entreprise: string;
  campagnesCreees?: Campagne[];
}

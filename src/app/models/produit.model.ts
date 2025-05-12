import { Campagne } from './campagne.model';

export interface Produit {
  id?: number;
  nom: string;
  description: string;
  categorie: string;
  noteMoyenne?: number;
  campagne?: Campagne;
}

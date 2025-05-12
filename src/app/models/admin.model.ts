export interface Admin {
  id?: number;
  nom: string;
  email: string;
  motDePasse: string;
  dateInscription: Date;
  permissions: string[];
}

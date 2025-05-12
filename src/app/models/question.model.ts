import { Option } from './option.model';
import { Reponse } from './reponse.model';

export interface Question {
  id?: number;
  texte: string;
  options?: Option[];
  reponses?: Reponse[];
}

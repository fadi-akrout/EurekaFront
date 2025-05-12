import { Formulaire } from './formulaire.model';
import { Question } from './question.model';

export interface FormulaireQuestion {
  id?: number;
  formulaire?: Formulaire;
  question?: Question;
}

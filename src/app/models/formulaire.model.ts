import { Campagne } from './campagne.model';
import { FormulaireQuestion } from './formulaire-question.model';

export interface Formulaire {
  id?: number;
  campagne?: Campagne;
  formulaireQuestions?: FormulaireQuestion[];
}

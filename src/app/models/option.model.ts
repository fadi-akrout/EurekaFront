import { Question } from './question.model';

export interface Option {
  id?: number;
  texte: string;
  question?: Question;
}

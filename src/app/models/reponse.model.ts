import { Question } from './question.model';

export interface Reponse {
  id?: number;
  date: Date;
  question?: Question;
}

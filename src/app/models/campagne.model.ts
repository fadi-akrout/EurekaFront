export interface Campaign {
  id: number
  nom: string
  description: string
  dateDebut: Date
  dateFin: Date
  statut: "PLANIFIEE" | "ACTIVE" | "TERMINEE"
  annonceur?: number
  produit?: Product
  formulaire?: Form
  resultatAnalyse?: AnalysisResult
  panelisteCampagnes?: PanelisteCampagne[]
}

export interface Product {
  id: number
  nom: string
  description: string
  categorie: string
  noteMoyenne: number
  campagne?: number
}

export interface Form {
  id: number
  campagne?: number
  formulaireQuestions?: FormQuestion[]
}

export interface FormQuestion {
  id: number
  formulaire?: number
  question?: Question
}

export interface Question {
  id: number
  texte: string
  options?: Option[]
  reponses?: Response[]
}

export interface Option {
  id: number
  texte: string
  question?: number
}

export interface Response {
  id: number
  date: Date
  question?: number
}

export interface Feedback {
  id: number
  note: number
  commentaire: string
  date: Date
  paneliste?: number
  campagne?: number
}

export interface AnalysisResult {
  id: number
  resultats: Record<string, number>
}

export interface PanelisteCampagne {
  id: number
  paneliste?: number
  campagne?: number
}

export interface CampaignCompleteRequest {
  campagne: Campaign
  produit: Product
  formulaire: Form
}

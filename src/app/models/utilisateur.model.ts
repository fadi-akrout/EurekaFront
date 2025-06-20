export interface User {
  id: number
  nom: string
  email: string
  motDePasse?: string
  dateInscription: Date
  role?: string // Kept for backward compatibility
  userType?: string // Added for new user type system
}

export interface Admin extends User {
  permissions: string[]
}

export interface Annonceur extends User {
  entreprise: string
  campagnesCreees?: number[]
}

export interface Paneliste extends User {
  interets: string[]
  campagnesParticipees?: number[]
}

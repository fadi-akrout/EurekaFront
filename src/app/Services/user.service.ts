import { Injectable } from '@angular/core';
import  { HttpClient } from "@angular/common/http"
import  { Observable } from "rxjs"
import  { Admin, Annonceur, Paneliste, User } from "../models/utilisateur.model"
import { environment } from "../../environment/environment"
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api`

  constructor(private http: HttpClient) {}

  // Utilisateur endpoints
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/utilisateurs`)
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/utilisateurs/${id}`)
  }

  getUserByEmail(email: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/utilisateurs/email/${email}`)
  }

  // Admin endpoints
  getAllAdmins(): Observable<Admin[]> {
    return this.http.get<Admin[]>(`${this.apiUrl}/admins`)
  }

  getAdminById(id: number): Observable<Admin> {
    return this.http.get<Admin>(`${this.apiUrl}/admins/${id}`)
  }

  createAdmin(admin: Admin): Observable<Admin> {
    return this.http.post<Admin>(`${this.apiUrl}/admins`, admin)
  }

  // Annonceur endpoints
  getAllAnnonceurs(): Observable<Annonceur[]> {
    return this.http.get<Annonceur[]>(`${this.apiUrl}/annonceurs`)
  }

  getAnnonceurById(id: number): Observable<Annonceur> {
    return this.http.get<Annonceur>(`${this.apiUrl}/annonceurs/${id}`)
  }

  createAnnonceur(annonceur: Annonceur): Observable<Annonceur> {
    return this.http.post<Annonceur>(`${this.apiUrl}/annonceurs`, annonceur)
  }

  // Paneliste endpoints
  getAllPanelistes(): Observable<Paneliste[]> {
    return this.http.get<Paneliste[]>(`${this.apiUrl}/panelistes`)
  }

  getPanelisteById(id: number): Observable<Paneliste> {
    return this.http.get<Paneliste>(`${this.apiUrl}/panelistes/${id}`)
  }

  createPaneliste(paneliste: Paneliste): Observable<Paneliste> {
    return this.http.post<Paneliste>(`${this.apiUrl}/panelistes`, paneliste)
  }

  getPanelisteCampaigns(panelisteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/panelistes/${panelisteId}/campagnes`)
  }

  participateInCampaign(panelisteId: number, campaignId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/panelistes/${panelisteId}/participer/${campaignId}`, {})
  }
}
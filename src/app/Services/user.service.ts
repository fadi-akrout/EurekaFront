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

  // Admin management methods
  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/utilisateurs/${id}`, user)
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/utilisateurs/${id}`)
  }

  updateAdmin(id: number, admin: Partial<Admin>): Observable<Admin> {
    return this.http.put<Admin>(`${this.apiUrl}/admins/${id}`, admin)
  }

  deleteAdmin(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admins/${id}`)
  }

  updateAnnonceur(id: number, annonceur: Partial<Annonceur>): Observable<Annonceur> {
    return this.http.put<Annonceur>(`${this.apiUrl}/annonceurs/${id}`, annonceur)
  }

  deleteAnnonceur(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/annonceurs/${id}`)
  }

  updatePaneliste(id: number, paneliste: Partial<Paneliste>): Observable<Paneliste> {
    return this.http.put<Paneliste>(`${this.apiUrl}/panelistes/${id}`, paneliste)
  }

  deletePaneliste(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/panelistes/${id}`)
  }

  // Activity tracking methods
  getUserActivity(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/utilisateurs/${userId}/activity`)
  }

  getUserStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/utilisateurs/stats`)
  }

  getRecentUsers(limit: number = 10): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/utilisateurs/recent?limit=${limit}`)
  }

  // Get users with their campaign counts
  getUsersWithCampaignCounts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/utilisateurs/with-campaigns`)
  }
}
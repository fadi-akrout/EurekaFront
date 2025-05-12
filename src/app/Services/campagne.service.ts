import { Injectable } from '@angular/core';
import { environment } from '../../environment/environment';
import { Observable } from 'rxjs';
import  { Campaign, CampaignCompleteRequest } from "../models/campagne.model";
import  { HttpClient } from "@angular/common/http"
@Injectable({
  providedIn: 'root'
})
export class CampagneService {
  private apiUrl = `${environment.apiUrl}/api/campagnes`

  constructor(private http: HttpClient) {}

  getAllCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(this.apiUrl)
  }

  getActiveCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.apiUrl}/actives`)
  }

  getCampaignById(id: number): Observable<Campaign> {
    return this.http.get<Campaign>(`${this.apiUrl}/${id}`)
  }

  createCampaign(campaign: Campaign): Observable<Campaign> {
    return this.http.post<Campaign>(this.apiUrl, campaign)
  }

  createCompleteCampaign(request: CampaignCompleteRequest): Observable<Campaign> {
    return this.http.post<Campaign>(`${this.apiUrl}/complete`, request)
  }

  updateCampaign(id: number, campaign: Campaign): Observable<Campaign> {
    return this.http.put<Campaign>(`${this.apiUrl}/${id}`, campaign)
  }

  deleteCampaign(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
  }

  startCampaign(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/demarrer`, {})
  }

  endCampaign(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/terminer`, {})
  }

  assignPanelists(campaignId: number, panelistIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${campaignId}/panelistes`, panelistIds)
  }
}
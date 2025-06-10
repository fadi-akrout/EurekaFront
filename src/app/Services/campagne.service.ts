import { Injectable } from '@angular/core';
import { environment } from '../../environment/environment';
import { Observable, map } from 'rxjs';
import  { Campaign, CampaignCompleteRequest } from "../models/campagne.model";
import  { PanelisteCampagne, PanelisteCampagneStatut } from "../models/paneliste-campagne.model";
import  { HttpClient, HttpHeaders } from "@angular/common/http";
import { AuthService } from './auth.service';
@Injectable({
  providedIn: 'root'
})
export class CampagneService {
  private apiUrl = `${environment.apiUrl}/api/campagnes`

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}
  
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
      console.log('Adding authorization token to request:', `Bearer ${token.substring(0, 15)}...`);
    } else {
      console.warn('No authorization token available');
    }
    
    // Log all headers for debugging
    headers.keys().forEach(key => {
      console.log(`Header ${key}:`, headers.get(key));
    });
    
    return headers;
  }

  getAllCampaigns(): Observable<Campaign[]> {
    console.log('Fetching all campaigns');
    
    return this.http.get<Campaign[]>(this.apiUrl).pipe(
      map(campaigns => {
      //  console.log('All campaigns response:', campaigns);
        return campaigns;
      })
    );
  }

  getActiveCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.apiUrl}/actives`)
  }

  getCampaignById(id: number): Observable<Campaign> {
    console.log(`Fetching campaign with ID: ${id}`);
    
    return this.http.get<Campaign>(`${this.apiUrl}/${id}`).pipe(
      map(campaign => {
        console.log(`Campaign ${id} response:`, campaign);
        return campaign;
      })
    );
  }

  createCampaign(campaign: Campaign): Observable<Campaign> {
    return this.http.post<Campaign>(this.apiUrl, campaign)
  }

  createCompleteCampaign(request: CampaignCompleteRequest): Observable<Campaign> {
   // console.log('Sending complete campaign request to:', `${this.apiUrl}/complete`);
   // console.log('Request payload:', JSON.stringify(request));
    
    return this.http.post<Campaign>(`${this.apiUrl}/complete`, request, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      map(response => {
        console.log('Campaign creation response:', response);
        return response;
      })
    );
  }

  updateCampaign(id: number, campaign: Campaign): Observable<Campaign> {
    console.log('Updating campaign:', id, JSON.stringify(campaign));
    
    return this.http.put<Campaign>(`${this.apiUrl}/${id}`, campaign, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  updateCompleteCampaign(id: number, request: CampaignCompleteRequest): Observable<Campaign> {
    console.log('Updating complete campaign:', id);
    console.log('Request URL:', `${this.apiUrl}/${id}/complete`);
    console.log('Request payload:', JSON.stringify(request));
    
    return this.http.put<Campaign>(`${this.apiUrl}/${id}/complete`, request, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      map(response => {
        console.log('Update complete campaign response:', response);
        return response;
      })
    );
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

  // Participation request management
  requestParticipation(campaignId: number, panelisteId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${campaignId}/request-participation`, { panelisteId })
  }

  getPendingParticipationRequests(campaignId: number): Observable<any[]> {
    // Updated to use the new secure endpoint
    const url = `${environment.apiUrl}/api/participation-requests/campaign/${campaignId}/pending`;
    console.log(`Fetching pending requests from: ${url}`);
    
    // Get current user info for debugging
    const currentUser = this.authService.currentUserValue;
    console.log('Current user making request:', {
      id: currentUser?.id,
      role: currentUser?.role,
      userType: currentUser?.userType,
      isAuthenticated: this.authService.isAuthenticated(),
      isAdmin: this.authService.isAdmin(),
      isAnnonceur: this.authService.isAnnonceur()
    });
    
    // Add proper authentication token
    return this.http.get<any[]>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('Pending requests response:', response);
        
        // Process the response to ensure proper data structure
        const processedRequests = Array.isArray(response) ? response.map(request => {
          // Look for panelist data in different possible properties
          // This depends on your API response structure
          if (request.panelisteId && !request.paneliste) {
            // Check if panelist data is available as flat properties on the request
            if (request.panelisteNom || request.panelisteEmail) {
              request.paneliste = {
                id: request.panelisteId,
                nom: request.panelisteNom || `Panelist ${request.panelisteId}`,
                email: request.panelisteEmail || 'No email available',
                interets: request.panelisteInterets || []
              };
              console.log(`Created paneliste object from flat properties for request ${request.id}`, request.paneliste);
            }
            // Check for alternate property names
            else if (request.panelist) {
              request.paneliste = request.panelist;
            } else if (request.user) {
              request.paneliste = {
                id: request.user.id,
                nom: request.user.nom || request.user.name || request.user.username,
                email: request.user.email,
                interets: request.user.interets || request.user.interests || []
              };
            }
          }
          
          return request;
        }) : [];
        
        console.log('Processed requests:', processedRequests);
        return processedRequests;
      })
    );
  }

  approveParticipationRequest(campaignId: number, panelisteId: number, feedback?: string): Observable<any> {
    // Ensure both IDs are numbers
    const numCampaignId = Number(campaignId);
    const numPanelisteId = Number(panelisteId);
    
    // Get current user ID for annonceurId (the campaign owner)
    const currentUser = this.authService.currentUserValue;
    const annonceurId = currentUser?.id ? Number(currentUser.id) : null;
    
    // Build request URL
    const url = `${environment.apiUrl}/api/participation-requests/approve`;
    
    // Create the request body
    const requestBody = {
      campagneId: numCampaignId,
      panelisteId: numPanelisteId,
      annonceurId: annonceurId,
      feedback: feedback
    };
    
    console.log(`Approving participation for panelist ${numPanelisteId} in campaign ${numCampaignId} by annonceur ${annonceurId}`);
    console.log(`Request payload:`, requestBody);
    
    // Send the request with JSON body
    return this.http.put<any>(url, requestBody, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('Approve participation response:', response);
        return response;
      })
    );
  }

  rejectParticipationRequest(campaignId: number, panelisteId: number, feedback?: string): Observable<any> {
    // Ensure both IDs are numbers
    const numCampaignId = Number(campaignId);
    const numPanelisteId = Number(panelisteId);
    
    // Get current user ID for annonceurId (the campaign owner)
    const currentUser = this.authService.currentUserValue;
    const annonceurId = currentUser?.id ? Number(currentUser.id) : null;
    
    // Build request URL
    const url = `${environment.apiUrl}/api/participation-requests/reject`;
    
    // Create the request body
    const requestBody = {
      campagneId: numCampaignId,
      panelisteId: numPanelisteId,
      annonceurId: annonceurId,
      feedback: feedback
    };
    
    console.log(`Rejecting participation for panelist ${numPanelisteId} in campaign ${numCampaignId} by annonceur ${annonceurId}`);
    console.log(`Request payload:`, requestBody);
    
    // Send the request with JSON body
    return this.http.put<any>(url, requestBody, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('Reject participation response:', response);
        return response;
      })
    );
  }

  getParticipationStatus(campaignId: number, panelisteId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${campaignId}/participation-status/${panelisteId}`)
  }

  getCampaignsByAnnonceur(annonceurId: number): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.apiUrl}/annonceur/${annonceurId}`)
  }
}
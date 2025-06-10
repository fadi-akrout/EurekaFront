import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CampagneService } from '../../../Services/campagne.service';
import { AuthService } from '../../../Services/auth.service';
import { UserService } from '../../../Services/user.service';
import { ParticipationModalService } from '../../../Services/participation-modal.service';
import { ParticipationModalComponent } from '../../shared/participation-modal/participation-modal.component';
import { Campaign } from '../../../models/campagne.model';
import { User } from '../../../models/utilisateur.model';
import { PanelisteCampagneStatut } from '../../../models/paneliste-campagne.model';

interface ParticipationRequest {
  id: number;
  panelisteId: number;
  campagneId: number;
  statut: PanelisteCampagneStatut;
  dateParticipation: Date;
  
  // These are the properties that may exist on the paneliste object
  paneliste?: {
    id: number;
    nom: string;
    email: string;
    interets?: string[];
  };
  
  // Alternative flat properties that might exist directly on the request
  panelisteNom?: string;
  panelisteEmail?: string;
  panelisteInterets?: string[];
  
  // Other possible date fields
  createdAt?: Date | string;
  date?: Date | string;
  requestDate?: Date | string;
}



@Component({
  selector: 'app-participation-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, ParticipationModalComponent],
  templateUrl: './participation-requests.component.html',
  styleUrls: ['./participation-requests.component.css']
})
export class ParticipationRequestsComponent implements OnInit {
  campaign: Campaign | null = null;
  pendingRequests: ParticipationRequest[] = [];
  loading = true;
  currentUser: User | null = null;
  error: string | null = null;
  processingRequest: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampagneService,
    private authService: AuthService,
    private userService: UserService,
    private modalService: ParticipationModalService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    console.log('ParticipationRequestsComponent initialized');
    console.log('Current user:', this.currentUser);
    console.log('Authentication token available:', !!this.authService.getToken());
    
    // Check if we're properly authenticated
    if (!this.authService.isAuthenticated()) {
      console.error('User is not authenticated!');
      this.error = 'You must be logged in to view participation requests';
      this.loading = false;
      return;
    }
    
    const campaignId = this.route.snapshot.paramMap.get('campaignId');
    console.log('Campaign ID from route:', campaignId);
    
    if (campaignId) {
      this.loadCampaignAndRequests(+campaignId);
    } else {
      this.loading = false;
      this.error = 'Campaign ID not provided';
    }
  }

  get isOwner(): boolean {
    const isAnnonceur = this.currentUser?.role === "ANNONCEUR" || this.currentUser?.userType === "ANNONCEUR";
    
    if (isAnnonceur && this.campaign?.annonceurId) {
      // Convert both IDs to numbers for comparison to avoid type mismatch
      const campaignOwnerId = Number(this.campaign.annonceurId);
      const currentUserId = Number(this.currentUser?.id);
      
      console.log('Ownership check:', {
        'Campaign Owner ID': campaignOwnerId,
        'Current User ID': currentUserId,
        'Campaign Owner ID Type': typeof this.campaign.annonceurId,
        'Current User ID Type': typeof this.currentUser?.id,
        'Is Owner': campaignOwnerId === currentUserId
      });
      
      // This frontend check should now match the backend CampaignSecurityService check
      return campaignOwnerId === currentUserId;
    }
    return false;
  }

  loadCampaignAndRequests(campaignId: number): void {
    this.loading = true;
    this.error = null;

    // Load campaign details first
    this.campaignService.getCampaignById(campaignId).subscribe({
      next: (campaign) => {
        this.campaign = campaign;
        console.log('Campaign loaded:', campaign);
        console.log('Current user:', this.currentUser);
        
        // Check if current user is the owner or an admin
        const isAnnonceur = this.currentUser?.role === "ANNONCEUR" || this.currentUser?.userType === "ANNONCEUR";
        const isAdmin = this.currentUser?.role === "ADMIN" || this.currentUser?.userType === "ADMIN";
        const isOwner = isAnnonceur && campaign.annonceurId === this.currentUser?.id;
        
        console.log(`User is advertiser: ${isAnnonceur}, User is admin: ${isAdmin}, User is owner: ${isOwner}`);
        
        // Check if user is authorized to view requests
        if (!isOwner && !isAdmin) {
          this.error = 'You are not authorized to view participation requests for this campaign';
          this.loading = false;
          
          // Show a more user-friendly error modal
          this.modalService.showError(
            '⚠️ Access Denied',
            'You don\'t have permission to view participation requests for this campaign. Only the campaign owner or administrators can manage participation requests.',
            [
              { label: 'Campaign', value: campaign.nom },
              { label: 'Error', value: 'Insufficient permissions' }
            ]
          );
          return;
        }

        // Load pending requests
        this.loadPendingRequests(campaignId);
      },
      error: (error) => {
        console.error('Error loading campaign:', error);
        this.error = 'Failed to load campaign details';
        this.loading = false;
        
        // Show a more user-friendly error modal
        this.modalService.showError(
          '⚠️ Error Loading Campaign',
          'We encountered an issue loading the campaign details. Please try again later.',
          [
            { label: 'Error', value: 'Unable to fetch campaign information' }
          ]
        );
      }
    });
  }

  loadPendingRequests(campaignId: number): void {
    console.log(`Loading pending requests for campaign ID: ${campaignId}`);
    
    this.campaignService.getPendingParticipationRequests(campaignId).subscribe({
      next: (requests) => {
        console.log('Pending requests loaded successfully:', requests);
        
        // Check each request to see if paneliste data is missing or incomplete
        this.pendingRequests = requests.map(request => {
          // If we have a panelisteId but no paneliste object, or if the paneliste object is empty
          if (request.panelisteId && (!request.paneliste || !request.paneliste.nom)) {
            console.log(`Request ${request.id} has missing panelist data. PanelisteId: ${request.panelisteId}`);
            
            // Check if panelist data is available directly on the request object
            if (request.panelisteNom || request.panelisteEmail) {
              // Create paneliste object from flat properties
              request.paneliste = {
                id: request.panelisteId,
                nom: request.panelisteNom || `Panelist ${request.panelisteId}`,
                email: request.panelisteEmail || 'No email available',
                interets: request.panelisteInterets || []
              };
              console.log(`Created panelist from flat properties for request ${request.id}`, request.paneliste);
            }
            // Try other possible formats
            else if (request.panelist) {
              // If the API returns panelist under a different property name
              request.paneliste = request.panelist;
              console.log(`Found panelist data under 'panelist' property for request ${request.id}`, request.paneliste);
            } else if (request.user) {
              // If the API returns user data instead of panelist
              request.paneliste = {
                id: request.user.id,
                nom: request.user.nom || request.user.name || request.user.username,
                email: request.user.email,
                interets: request.user.interets || request.user.interests || []
              };
              console.log(`Created panelist from user data for request ${request.id}`, request.paneliste);
            }
          }
          
          // Ensure the dateParticipation is a valid date
          if (request.dateParticipation) {
            try {
              // Try to parse the date if it's a string
              const date = new Date(request.dateParticipation);
              if (!isNaN(date.getTime())) {
                request.dateParticipation = date;
              }
            } catch (e) {
              console.warn(`Invalid date format for request ${request.id}:`, e);
            }
          } else if (request.createdAt) {
            // Use createdAt as fallback if dateParticipation is missing
            request.dateParticipation = new Date(request.createdAt);
            console.log(`Using createdAt as fallback date for request ${request.id}`);
          } else if (request.date || request.requestDate) {
            // Check other possible date properties
            request.dateParticipation = new Date(request.date || request.requestDate);
            console.log(`Using alternate date property for request ${request.id}`);
          } else {
            // Set current date as last resort
            console.warn(`No date found for request ${request.id}, using current date as fallback`);
            request.dateParticipation = new Date();
          }
          
          return request;
        });
        
        this.loading = false;
        console.log('Processed pending requests:', this.pendingRequests);
      },
      error: (error) => {
        console.error('Error loading pending requests:', error);
        this.loading = false;
        
        // Check specific error status codes
        if (error.status === 403) {
          this.error = 'You don\'t have permission to view participation requests for this campaign';
          
          // Show permission error modal
          this.modalService.showError(
            '⚠️ Permission Denied',
            'You don\'t have sufficient permissions to access the participation requests for this campaign. Only the campaign owner or administrators can manage requests.',
            [
              { label: 'Campaign', value: this.campaign?.nom || 'Unknown' },
              { label: 'Error Code', value: '403 Forbidden' },
              { label: 'Solution', value: 'Contact an administrator if you believe this is an error' }
            ]
          );
        } else {
          this.error = 'Failed to load participation requests. Please try again later.';
          
          // Show general error modal
          this.modalService.showError(
            '⚠️ Request Failed',
            'There was a problem loading the participation requests. This could be due to a network issue or server problem.',
            [
              { label: 'Error', value: error.message || 'Unknown error' },
              { label: 'Suggestion', value: 'Try refreshing the page or come back later' }
            ]
          );
        }
      }
    });
  }

  approveRequest(request: ParticipationRequest): void {
    if (!this.campaign) return;
    
    // Check if we have panelist data in any form (either in paneliste object or as flat properties)
    if (!request.paneliste && !request.panelisteNom && !request.panelisteEmail) {
      console.warn(`Cannot approve request ${request.id} - no panelist data available`);
      this.modalService.showError(
        '⚠️ Cannot Process Request',
        'This participation request is missing essential panelist data and cannot be processed.',
        [
          { label: 'Request ID', value: request.id.toString() },
          { label: 'Panelist ID', value: request.panelisteId?.toString() || 'Unknown' },
          { label: 'Campaign', value: this.campaign?.nom || 'N/A' },
        ]
      );
      return;
    }

    this.processingRequest = request.id;
    console.log(`Approving request ID ${request.id} for panelist ${request.panelisteId} in campaign ${this.campaign.id}`);
    
    this.campaignService.approveParticipationRequest(this.campaign.id, request.panelisteId).subscribe({
      next: (response) => {
        console.log('Approval successful:', response);
        
        // Remove from pending requests
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== request.id);
        this.processingRequest = null;
        
        // Get panelist information - either from the paneliste object or from flat properties
        const panelistName = request.paneliste?.nom || request.panelisteNom || `Panelist ${request.panelisteId}`;
        const panelistEmail = request.paneliste?.email || request.panelisteEmail || 'No email available';
        
        // Show success modal
        this.modalService.showParticipationApproved(
          panelistName,
          this.campaign?.nom || 'N/A',
          panelistEmail
        );
      },
      error: (error) => {
        console.error('Error approving request:', error);
        this.processingRequest = null;
        
        // Determine specific error message based on status code
        let errorMessage = 'There was an issue approving the participation request. Please try again.';
        let errorDetails = 'Network or server error occurred';
        
        if (error.status === 400) {
          errorMessage = 'The server could not process this request due to invalid data format.';
          errorDetails = 'Bad Request (Error 400): ' + (error.error?.message || 'Invalid request format');
          
          // Log detailed information about the error for debugging
          console.error('Bad Request Details:', {
            errorBody: error.error,
            request: {
              campaignId: this.campaign?.id,
              panelisteId: request.panelisteId,
              requestObject: request
            }
          });
        } else if (error.status === 403) {
          errorMessage = 'You don\'t have permission to approve participation requests for this campaign.';
          errorDetails = 'Insufficient permissions (Error 403)';
        } else if (error.status === 404) {
          errorMessage = 'The participation request could not be found. It may have been deleted or already processed.';
          errorDetails = 'Request not found (Error 404)';
        } else if (error.status === 409) {
          errorMessage = 'This request has already been processed by another user.';
          errorDetails = 'Request conflict (Error 409)';
        }
        
        // Show error modal with more specific information
        this.modalService.showError(
          '⚠️ Approval Failed',
          errorMessage,
          [
            { label: 'Panelist', value: request.paneliste?.nom || 'Unknown' },
            { label: 'Campaign', value: this.campaign?.nom || 'N/A' },
            { label: 'Error', value: errorDetails }
          ]
        );
      }
    });
  }

  rejectRequest(request: ParticipationRequest): void {
    if (!this.campaign) return;
    
    // Check if we have panelist data in any form (either in paneliste object or as flat properties)
    if (!request.paneliste && !request.panelisteNom && !request.panelisteEmail) {
      console.warn(`Cannot reject request ${request.id} - no panelist data available`);
      this.modalService.showError(
        '⚠️ Cannot Process Request',
        'This participation request is missing essential panelist data and cannot be processed.',
        [
          { label: 'Request ID', value: request.id.toString() },
          { label: 'Panelist ID', value: request.panelisteId?.toString() || 'Unknown' },
          { label: 'Campaign', value: this.campaign?.nom || 'N/A' },
        ]
      );
      return;
    }

    this.processingRequest = request.id;
    console.log(`Rejecting request ID ${request.id} for panelist ${request.panelisteId} in campaign ${this.campaign.id}`);
    
    this.campaignService.rejectParticipationRequest(this.campaign.id, request.panelisteId).subscribe({
      next: (response) => {
        console.log('Rejection successful:', response);
        
        // Remove from pending requests
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== request.id);
        this.processingRequest = null;
        
        // Get panelist information - either from the paneliste object or from flat properties
        const panelistName = request.paneliste?.nom || request.panelisteNom || `Panelist ${request.panelisteId}`;
        const panelistEmail = request.paneliste?.email || request.panelisteEmail || 'No email available';
        
        // Show rejection modal
        this.modalService.showParticipationRejected(
          panelistName,
          this.campaign?.nom || 'N/A',
          panelistEmail
        );
      },
      error: (error) => {
        console.error('Error rejecting request:', error);
        this.processingRequest = null;
        
        // Determine specific error message based on status code
        let errorMessage = 'There was an issue declining the participation request. Please try again.';
        let errorDetails = 'Network or server error occurred';
        
        if (error.status === 403) {
          errorMessage = 'You don\'t have permission to decline participation requests for this campaign.';
          errorDetails = 'Insufficient permissions (Error 403)';
        } else if (error.status === 404) {
          errorMessage = 'The participation request could not be found. It may have been deleted or already processed.';
          errorDetails = 'Request not found (Error 404)';
        } else if (error.status === 409) {
          errorMessage = 'This request has already been processed by another user.';
          errorDetails = 'Request conflict (Error 409)';
        }
        
        // Show error modal with more specific information
        this.modalService.showError(
          '⚠️ Rejection Failed',
          errorMessage,
          [
            { label: 'Panelist', value: request.paneliste?.nom || 'Unknown' },
            { label: 'Campaign', value: this.campaign?.nom || 'N/A' },
            { label: 'Error', value: errorDetails }
          ]
        );
      }
    });
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    
    try {
      const dateObj = new Date(date);
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date format:', date);
        return date.toString();
      }
      
      return dateObj.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return date.toString();
    }
  }

  formatInterests(interests: string[] | undefined): string {
    if (!interests || interests.length === 0) return 'None specified';
    return interests.join(', ');
  }

  goBackToCampaign(): void {
    if (this.campaign) {
      this.router.navigate(['/campaigns', this.campaign.id]);
    } else {
      this.router.navigate(['/campaigns']);
    }
  }


} 
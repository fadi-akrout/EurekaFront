import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import {  ActivatedRoute,  Router, RouterLink } from "@angular/router"
import   { CampagneService } from "../../../Services/campagne.service"
import  { FeedbackService } from "../../../Services/feedback.service"
import  { UserService } from "../../../Services/user.service"
import  { AuthService } from "../../../Services/auth.service"
import  { ParticipationModalService } from "../../../Services/participation-modal.service"
import  { ParticipationModalComponent } from "../../shared/participation-modal/participation-modal.component"
import  { Campaign, Feedback } from "../../../models/campagne.model"
import  { User } from "../../../models/utilisateur.model"
import  { PanelisteCampagne, PanelisteCampagneStatut } from "../../../models/paneliste-campagne.model"

@Component({
  selector: 'app-campagne-detail',
  standalone: true,
  imports:  [CommonModule, RouterLink, ParticipationModalComponent],
  templateUrl: './campagne-detail.component.html',
  styleUrl: './campagne-detail.component.css'
})
export class CampagneDetailComponent implements OnInit {
  campaign: Campaign | null = null
  feedbacks: Feedback[] = []
  loading = true
  currentUser: User | null = null
  participationStatus: PanelisteCampagneStatut | null = null
  loadingParticipation = false

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampagneService,
    private feedbackService: FeedbackService,
    private userService: UserService,
    private authService: AuthService,
    private modalService: ParticipationModalService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue
    console.log('Current user on init:', this.currentUser);

    const id = this.route.snapshot.paramMap.get("id")
    if (id) {
      this.loadCampaign(+id)
      
      // If user is a panelist, always try to load participation status directly
      if (this.isPanelist && this.currentUser?.id) {
        console.log('Directly loading participation status for panelist');
        this.loadParticipationStatus(+id, this.currentUser.id);
      }
    } else {
      this.loading = false
    }
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === "ADMIN" || this.currentUser?.userType === "ADMIN"
  }

  // Check if the user is an advertiser (any advertiser)
  get isAdvertiser(): boolean {
    return this.currentUser?.role === "ANNONCEUR" || this.currentUser?.userType === "ANNONCEUR";
  }
  
  // Check if the user is the owner of this campaign
  get isOwner(): boolean {
    console.log('Checking campaign ownership:');
    console.log('Current user:', this.currentUser);
    console.log('Campaign:', this.campaign);
    
    const isAnnonceur = this.currentUser?.role === "ANNONCEUR" || this.currentUser?.userType === "ANNONCEUR";
    
    if (isAnnonceur && this.campaign?.annonceurId) {
      const isOwner = this.campaign.annonceurId === this.currentUser?.id;
      console.log(`User ${this.currentUser?.id} is owner of campaign ${this.campaign.id}: ${isOwner}`);
      console.log(`Campaign annonceurId: ${this.campaign.annonceurId}, User ID: ${this.currentUser?.id}`);
      return isOwner;
    } else if (isAnnonceur && !this.campaign?.annonceurId) {
      // If annonceurId is missing, log this situation
      console.log('Campaign has no annonceurId:', this.campaign);
      // This campaign has no owner, so the current user is not the owner
      return false;
    }
    return false;
  }

  get isPanelist(): boolean {
    return this.currentUser?.role === "PANELISTE" || this.currentUser?.userType === "PANELISTE"
  }
  
  // Check if the current panelist is participating in this campaign
  get isPanelistParticipating(): boolean {
    return this.participationStatus === PanelisteCampagneStatut.ACCEPTE || 
           this.participationStatus === PanelisteCampagneStatut.EN_COURS ||
           this.participationStatus === PanelisteCampagneStatut.COMPLETE;
  }

  // Check if participation request is pending
  get isParticipationPending(): boolean {
    return this.participationStatus === PanelisteCampagneStatut.PENDING;
  }

  // Check if participation was rejected
  get isParticipationRejected(): boolean {
    return this.participationStatus === PanelisteCampagneStatut.REFUSE;
  }

  // Check if panelist can request participation
  get canRequestParticipation(): boolean {
    // Make sure we don't show the button if there's any participation status
    const hasNoParticipation = this.participationStatus === null || this.participationStatus === undefined;
    
    // Only show the button if:
    // 1. User is a panelist
    // 2. Campaign is active
    // 3. User has no existing relationship with the campaign
    return this.isPanelist && 
           this.campaign?.statut === 'ACTIVE' && 
           hasNoParticipation;
  }

  // Get participation status display text
  get participationStatusText(): string {
    switch (this.participationStatus) {
      case PanelisteCampagneStatut.PENDING:
        return 'Your participation request is under review';
      case PanelisteCampagneStatut.ACCEPTE:
        return 'Your participation has been approved';
      case PanelisteCampagneStatut.REFUSE:
        return 'Your participation request was rejected';
      case PanelisteCampagneStatut.EN_COURS:
        return 'You are currently participating in this campaign';
      case PanelisteCampagneStatut.COMPLETE:
        return 'You have completed this campaign';
      default:
        return '';
    }
  }
  
  // Method to load participation status for a panelist
  loadParticipationStatus(campaignId: number, panelisteId: number): void {
    console.log(`Loading participation status for panelist ${panelisteId} in campaign ${campaignId}`);
    this.campaignService.getParticipationStatus(campaignId, panelisteId).subscribe({
      next: (status) => {
        this.participationStatus = status?.statut || null;
        console.log('Participation status loaded:', this.participationStatus);
        
        // If we just determined the user is already participating or has a request,
        // update the UI immediately by forcing change detection
        if (this.participationStatus) {
          console.log(`User has participation status: ${this.participationStatus}`);
        }
      },
      error: (error) => {
        console.log('No participation status found or error:', error);
        this.participationStatus = null;
      }
    });
  }

  // Method to request participation in a campaign
  requestParticipation(): void {
    if (!this.campaign || !this.currentUser) return;
    
    // Check if the panelist is already related to the campaign or has a pending request
    if (this.participationStatus) {
      // Show appropriate message based on participation status
      let title, message;
      
      switch (this.participationStatus) {
        case PanelisteCampagneStatut.PENDING:
          title = '⏳ Request Already Submitted';
          message = 'You have already submitted a request to join this campaign. Your request is currently under review.';
          break;
        case PanelisteCampagneStatut.ACCEPTE:
          title = '✅ Already Participating';
          message = 'You are already approved to participate in this campaign.';
          break;
        case PanelisteCampagneStatut.EN_COURS:
          title = '🔄 Currently Participating';
          message = 'You are currently participating in this campaign.';
          break;
        case PanelisteCampagneStatut.COMPLETE:
          title = '🏁 Campaign Completed';
          message = 'You have already completed this campaign.';
          break;
        case PanelisteCampagneStatut.REFUSE:
          title = '❌ Previous Request Rejected';
          message = 'Your previous request was rejected. Submitting a new request...';
          
          // For rejected status, allow them to reapply
          this.submitParticipationRequest();
          return;
        default:
          title = 'ℹ️ Campaign Status';
          message = 'You are already related to this campaign.';
      }
      
      // Show the modal with the appropriate message
      this.modalService.showInfo(
        title,
        message,
        [
          { label: 'Campaign', value: this.campaign?.nom || 'Campaign' },
          { label: 'Status', value: this.participationStatusText }
        ]
      );
      
      return;
    }
    
    // If no existing relationship, proceed with the participation request
    this.submitParticipationRequest();
  }
  
  // Helper method to submit the actual participation request
  private submitParticipationRequest(): void {
    if (!this.campaign || !this.currentUser) return;
    
    this.loadingParticipation = true;
    this.campaignService.requestParticipation(this.campaign.id, this.currentUser.id).subscribe({
      next: () => {
        console.log(`Panelist ${this.currentUser?.id} requested participation in campaign ${this.campaign?.id}`);
        this.participationStatus = PanelisteCampagneStatut.PENDING;
        this.loadingParticipation = false;
        
        // Show beautiful success modal with enhanced details
        this.modalService.showCampaignJoinConfirmation(
          this.campaign?.nom || 'Campaign',
          this.currentUser?.nom || 'User',
          this.currentUser?.email || 'N/A'
        );
      },
      error: (error) => {
        console.error('Error requesting participation:', error);
        this.loadingParticipation = false;
        
        // Check if this is a duplicate participation error
        if (error?.error?.message?.includes('already') || 
            error?.error?.includes('already') || 
            error?.status === 409) {
          // This is likely a case where the panelist is already related to this campaign
          // Reload participation status to get the current state
          if (this.currentUser?.id && this.campaign?.id) {
            this.loadParticipationStatus(this.campaign.id, this.currentUser.id);
          }
          
          // Show friendly message that they're already participating
          this.modalService.showInfo(
            '👋 Already Participating',
            'You are already participating or have a pending request for this campaign.',
            [
              { label: 'Campaign', value: this.campaign?.nom || 'Campaign' },
              { label: 'Note', value: 'No need to request again' }
            ]
          );
        } else {
          // Show generic error modal for other errors
          this.modalService.showError(
            '⚠️ Request Failed',
            'There was an issue submitting your participation request. Please try again later.',
            [
              { label: 'Campaign', value: this.campaign?.nom || 'N/A' },
              { label: 'Error', value: 'Network or server error occurred' }
            ]
          );
        }
      }
    });
  }

  // Legacy method - keeping for backward compatibility
  participateInCampaign(): void {
    this.requestParticipation();
  }

  loadCampaign(id: number): void {
    console.log('Loading campaign with ID:', id);
    console.log('Current user:', this.currentUser);
    
    this.campaignService.getCampaignById(id).subscribe({
      next: (campaign) => {
        console.log('Campaign loaded:', campaign);
        
        this.campaign = campaign;
        this.loadFeedbacks(id);
        
        // Always load participation status if user is a panelist, even if we loaded it before
        // This ensures we have the latest status after any campaign data is loaded
        if (this.isPanelist && this.currentUser?.id) {
          console.log('Loading participation status after campaign load');
          this.loadParticipationStatus(id, this.currentUser.id);
        }
      },
      error: (err) => {
        console.error('Error loading campaign:', err);
        this.loading = false;
      },
    });
  }

  loadFeedbacks(campaignId: number): void {
    this.feedbackService.getFeedbacksByCampaign(campaignId).subscribe({
      next: (feedbacks) => {
        this.feedbacks = feedbacks
        this.loading = false
      },
      error: () => {
        this.loading = false
      },
    })
  }

  startCampaign(): void {
    if (!this.campaign) return;
    
    // Check if the user is authorized to start this campaign
    if (!this.isAdmin && !this.isOwner) {
      console.log(`User ${this.currentUser?.id} is not authorized to start campaign ${this.campaign.id}`);
      alert('You are not authorized to start this campaign. Only the campaign owner can start it.');
      return;
    }
    
    this.campaignService.startCampaign(this.campaign.id).subscribe({
      next: () => {
        this.campaign!.statut = "ACTIVE"
        this.campaign!.dateDebut = new Date()
      },
      error: (error) => {
        console.error('Error starting campaign:', error);
        alert('Failed to start campaign. Please try again later.');
      }
    })
  }

  endCampaign(): void {
    if (!this.campaign) return;
    
    // Check if the user is authorized to end this campaign
    if (!this.isAdmin && !this.isOwner) {
      console.log(`User ${this.currentUser?.id} is not authorized to end campaign ${this.campaign.id}`);
      alert('You are not authorized to end this campaign. Only the campaign owner can end it.');
      return;
    }
    
    this.campaignService.endCampaign(this.campaign.id).subscribe({
      next: () => {
        this.campaign!.statut = "TERMINEE"
        this.campaign!.dateFin = new Date()
      },
      error: (error) => {
        console.error('Error ending campaign:', error);
        alert('Failed to end campaign. Please try again later.');
      }
    })
  }

  generateAnalysis(): void {
    if (!this.campaign) return;
    
    // Check if the user is authorized to generate analysis for this campaign
    if (!this.isAdmin && !this.isOwner) {
      console.log(`User ${this.currentUser?.id} is not authorized to generate analysis for campaign ${this.campaign.id}`);
      alert('You are not authorized to generate analysis for this campaign. Only the campaign owner can generate analysis.');
      return;
    }
    
    // Assuming there's an endpoint to generate analysis
    // This would typically be in a service like ResultatAnalyseService
    // For now, we'll simulate it with a timeout
    setTimeout(() => {
      this.loadCampaign(this.campaign!.id)
    }, 1000)
  }
  
  deleteCampaign(): void {
    if (!this.campaign) return;
    
    // Check if the user is authorized to delete this campaign
    if (!this.isAdmin && !this.isOwner) {
      console.log(`User ${this.currentUser?.id} is not authorized to delete campaign ${this.campaign.id}`);
      alert('You are not authorized to delete this campaign. Only the campaign owner can delete it.');
      return;
    }
    
    if (confirm(`Are you sure you want to delete the campaign "${this.campaign.nom}"? This action cannot be undone.`)) {
      this.campaignService.deleteCampaign(this.campaign.id).subscribe({
        next: () => {
          // Navigate back to campaigns list after successful deletion
          this.router.navigate(['/campaigns']);
        },
        error: (error) => {
          console.error('Error deleting campaign:', error);
          alert('Failed to delete campaign. Please try again later.');
        }
      });
    }
  }
  
  editCampaign(): void {
    if (!this.campaign) return;
    
    // Check if the user is authorized to edit this campaign
    if (!this.isAdmin && !this.isOwner) {
      console.log(`User ${this.currentUser?.id} is not authorized to edit campaign ${this.campaign.id}`);
      alert('You are not authorized to edit this campaign. Only the campaign owner can edit it.');
      return;
    }
    
    console.log(`Navigating to edit campaign ${this.campaign.id}`);
    this.router.navigate(['/campaigns', this.campaign.id, 'edit']);
  }
}

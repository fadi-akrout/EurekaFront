import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FeedbackService } from '../../../Services/feedback.service';
import { CampagneService } from '../../../Services/campagne.service';
import { AuthService } from '../../../Services/auth.service';
import { Campaign } from '../../../models/campagne.model';
import { User } from '../../../models/utilisateur.model';

@Component({
  selector: 'app-feedback-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './feedback-form.component.html',
  styleUrl: './feedback-form.component.css'
})
export class FeedbackFormComponent implements OnInit {
  campaignId: number | null = null;
  campaign: Campaign | null = null;
  currentUser: User | null = null;
  loading = true;
  submitting = false;
  
  feedback = {
    note: 5,
    commentaire: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private feedbackService: FeedbackService,
    private campaignService: CampagneService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    
    // Check if user is a panelist
    if (!this.isPanelist()) {
      alert('Only panelists can provide feedback.');
      this.router.navigate(['/dashboard']);
      return;
    }
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.campaignId = +id;
      this.loadCampaign(this.campaignId);
    } else {
      this.loading = false;
      this.router.navigate(['/campaigns']);
    }
  }
  
  isPanelist(): boolean {
    return this.currentUser?.role === 'PANELISTE' || this.currentUser?.userType === 'PANELISTE';
  }
  
  loadCampaign(id: number): void {
    this.campaignService.getCampaignById(id).subscribe({
      next: (campaign) => {
        this.campaign = campaign;
        
        // Check if campaign is active
        if (campaign.statut !== 'ACTIVE') {
          alert('You can only provide feedback for active campaigns.');
          this.router.navigate(['/campaigns', id]);
          return;
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading campaign:', error);
        this.loading = false;
        this.router.navigate(['/campaigns']);
      }
    });
  }
  
  submitFeedback(): void {
    if (!this.campaignId || !this.currentUser || !this.campaign) {
      return;
    }
    
    if (!this.feedback.commentaire.trim()) {
      alert('Please provide a comment with your feedback.');
      return;
    }
    
    this.submitting = true;
    
    const feedbackData = {
      id: 0, // The backend will assign the actual ID
      note: this.feedback.note,
      commentaire: this.feedback.commentaire,
      date: new Date(),
      paneliste: this.currentUser.id,
      campagne: this.campaignId
    };
    
    this.feedbackService.createFeedback(feedbackData).subscribe({
      next: () => {
        this.submitting = false;
        alert('Thank you for your feedback!');
        this.router.navigate(['/campaigns', this.campaignId]);
      },
      error: (error) => {
        console.error('Error submitting feedback:', error);
        this.submitting = false;
        alert('Failed to submit feedback. Please try again later.');
      }
    });
  }
}
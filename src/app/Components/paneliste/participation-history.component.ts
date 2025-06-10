import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../Services/user.service';
import { AuthService } from '../../Services/auth.service';
import { Campaign } from '../../models/campagne.model';

@Component({
  selector: 'app-participation-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './participation-history.component.html',
  styleUrls: ['./participation-history.component.css']
})
export class ParticipationHistoryComponent implements OnInit {
  participatingCampaigns: Campaign[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadParticipationHistory();
  }

  loadParticipationHistory(): void {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      this.error = 'User not authenticated';
      this.isLoading = false;
      return;
    }

    this.userService.getPanelisteCampaigns(currentUser.id).subscribe({
      next: (campaigns) => {
        this.participatingCampaigns = campaigns;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading participation history:', error);
        this.error = 'Failed to load your campaign history. Please try again later.';
        this.isLoading = false;
      }
    });
  }
  
  // Helper methods for template
  getActiveCampaignsCount(): number {
    return this.participatingCampaigns.filter(c => c.statut === 'ACTIVE').length;
  }
  
  getCompletedCampaignsCount(): number {
    return this.participatingCampaigns.filter(c => c.statut === 'TERMINEE').length;
  }
}
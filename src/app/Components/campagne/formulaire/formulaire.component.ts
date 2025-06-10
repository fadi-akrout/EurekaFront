import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CampagneService } from '../../../Services/campagne.service';
import { AuthService } from '../../../Services/auth.service';
import { Campaign } from '../../../models/campagne.model';
import { User } from '../../../models/utilisateur.model';

@Component({
  selector: 'app-formulaire',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './formulaire.component.html',
  styleUrls: ['./formulaire.component.css']
})
export class FormulaireComponent implements OnInit {
  campaignId: number | null = null;
  campaign: Campaign | null = null;
  currentUser: User | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampagneService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.campaignId = +id;
      this.loadCampaign(this.campaignId);
    } else {
      this.loading = false;
      this.router.navigate(['/campaigns']);
    }
  }

  loadCampaign(id: number): void {
    this.campaignService.getCampaignById(id).subscribe({
      next: (campaign) => {
        this.campaign = campaign;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/campaigns']);
      }
    });
  }

  // Add form submission and other methods as needed
}
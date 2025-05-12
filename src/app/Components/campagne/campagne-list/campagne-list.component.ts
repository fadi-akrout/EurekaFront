import { Component, OnInit } from '@angular/core';
import { Campaign } from '../../../models/campagne.model';
import { User } from '../../../models/utilisateur.model';
import { CommonModule } from "@angular/common"
import { RouterLink } from "@angular/router"
import { FormsModule } from "@angular/forms"
import  { CampagneService } from "../../../Services/campagne.service"
@Component({
  selector: 'app-campagne-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './campagne-list.component.html',
  styleUrl: './campagne-list.component.css'
})
export class CampagneListComponent implements OnInit {
  campaigns: Campaign[] = []
  filteredCampaigns: Campaign[] = []
  searchTerm = ""
  statusFilter = "ALL"
  currentUser: User | null = null

  constructor(
    private campaignService: CampagneService,
   // private authService: AuthService,
  ) {}

  ngOnInit(): void {
    //this.currentUser = this.authService.getCurrentUser()
    this.loadCampaigns()
  }

  get isAdvertiser(): boolean {
    return this.currentUser?.role === "ANNONCEUR"
  }

  loadCampaigns(): void {
    this.campaignService.getAllCampaigns().subscribe((campaigns) => {
      this.campaigns = campaigns
      this.filterCampaigns()
    })
  }

  filterCampaigns(): void {
    this.filteredCampaigns = this.campaigns.filter((campaign) => {
      // Filter by search term
      const matchesSearch =
        campaign.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(this.searchTerm.toLowerCase())

      // Filter by status
      const matchesStatus = this.statusFilter === "ALL" || campaign.statut === this.statusFilter

      return matchesSearch && matchesStatus
    })
  }
}
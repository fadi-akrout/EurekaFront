import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import {  ActivatedRoute,  Router, RouterLink } from "@angular/router"
import   { CampagneService } from "../../../Services/campagne.service"
import  { FeedbackService } from "../../../Services/feedback.service"
import  { UserService } from "../../../Services/user.service"
//import  { AuthService } from "../../../services/auth.service"
import  { Campaign, Feedback } from "../../../models/campagne.model"
import  { User } from "../../../models/utilisateur.model"

@Component({
  selector: 'app-campagne-detail',
  standalone: true,
  imports:  [CommonModule, RouterLink],
  templateUrl: './campagne-detail.component.html',
  styleUrl: './campagne-detail.component.css'
})
export class CampagneDetailComponent implements OnInit {
  campaign: Campaign | null = null
  feedbacks: Feedback[] = []
  loading = true
  currentUser: User | null = null

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampagneService,
    private feedbackService: FeedbackService,
    private userService: UserService,
   // private authService: AuthService,
  ) {}

  ngOnInit(): void {
   // this.currentUser = this.authService.getCurrentUser()

    const id = this.route.snapshot.paramMap.get("id")
    if (id) {
      this.loadCampaign(+id)
    } else {
      this.loading = false
    }
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === "ADMIN"
  }

  get isAdvertiser(): boolean {
    return this.currentUser?.role === "ANNONCEUR" && this.campaign?.annonceur === this.currentUser.id
  }

  get isPanelist(): boolean {
    return this.currentUser?.role === "PANELISTE"
  }

  loadCampaign(id: number): void {
    this.campaignService.getCampaignById(id).subscribe({
      next: (campaign) => {
        this.campaign = campaign
        this.loadFeedbacks(id)
      },
      error: () => {
        this.loading = false
      },
    })
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
    if (this.campaign) {
      this.campaignService.startCampaign(this.campaign.id).subscribe({
        next: () => {
          this.campaign!.statut = "ACTIVE"
          this.campaign!.dateDebut = new Date()
        },
      })
    }
  }

  endCampaign(): void {
    if (this.campaign) {
      this.campaignService.endCampaign(this.campaign.id).subscribe({
        next: () => {
          this.campaign!.statut = "TERMINEE"
          this.campaign!.dateFin = new Date()
        },
      })
    }
  }

  generateAnalysis(): void {
    if (this.campaign) {
      // Assuming there's an endpoint to generate analysis
      // This would typically be in a service like ResultatAnalyseService
      // For now, we'll simulate it with a timeout
      setTimeout(() => {
        this.loadCampaign(this.campaign!.id)
      }, 1000)
    }
  }
}

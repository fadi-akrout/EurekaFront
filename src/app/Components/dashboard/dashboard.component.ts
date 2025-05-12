import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterLink } from "@angular/router"
//import  { AuthService } from "../../services/auth.service"
import  { CampagneService } from "../../Services/campagne.service"
import  { UserService } from "../../Services/user.service"
import  { Campaign } from "../../models/campagne.model"
import  { User } from "../../models/utilisateur.model"

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule ,RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null
  activeCampaigns: Campaign[] = []
  myCampaigns: Campaign[] = []
  participatingCampaigns: Campaign[] = []
  recentCampaigns: Campaign[] = []
  totalUsers = 0

  constructor(
   // private authService: AuthService,
    private CampagneService: CampagneService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
  //  this.currentUser = this.authService.getCurrentUser()
    this.loadDashboardData()
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === "ADMIN"
  }

  get isAdvertiser(): boolean {
    return this.currentUser?.role === "ANNONCEUR"
  }

  get isPanelist(): boolean {
    return this.currentUser?.role === "PANELISTE"
  }

  loadDashboardData(): void {
    // Load active campaigns
    this.CampagneService.getActiveCampaigns().subscribe((campaigns) => {
      this.activeCampaigns = campaigns
      this.recentCampaigns = campaigns.slice(0, 5)
    })

    // Load user-specific data
    if (this.isAdvertiser && this.currentUser) {
      this.CampagneService.getAllCampaigns().subscribe((campaigns) => {
        this.myCampaigns = campaigns.filter((c) => c.annonceur === this.currentUser?.id)
      })
    }

    if (this.isPanelist && this.currentUser) {
      this.userService.getPanelisteCampaigns(this.currentUser.id).subscribe((campaigns) => {
        this.participatingCampaigns = campaigns
      })
    }

    if (this.isAdmin) {
      this.userService.getAllUsers().subscribe((users) => {
        this.totalUsers = users.length
      })
    }
  }
}

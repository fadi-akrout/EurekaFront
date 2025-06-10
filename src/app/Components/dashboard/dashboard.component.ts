import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterLink } from "@angular/router"
import { AuthService } from "../../Services/auth.service"
import { CampagneService } from "../../Services/campagne.service"
import { UserService } from "../../Services/user.service"
import { Campaign } from "../../models/campagne.model"
import { User } from "../../models/utilisateur.model"

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
    private authService: AuthService,
    private CampagneService: CampagneService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    console.log("Dashboard initialized with user:", this.currentUser);
    console.log("User role:", this.currentUser?.role);
    console.log("User userType:", this.currentUser?.userType);
    console.log("Is admin (service):", this.authService.isAdmin());
    console.log("Is authenticated:", this.authService.isAuthenticated());
    console.log("Current token:", this.authService.getToken()?.substring(0, 20) + '...');
    this.loadDashboardData();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin()
  }

  get isAdvertiser(): boolean {
    return this.authService.isAnnonceur()
  }

  get isPanelist(): boolean {
    return this.authService.isPaneliste()
  }

  loadDashboardData(): void {
    console.log("Loading dashboard data for user role:", this.currentUser?.role);
    
    // Load active campaigns
    this.CampagneService.getActiveCampaigns().subscribe({
      next: (campaigns) => {
        console.log("Active campaigns loaded:", campaigns.length);
        this.activeCampaigns = campaigns;
        
        // For regular users, show all active campaigns in the recent list
        if (!this.isAdvertiser && !this.isAdmin) {
          this.recentCampaigns = campaigns.slice(0, 5);
        }
      },
      error: (error) => console.error("Error loading active campaigns:", error)
    });

    // Load user-specific data
    if (this.isAdvertiser && this.currentUser) {
      console.log("Loading campaigns for advertiser ID:", this.currentUser.id);
      
      this.CampagneService.getAllCampaigns().subscribe({
        next: (campaigns) => {
          console.log("All campaigns loaded:", campaigns.length);
          
          // Filter campaigns to show only those owned by the current user
          this.myCampaigns = campaigns.filter(c => {
            const isOwner = c.annonceurId === this.currentUser?.id;
            console.log(`Campaign ${c.id} (${c.nom}) - Owner ID: ${c.annonceurId}, Current user ID: ${this.currentUser?.id}, Is owner: ${isOwner}`);
            return isOwner;
          });
          
          console.log("My campaigns filtered:", this.myCampaigns.length);
          
          // For advertisers, show their own campaigns in the recent list
          this.recentCampaigns = this.myCampaigns.slice(0, 5);
        },
        error: (error) => console.error("Error loading all campaigns:", error)
      });
    }

    if (this.isPanelist && this.currentUser) {
      console.log("Loading campaigns for panelist ID:", this.currentUser.id);
      
      this.userService.getPanelisteCampaigns(this.currentUser.id).subscribe({
        next: (campaigns) => {
          console.log("Participating campaigns loaded:", campaigns.length);
          this.participatingCampaigns = campaigns;
        },
        error: (error) => console.error("Error loading panelist campaigns:", error)
      });
    }

    if (this.isAdmin) {
      console.log("Loading admin data");
      console.log("Admin check - Current user role:", this.currentUser?.role);
      console.log("Admin check - Current user userType:", this.currentUser?.userType);
      console.log("Admin check - AuthService.isAdmin():", this.authService.isAdmin());
      
      // For admins, show all campaigns in the recent list
      this.CampagneService.getAllCampaigns().subscribe({
        next: (campaigns) => {
          console.log("All campaigns loaded for admin:", campaigns.length);
          this.recentCampaigns = campaigns.slice(0, 5);
        },
        error: (error) => console.error("Error loading all campaigns for admin:", error)
      });
      
      // Add a small delay to ensure token is properly set
      setTimeout(() => {
        console.log("About to call getAllUsers...");
        console.log("Token before call:", this.authService.getToken()?.substring(0, 20) + '...');
        
        this.userService.getAllUsers().subscribe({
          next: (users) => {
            console.log("All users loaded:", users.length);
            this.totalUsers = users.length;
          },
          error: (error) => {
            console.error("Error loading all users:", error);
            console.error("Error status:", error.status);
            console.error("Error message:", error.message);
            console.error("Error details:", error.error);
            console.error("Current user when error occurred:", this.currentUser);
            console.error("Current token when error occurred:", this.authService.getToken()?.substring(0, 20) + '...');
            
            // Try to make a simple test call to see if it's a general auth issue
            console.log("Testing with a different endpoint...");
            this.CampagneService.getAllCampaigns().subscribe({
              next: (campaigns) => {
                console.log("Test call to campaigns successful - auth is working");
              },
              error: (testError) => {
                console.error("Test call to campaigns also failed:", testError);
              }
            });
          }
        });
      }, 200);
    }
  }
}

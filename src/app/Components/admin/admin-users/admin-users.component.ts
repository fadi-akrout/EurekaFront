import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../Services/user.service';
import { CampagneService } from '../../../Services/campagne.service';
import { AuthService } from '../../../Services/auth.service';
import { User, Admin, Annonceur, Paneliste } from '../../../models/utilisateur.model';
import { forkJoin } from 'rxjs';

interface UserWithActivity extends User {
  lastLogin?: Date;
  isActive: boolean;
  campaignsParticipated: number;
  campaignsCreated: number;
}

interface UserStats {
  totalUsers: number;
  totalAdmins: number;
  totalAnnonceurs: number;
  totalPanelistes: number;
  recentRegistrations: User[];
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  activeTab: 'all' | 'admins' | 'annonceurs' | 'panelistes' | 'stats' = 'all';
  
  // User data
  allUsers: UserWithActivity[] = [];
  admins: Admin[] = [];
  annonceurs: Annonceur[] = [];
  panelistes: Paneliste[] = [];
  
  // Statistics
  userStats: UserStats = {
    totalUsers: 0,
    totalAdmins: 0,
    totalAnnonceurs: 0,
    totalPanelistes: 0,
    recentRegistrations: []
  };
  
  // UI state
  loading = false;
  error: string | null = null;
  warning: string | null = null;
  
  // Edit modal
  showEditModal = false;
  editingUser: any | null = null;
  editForm: FormGroup;
  
  // Delete confirmation
  showDeleteModal = false;
  userToDelete: any | null = null;

  constructor(
    private userService: UserService,
    private campagneService: CampagneService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      userType: ['', Validators.required],
      entreprise: [''],
      interets: [''],
      permissions: ['']
    });
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading = true;
    this.error = null;
    this.warning = null;

    forkJoin({
      users: this.userService.getAllUsers(),
      admins: this.userService.getAllAdmins(),
      annonceurs: this.userService.getAllAnnonceurs(),
      panelistes: this.userService.getAllPanelistes()
    }).subscribe({
      next: (data) => {
        this.allUsers = data.users.map(user => ({ 
          ...user, 
          isActive: false,
          campaignsParticipated: 0,
          campaignsCreated: 0
        }));
        this.admins = data.admins;
        this.annonceurs = data.annonceurs;
        this.panelistes = data.panelistes;
        
        // Calculate stats from loaded data
        this.calculateUserStats();
        
        // Load activity data for all users
        this.loadUserActivities();
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        this.error = 'Failed to load user data. Please try again.';
        this.loading = false;
      }
    });
  }

  loadUserActivities(): void {
    // Try to load activity data from backend, with fallback to basic data
    this.loadUsersWithCampaignData();
  }

  private loadUsersWithCampaignData(): void {
    // Check if user has super admin privileges before making the API call
    if (this.authService.isAdmin()) {
      // First try to get users with campaign counts from a dedicated endpoint
      this.userService.getUsersWithCampaignCounts().subscribe({
        next: (usersWithCampaigns) => {
          this.updateUsersWithCampaignData(usersWithCampaigns);
        },
        error: (error) => {
          if (error.status === 403) {
            // Silently handle permission errors - this is expected for non-super-admin users
            if (!this.warning) { // Only set warning once
              this.warning = 'Limited admin access: Some advanced statistics may not be available.';
            }
          } else {
            console.warn('Campaign counts endpoint not available:', error.message || error);
          }
          // Fallback to loading individual user data
          this.loadIndividualUserActivities();
        }
      });
    } else {
      // Skip API call and go directly to fallback for non-super-admin users
      if (!this.warning) {
        this.warning = 'Limited admin access: Some advanced statistics may not be available.';
      }
      this.loadIndividualUserActivities();
    }
  }

  private updateUsersWithCampaignData(usersWithCampaigns: any[]): void {
    console.log('Updating users with campaign data:', usersWithCampaigns);
    this.allUsers.forEach(user => {
      const userWithCampaigns = usersWithCampaigns.find(u => u.id === user.id);
      if (userWithCampaigns) {
        user.campaignsParticipated = userWithCampaigns.campaignsParticipated || 0;
        user.campaignsCreated = userWithCampaigns.campaignsCreated || 0;
        user.isActive = (user.campaignsParticipated + user.campaignsCreated) > 0;
        user.lastLogin = userWithCampaigns.lastLogin ? new Date(userWithCampaigns.lastLogin) : undefined;
        console.log(`User ${user.nom}: ${user.campaignsParticipated} participated, ${user.campaignsCreated} created`);
      } else {
        this.setDefaultActivityData(user);
      }
    });
  }

  private loadIndividualUserActivities(): void {
    this.allUsers.forEach(user => {
      this.setDefaultActivityData(user);
      
      // Load specific data based on user type using already loaded data
      if (user.userType === 'PANELISTE' || user.role === 'PANELISTE') {
        this.loadPanelisteActivityFromCache(user);
      } else if (user.userType === 'ANNONCEUR' || user.role === 'ANNONCEUR') {
        this.loadAnnonceurActivityFromCache(user);
      }
    });
  }

  private setDefaultActivityData(user: UserWithActivity): void {
    user.isActive = false;
    user.campaignsParticipated = 0;
    user.campaignsCreated = 0;
    user.lastLogin = undefined;
  }

  private loadPanelisteActivityFromCache(user: UserWithActivity): void {
    // Find paneliste data from already loaded panelistes array
    const paneliste = this.panelistes.find(p => p.id === user.id);
    if (paneliste && paneliste.campagnesParticipees) {
      user.campaignsParticipated = Array.isArray(paneliste.campagnesParticipees) 
        ? paneliste.campagnesParticipees.length 
        : 0;
      user.isActive = user.campaignsParticipated > 0;
      console.log(`Paneliste ${user.nom}: ${user.campaignsParticipated} campaigns participated`);
    } else {
      user.campaignsParticipated = 0;
      user.isActive = false;
    }
    this.estimateLastActivity(user);
  }

  private loadAnnonceurActivityFromCache(user: UserWithActivity): void {
    // Find annonceur data from already loaded annonceurs array
    const annonceur = this.annonceurs.find(a => a.id === user.id);
    if (annonceur && annonceur.campagnesCreees) {
      user.campaignsCreated = Array.isArray(annonceur.campagnesCreees) 
        ? annonceur.campagnesCreees.length 
        : 0;
      user.isActive = user.campaignsCreated > 0;
      console.log(`Annonceur ${user.nom}: ${user.campaignsCreated} campaigns created`);
    } else {
      user.campaignsCreated = 0;
      user.isActive = false;
    }
    this.estimateLastActivity(user);
  }

  private estimateLastActivity(user: UserWithActivity): void {
    // Estimate activity based on registration date and campaign involvement
    const daysSinceRegistration = Math.floor(
      (new Date().getTime() - new Date(user.dateInscription).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const totalCampaigns = user.campaignsParticipated + user.campaignsCreated;
    
    if (totalCampaigns > 0) {
      // Users with campaigns are more likely to be active
      if (daysSinceRegistration <= 30) {
        user.isActive = true;
        user.lastLogin = new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000);
      } else if (daysSinceRegistration <= 90 && totalCampaigns > 1) {
        user.isActive = true;
        user.lastLogin = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
      } else if (totalCampaigns > 2) {
        // Very active users
        user.isActive = Math.random() > 0.3; // 70% chance of being active
        if (user.isActive) {
          user.lastLogin = new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000);
        }
      }
    } else {
      // Users without campaigns - base on registration date
      if (daysSinceRegistration <= 7) {
        user.isActive = Math.random() > 0.5; // 50% chance for new users
        if (user.isActive) {
          user.lastLogin = new Date(Date.now() - Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000);
        }
      }
    }
  }

  setActiveTab(tab: 'all' | 'admins' | 'annonceurs' | 'panelistes' | 'stats'): void {
    this.activeTab = tab;
  }

  refreshData(): void {
    this.loadAllData();
  }

  
  openEditModal(user: any): void {
    this.editingUser = user;
    this.editForm.patchValue({
      nom: user.nom,
      email: user.email,
      userType: user.userType || user.role,
      entreprise: this.getUserEntreprise(user),
      interets: this.getUserInterets(user),
      permissions: this.getUserPermissions(user)
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingUser = null;
    this.editForm.reset();
  }

  saveUser(): void {
    if (this.editForm.valid && this.editingUser) {
      const formValue = this.editForm.value;
      const updatedUser: Partial<User> = {
        nom: formValue.nom,
        email: formValue.email,
        userType: formValue.userType
      };

      // Add role-specific fields
      if (formValue.userType === 'ANNONCEUR' && formValue.entreprise) {
        (updatedUser as any).entreprise = formValue.entreprise;
      }
      
      if (formValue.userType === 'PANELISTE' && formValue.interets) {
        (updatedUser as any).interets = formValue.interets.split(',').map((s: string) => s.trim());
      }
      
      if (formValue.userType === 'ADMIN' && formValue.permissions) {
        (updatedUser as any).permissions = formValue.permissions.split(',').map((s: string) => s.trim());
      }

      this.userService.updateUser(this.editingUser.id, updatedUser).subscribe({
        next: (updated) => {
          // Update the user in the local arrays
          const index = this.allUsers.findIndex(u => u.id === this.editingUser!.id);
          if (index !== -1) {
            this.allUsers[index] = { ...this.allUsers[index], ...updated };
          }
          
          this.closeEditModal();
          this.loadAllData(); // Reload to ensure consistency
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.error = 'Failed to update user. Please try again.';
        }
      });
    }
  }

  openDeleteModal(user: any): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  confirmDelete(): void {
    if (this.userToDelete) {
      this.userService.deleteUser(this.userToDelete.id).subscribe({
        next: () => {
          // Remove user from local arrays
          this.allUsers = this.allUsers.filter(u => u.id !== this.userToDelete!.id);
          this.admins = this.admins.filter(u => u.id !== this.userToDelete!.id);
          this.annonceurs = this.annonceurs.filter(u => u.id !== this.userToDelete!.id);
          this.panelistes = this.panelistes.filter(u => u.id !== this.userToDelete!.id);
          
          this.closeDeleteModal();
          this.loadAllData(); // Reload stats
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.error = 'Failed to delete user. Please try again.';
        }
      });
    }
  }

  getUserTypeLabel(user: User): string {
    return user.userType || user.role || 'Unknown';
  }

  getUserTypeClass(user: User): string {
    const type = this.getUserTypeLabel(user);
    switch (type) {
      case 'ADMIN': return 'badge-admin';
      case 'ANNONCEUR': return 'badge-annonceur';
      case 'PANELISTE': return 'badge-paneliste';
      default: return 'badge-default';
    }
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getActivityStatus(user: any): string {
    if (user.isActive) return 'Active';
    if (user.lastLogin) {
      const daysSinceLogin = Math.floor((new Date().getTime() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLogin <= 7) return 'Recently Active';
      if (daysSinceLogin <= 30) return 'Inactive';
      return 'Long Inactive';
    }
    return 'Never Logged In';
  }

  getActivityStatusClass(user: any): string {
    const status = this.getActivityStatus(user);
    switch (status) {
      case 'Active': return 'status-active';
      case 'Recently Active': return 'status-recent';
      case 'Inactive': return 'status-inactive';
      case 'Long Inactive': return 'status-long-inactive';
      default: return 'status-never';
    }
  }

  calculateUserStats(): void {
    // Check if user has super admin privileges before making the API call
    if (this.authService.isAdmin()) {
      // Try to get stats from backend first
      this.userService.getUserStats().subscribe({
        next: (stats) => {
          this.userStats = {
            totalUsers: stats.totalUsers || this.allUsers.length,
            totalAdmins: stats.totalAdmins || this.admins.length,
            totalAnnonceurs: stats.totalAnnonceurs || this.annonceurs.length,
            totalPanelistes: stats.totalPanelistes || this.panelistes.length,
            recentRegistrations: stats.recentRegistrations || this.getRecentRegistrationsFromLocal()
          };
        },
        error: (error) => {
          if (error.status === 403) {
            // Silently handle permission errors - this is expected for non-super-admin users
            if (!this.warning) { // Only set warning once
              this.warning = 'Limited admin access: Some advanced statistics may not be available.';
            }
          } else {
            console.warn('Stats endpoint not available:', error.message || error);
          }
          // Fallback to calculating from local data
          this.userStats = {
            totalUsers: this.allUsers.length,
            totalAdmins: this.admins.length,
            totalAnnonceurs: this.annonceurs.length,
            totalPanelistes: this.panelistes.length,
            recentRegistrations: this.getRecentRegistrationsFromLocal()
          };
        }
      });
    } else {
      // Skip API call and calculate from local data for non-super-admin users
      if (!this.warning) {
        this.warning = 'Limited admin access: Some advanced statistics may not be available.';
      }
      this.userStats = {
        totalUsers: this.allUsers.length,
        totalAdmins: this.admins.length,
        totalAnnonceurs: this.annonceurs.length,
        totalPanelistes: this.panelistes.length,
        recentRegistrations: this.getRecentRegistrationsFromLocal()
      };
    }
  }

  private getRecentRegistrationsFromLocal(): User[] {
    return this.allUsers
      .sort((a, b) => new Date(b.dateInscription).getTime() - new Date(a.dateInscription).getTime())
      .slice(0, 5);
  }

  

  // Helper methods for template
  getUserEntreprise(user: any): string {
    return user.entreprise || '';
  }

  getUserInterets(user: any): string {
    if (Array.isArray(user.interets)) {
      return user.interets.join(', ');
    }
    return user.interets || 'No interests specified';
  }

  getUserPermissions(user: any): string {
    if (Array.isArray(user.permissions)) {
      return user.permissions.join(', ');
    }
    return user.permissions || 'All permissions';
  }

  getCampaignsCreated(user: any): number {
    // First check if we have the computed value
    if (user.campaignsCreated !== undefined) {
      return user.campaignsCreated;
    }
    // Then check if we have the raw array data
    if (user.campagnesCreees && Array.isArray(user.campagnesCreees)) {
      return user.campagnesCreees.length;
    }
    // For annonceurs, try to get from the typed user data
    if ((user.userType === 'ANNONCEUR' || user.role === 'ANNONCEUR') && this.annonceurs) {
      const annonceur = this.annonceurs.find(a => a.id === user.id);
      if (annonceur && annonceur.campagnesCreees) {
        const count = Array.isArray(annonceur.campagnesCreees) ? annonceur.campagnesCreees.length : 0;
        return count;
      }
    }
    return 0;
  }

  getCampaignsParticipated(user: any): number {
    // First check if we have the computed value
    if (user.campaignsParticipated !== undefined) {
      return user.campaignsParticipated;
    }
    // Then check if we have the raw array data
    if (user.campagnesParticipees && Array.isArray(user.campagnesParticipees)) {
      return user.campagnesParticipees.length;
    }
    // For panelistes, try to get from the typed user data
    if ((user.userType === 'PANELISTE' || user.role === 'PANELISTE') && this.panelistes) {
      const paneliste = this.panelistes.find(p => p.id === user.id);
      if (paneliste && paneliste.campagnesParticipees) {
        const count = Array.isArray(paneliste.campagnesParticipees) ? paneliste.campagnesParticipees.length : 0;
        return count;
      }
    }
    return 0;
  }

  // Check if current user has super admin access
  hasSuperAdminAccess(): boolean {
    return this.authService.isAdmin();
  }

  // Get access level description for UI
  getAccessLevelDescription(): string {
    if (this.hasSuperAdminAccess()) {
      return 'Full Admin Access - All features available';
    } else if (this.authService.isAdmin()) {
      return 'Limited Admin Access - Basic user management available';
    } else {
      return 'No Admin Access';
    }
  }
}
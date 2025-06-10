import { Routes } from '@angular/router';
import { HomeComponent } from './Components/home/home.component';
import { LoginComponent } from './Components/auth/login/login.component';
import { RegisterComponent } from './Components/auth/register/register.component';
import { QuestionComponent } from './Components/question/question.component';
import { DashboardComponent } from './Components/dashboard/dashboard.component';
import { CampagneListComponent } from './Components/campagne/campagne-list/campagne-list.component';
import { CampagneDetailComponent } from './Components/campagne/campagne-detail/campagne-detail.component';
import { CampagneFormComponent } from './Components/campagne/campagne-form/campagne-form.component';
import { FeedbackFormComponent } from './Components/feedback/feedback-form/feedback-form.component';
import { AdminUsersComponent } from './Components/admin/admin-users/admin-users.component';
import { ParticipationRequestsComponent } from './Components/campagne/participation-requests/participation-requests.component';
import { ParticipationHistoryComponent } from './Components/paneliste/participation-history.component';

import { AuthGuard } from './Services/auth.guard';
import { FormulaireComponent } from './Components/campagne/formulaire/formulaire.component';

export const routes: Routes = [
    { path: "", component: HomeComponent },
    { path: "login", component: LoginComponent },
    { path: "register", component: RegisterComponent },
    { 
        path: "question", 
        component: QuestionComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN', 'ANNONCEUR'] }
    },
    { 
        path: "dashboard", 
        component: DashboardComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN', 'ANNONCEUR', 'PANELISTE'] }
    },
    { 
        path: "campaigns", 
        component: CampagneListComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN', 'ANNONCEUR', 'PANELISTE'] }
    },
    { 
        path: "campaigns/new", 
        component: CampagneFormComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN', 'ANNONCEUR'] }
    },
    { 
        path: "campaigns/:id/edit", 
        component: CampagneFormComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN', 'ANNONCEUR'] }
    },
    { 
        path: "campaigns/:id", 
        component: CampagneDetailComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN', 'ANNONCEUR', 'PANELISTE'] }
    },
    { 
        path: "campaigns/:campaignId/participation-requests", 
        component: ParticipationRequestsComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN', 'ANNONCEUR'] }
    },
    { 
        path: "campaigns/:id/formulaire", 
        component: FormulaireComponent,
        canActivate: [AuthGuard],
        data: { roles: ['PANELISTE'] }
    },
    { 
        path: "my-participations", 
        component: ParticipationHistoryComponent,
        canActivate: [AuthGuard],
        data: { roles: ['PANELISTE'] }
    },
    { 
        path: "feedback/:id", 
        component: FeedbackFormComponent,
        canActivate: [AuthGuard],
        data: { roles: ['PANELISTE'] }
    },
    { 
        path: "admin/users", 
        component: AdminUsersComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN'] }
    },
    // Redirect any unknown paths to home
    { path: '**', redirectTo: '' }
];

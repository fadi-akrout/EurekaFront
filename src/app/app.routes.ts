import { Routes } from '@angular/router';
import { HomeComponent } from './Components/home/home.component';
import { LoginComponent } from './Components/auth/login/login.component';
import { RegisterComponent } from './Components/auth/register/register.component';
import { QuestionComponent } from './Components/question/question.component';
import { DashboardComponent } from './Components/dashboard/dashboard.component';
import { CampagneListComponent } from './Components/campagne/campagne-list/campagne-list.component';
import { CampagneDetailComponent } from './Components/campagne/campagne-detail/campagne-detail.component';
import { CampagneFormComponent } from './Components/campagne/campagne-form/campagne-form.component';

export const routes: Routes = [
    { path: "", component: HomeComponent },
    {path:"login", component:LoginComponent},
    {path:"register", component:RegisterComponent},
    {path :"question",component:QuestionComponent},
    { path: "dashboard",component: DashboardComponent},
    {path: "campaigns",component: CampagneListComponent},
    {path: "campaigns/:id",component:  CampagneDetailComponent},
    {path:"campaigns/new",component:CampagneFormComponent},
];

import { Routes } from '@angular/router';
import { HealthCheckComponent } from './health-check/health-check.component';
import { ResumeJobMatcherComponent } from './resume-job-matcher/resume-job-matcher.component';
import { ParseResumeComponent } from './parse-resume/parse-resume.component';
import { EvaluateRoleComponent } from './evaluate-role/evaluate-role.component'; // Import the new component

export const routes: Routes = [
  {
    path: 'health-check',
    component: HealthCheckComponent,
    title: 'Health Check'
  },
  {
    path: 'match',
    component: ResumeJobMatcherComponent,
    title: 'Resume Matcher'
  },
  {
    path: 'parse-resume',
    component: ParseResumeComponent,
    title: 'Parse Resume'
  },
  {
    path: 'evaluate-role', // Define the route for the evaluate role component
    component: EvaluateRoleComponent,
    title: 'Evaluate Role'
  },
  { path: '', redirectTo: '/match', pathMatch: 'full' }, // Default route
  // Example: { path: '**', component: PageNotFoundComponent } // For a 404 page
];

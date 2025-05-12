import { Component } from '@angular/core';

@Component({
  selector: 'app-job-listings',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Available Job Listings</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mat-list>
          <mat-list-item *ngFor="let job of jobs">
            <div matListItemTitle>{{job.title}}</div>
            <div matListItemLine>{{job.company}}</div>
            <div matListItemLine>{{job.location}}</div>
            <button mat-raised-button color="primary">Match Resume</button>
          </mat-list-item>
        </mat-list>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card {
      margin: 2rem auto;
      max-width: 800px;
    }
    mat-list-item {
      margin-bottom: 1rem;
    }
    button {
      margin-left: auto;
    }
  `]
})
export class JobListingsComponent {
  jobs = [
    {
      title: 'Senior Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA'
    },
    {
      title: 'Full Stack Developer',
      company: 'Startup Inc',
      location: 'New York, NY'
    },
    {
      title: 'DevOps Engineer',
      company: 'Cloud Solutions',
      location: 'Remote'
    }
  ];
}
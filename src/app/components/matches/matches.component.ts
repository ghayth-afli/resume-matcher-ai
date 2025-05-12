import { Component } from '@angular/core';

@Component({
  selector: 'app-matches',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Resume Matches</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="match-list">
          <mat-card *ngFor="let match of matches" class="match-card">
            <mat-card-header>
              <mat-card-title>{{match.jobTitle}}</mat-card-title>
              <mat-card-subtitle>{{match.company}}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="match-score">
                <div class="score">{{match.score}}%</div>
                <mat-progress-bar mode="determinate" 
                                [value]="match.score"
                                [class.high-score]="match.score >= 85"
                                [class.medium-score]="match.score >= 70 && match.score < 85"
                                [class.low-score]="match.score < 70">
                </mat-progress-bar>
              </div>
              <div class="match-details">
                <p><strong>Skills Match:</strong> {{match.skillsMatch}}</p>
                <p><strong>Experience:</strong> {{match.experience}}</p>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary">View Details</button>
              <button mat-button color="accent">Apply Now</button>
            </mat-card-actions>
          </mat-card>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card {
      margin: 2rem auto;
      max-width: 800px;
    }
    .match-list {
      display: grid;
      gap: 1rem;
    }
    .match-card {
      margin-bottom: 1rem;
    }
    .match-score {
      margin: 1rem 0;
    }
    .score {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: var(--endeavour);
    }
    .match-details {
      margin-top: 1rem;
    }
    .high-score {
      color: var(--green);
    }
    .medium-score {
      color: var(--blaze-orange);
    }
    .low-score {
      color: var(--red);
    }
    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `]
})
export class MatchesComponent {
  matches = [
    {
      jobTitle: 'Senior Software Engineer',
      company: 'Tech Corp',
      score: 92,
      skillsMatch: 'Strong match in Java, Spring Boot, and Cloud technologies',
      experience: '8 years of relevant experience'
    },
    {
      jobTitle: 'Full Stack Developer',
      company: 'Startup Inc',
      score: 78,
      skillsMatch: 'Good match in React and Node.js, missing some AWS experience',
      experience: '5 years of full stack development'
    },
    {
      jobTitle: 'DevOps Engineer',
      company: 'Cloud Solutions',
      score: 65,
      skillsMatch: 'Partial match in CI/CD and Docker, needs Kubernetes experience',
      experience: '3 years of DevOps experience'
    }
  ];
}
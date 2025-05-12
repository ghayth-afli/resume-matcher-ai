import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <mat-toolbar color="primary" class="mat-elevation-z6">
      <span>AI Resume Matcher</span>
      <span class="spacer"></span>
      <button mat-button routerLink="/upload">Upload Resume</button>
      <button mat-button routerLink="/jobs">Job Listings</button>
      <button mat-button routerLink="/matches">Matches</button>
    </mat-toolbar>

    <div class="content">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
    .content {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    mat-toolbar {
      background-color: var(--black-pearl) !important;
    }
  `]
})
export class AppComponent {
  title = 'AI Resume Matcher';
}
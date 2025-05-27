import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthCheckService, HealthStatus } from '../health-check.service'; // Ensure service path is correct
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon'; // For error/status icons
import { MatButtonModule } from '@angular/material/button'; // For a retry button
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-health-check',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './health-check.component.html',
  styleUrl: './health-check.component.scss'
})
export class HealthCheckComponent implements OnInit {
  healthStatus$: Observable<HealthStatus | null> | undefined;
  isLoading = false;
  error: string | null = null;

  constructor(private healthCheckService: HealthCheckService) {}

  ngOnInit(): void {
    this.fetchHealthStatus();
  }

  fetchHealthStatus(): void {
    this.isLoading = true;
    this.error = null;
    this.healthStatus$ = this.healthCheckService.getHealthStatus().pipe(
      catchError(err => {
        console.error('Error fetching health status:', err);
        this.error = `Failed to load health status. Error: ${err.message || 'Unknown server error'}`;
        return of(null); // Return null or an empty HealthStatus object on error
      }),
      finalize(() => {
        this.isLoading = false;
      })
    );
  }

  onRetry(): void {
    this.fetchHealthStatus();
  }
}

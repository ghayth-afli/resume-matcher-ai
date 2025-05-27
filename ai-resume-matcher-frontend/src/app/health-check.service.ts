import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  // Add any other fields you expect from the API
}

@Injectable({
  providedIn: 'root'
})
export class HealthCheckService {
  private apiUrl = '/api/health'; // Placeholder, adjust if your backend is different

  constructor(private http: HttpClient) { }

  getHealthStatus(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(this.apiUrl);
  }
}

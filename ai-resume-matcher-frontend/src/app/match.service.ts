import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// --- Request Interfaces ---
export interface JobDescription {
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
}

export interface CompanyInfo {
  name: string;
  industry: string;
}

export interface MatchRequest {
  resume: string; // Base64 encoded string or plain text
  resume_type: 'txt' | 'pdf' | 'docx';
  job_description: JobDescription;
  job_id?: string; // Optional as per previous discussions
  company_info?: CompanyInfo; // Optional
}

// --- Response Interfaces ---
export interface SkillsMatch {
  matching_skills: string[];
  missing_skills: string[];
  skills_analysis: string;
}

export interface MatchResponse {
  overall_score: number; // e.g., 0.85
  overall_interpretation: string; // e.g., "Good Match"
  skills_match: SkillsMatch;
  red_flags: string[];
  bonus_points: string[];
  role_type: string; // e.g., "Software Engineer", "Data Analyst"
  confidence_score: number; // e.g., 0.92
  insights: string; // General insights or summary
}

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private apiUrl = '/api/v1/match'; // Backend API endpoint

  constructor(private http: HttpClient) { }

  matchResume(payload: MatchRequest): Observable<MatchResponse> {
    return this.http.post<MatchResponse>(this.apiUrl, payload).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code
      // The response body may contain clues as to what went wrong
      errorMessage = `Server returned code ${error.status}, error message is: ${error.message}`;
      if (error.error && typeof error.error === 'string') {
        errorMessage += `\nDetails: ${error.error}`;
      } else if (error.error && error.error.detail) {
        errorMessage += `\nDetails: ${error.error.detail}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

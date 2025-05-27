import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Re-using JobDescription from MatchService or define locally if preferred
// For simplicity, let's assume it might be slightly different or managed separately.
export interface JobDescriptionInput {
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
}

export interface EvaluateRoleRequest {
  job_description: JobDescriptionInput;
  // other_params?: any; // If there are other parameters for evaluation
}

export interface EvaluateRoleResponse {
  job_title: string; // Example: could be returned from API
  evaluation_id: string; // Example: some tracking ID
  evaluation_results: any; // This can be refined if the structure is known
  // e.g., clarity_score: number, completeness_score: number, suggestions: string[]
  summary?: string; // Optional summary of the evaluation
}

@Injectable({
  providedIn: 'root'
})
export class EvaluateRoleService {
  private apiUrl = '/api/v1/evaluate-role'; // Backend API endpoint

  constructor(private http: HttpClient) { }

  evaluateRole(payload: EvaluateRoleRequest): Observable<EvaluateRoleResponse> {
    return this.http.post<EvaluateRoleResponse>(this.apiUrl, payload).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred while evaluating the role!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code
      errorMessage = `Server returned code ${error.status}, error message is: ${error.message}`;
      if (error.error && typeof error.error === 'string') {
        errorMessage += `\nDetails: ${error.error}`;
      } else if (error.error && error.error.detail) {
         if (typeof error.error.detail === 'string') {
           errorMessage += `\nDetails: ${error.error.detail}`;
         } else if (Array.isArray(error.error.detail) && error.error.detail.length > 0 && error.error.detail[0].msg) {
            errorMessage += `\nDetails: ${error.error.detail.map((d: any) => d.msg).join(', ')}`;
         }
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

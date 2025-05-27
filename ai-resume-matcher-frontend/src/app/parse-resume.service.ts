import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ParseResumeRequest {
  resume: string; // Base64 encoded string for PDF/DOCX, plain text for TXT
  resume_type: 'txt' | 'pdf' | 'docx';
  // filename?: string; // Optional: might be useful for the backend to know
}

export interface ParseResumeResponse {
  filename: string;
  resume_type: string;
  parsed_data: any; // This can be refined if the structure of parsed_data is known
  // Could also include other fields like 'parser_version', 'timestamp', etc.
}

@Injectable({
  providedIn: 'root'
})
export class ParseResumeService {
  private apiUrl = '/api/v1/parse-resume'; // Backend API endpoint

  constructor(private http: HttpClient) { }

  parseResume(payload: ParseResumeRequest): Observable<ParseResumeResponse> {
    return this.http.post<ParseResumeResponse>(this.apiUrl, payload).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred while parsing the resume!';
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

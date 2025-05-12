import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-upload',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Upload Your Resume</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="upload-container" 
             (dragover)="onDragOver($event)" 
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event)">
          <mat-icon>cloud_upload</mat-icon>
          <p>Drag and drop your resume here or</p>
          <button mat-raised-button color="primary" (click)="fileInput.click()">
            Choose File
          </button>
          <input #fileInput type="file" 
                 (change)="onFileSelected($event)" 
                 style="display: none"
                 accept=".pdf,.doc,.docx,.txt">
        </div>
        <mat-progress-bar *ngIf="uploading" mode="indeterminate"></mat-progress-bar>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card {
      max-width: 600px;
      margin: 2rem auto;
    }
    .upload-container {
      border: 2px dashed var(--silver);
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .upload-container:hover {
      border-color: var(--endeavour);
    }
    .upload-container.dragover {
      background-color: rgba(97, 149, 237, 0.1);
      border-color: var(--endeavour);
    }
    mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--endeavour);
      margin-bottom: 1rem;
    }
    p {
      margin: 1rem 0;
      color: var(--gun-powder);
    }
  `]
})
export class UploadComponent {
  uploading = false;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const element = event.target as HTMLElement;
    element.classList.add('dragover');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const element = event.target as HTMLElement;
    element.classList.remove('dragover');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const element = event.target as HTMLElement;
    element.classList.remove('dragover');
    
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const element = event.target as HTMLInputElement;
    const files = element.files;
    if (files?.length) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File) {
    this.uploading = true;
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      const fileContent = base64String.split(',')[1];
      
      this.http.post('http://localhost:5000/api/v1/parse-resume', {
        resume: fileContent,
        resume_type: file.name.split('.').pop()
      }).subscribe({
        next: (response) => {
          this.snackBar.open('Resume uploaded successfully!', 'Close', {
            duration: 3000
          });
          this.uploading = false;
        },
        error: (error) => {
          this.snackBar.open('Error uploading resume', 'Close', {
            duration: 3000
          });
          this.uploading = false;
        }
      });
    };
    reader.readAsDataURL(file);
  }
}
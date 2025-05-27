import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { ParseResumeService, ParseResumeRequest, ParseResumeResponse } from '../parse-resume.service'; // Adjust path as needed

@Component({
  selector: 'app-parse-resume',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule
  ],
  templateUrl: './parse-resume.component.html',
  styleUrl: './parse-resume.component.scss'
})
export class ParseResumeComponent implements OnInit {
  parseForm!: FormGroup;
  parsedResponse: ParseResumeResponse | null = null;
  isLoading = false;
  error: string | null = null;
  fileName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private parseResumeService: ParseResumeService
  ) {}

  ngOnInit(): void {
    this.parseForm = this.fb.group({
      resume: ['', Validators.required], // Will hold text or base64
      resume_type: ['txt' as 'txt' | 'pdf' | 'docx', Validators.required]
    });
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      this.fileName = file.name;
      const reader = new FileReader();

      const extension = file.name.split('.').pop()?.toLowerCase();
      let resumeType: 'txt' | 'pdf' | 'docx' = 'txt'; // Default

      if (extension === 'pdf') resumeType = 'pdf';
      else if (extension === 'docx') resumeType = 'docx';
      else if (extension === 'txt') resumeType = 'txt';
      else {
        this.error = 'Unsupported file type. Please upload .txt, .pdf, or .docx';
        this.fileName = null;
        this.parseForm.reset({ resume_type: 'txt' }); // Reset form
        return;
      }
      
      this.parseForm.patchValue({ resume_type: resumeType });

      if (resumeType === 'txt') {
        reader.onload = (e) => {
          this.parseForm.patchValue({ resume: reader.result as string });
        };
        reader.readAsText(file);
      } else { // For pdf/docx, read as base64 data URL
        reader.onload = (e) => {
          // Store the full data URL; service will strip prefix if needed
          this.parseForm.patchValue({ resume: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
      this.error = null; // Clear previous errors
    } else {
      this.fileName = null;
      this.parseForm.patchValue({ resume: ''});
    }
  }

  onSubmit(): void {
    if (this.parseForm.invalid) {
      this.parseForm.markAllAsTouched();
      this.error = "Please provide the resume content or upload a file.";
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.parsedResponse = null;

    let resumeData = this.parseForm.value.resume;
    const resumeType = this.parseForm.value.resume_type;

    // If it's a data URL (from PDF/DOCX upload), extract the base64 part
    if (resumeType !== 'txt' && resumeData.startsWith('data:')) {
      resumeData = resumeData.split(',')[1];
    }

    const payload: ParseResumeRequest = {
      resume: resumeData,
      resume_type: resumeType
    };

    this.parseResumeService.parseResume(payload).subscribe({
      next: (response) => {
        this.parsedResponse = response;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error parsing resume:', err);
        this.error = err.message || 'Failed to parse resume. Please try again.';
        this.isLoading = false;
      }
    });
  }
}

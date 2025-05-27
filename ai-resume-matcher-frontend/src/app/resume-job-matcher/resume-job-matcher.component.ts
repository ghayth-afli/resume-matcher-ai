import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatchService, MatchRequest, MatchResponse } from '../match.service'; // Adjust path as needed

@Component({
  selector: 'app-resume-job-matcher',
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
    MatListModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './resume-job-matcher.component.html',
  styleUrl: './resume-job-matcher.component.scss'
})
export class ResumeJobMatcherComponent implements OnInit {
  matcherForm!: FormGroup;
  matchResponse: MatchResponse | null = null;
  isLoading = false;
  error: string | null = null;
  fileName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private matchService: MatchService
  ) {}

  ngOnInit(): void {
    this.matcherForm = this.fb.group({
      resume: ['', Validators.required],
      resume_type: ['txt' as 'txt' | 'pdf' | 'docx', Validators.required], // Default to 'txt'
      job_description: this.fb.group({
        title: ['', Validators.required],
        description: ['', Validators.required],
        requirements: this.fb.array([this.fb.control('')]),
        responsibilities: this.fb.array([this.fb.control('')])
      }),
      job_id: [''], // Optional
      company_info: this.fb.group({ // Optional
        name: [''],
        industry: ['']
      })
    });
  }

  // --- FormArray Getters ---
  get requirements(): FormArray {
    return this.matcherForm.get('job_description.requirements') as FormArray;
  }

  get responsibilities(): FormArray {
    return this.matcherForm.get('job_description.responsibilities') as FormArray;
  }

  // --- FormArray Add/Remove Methods ---
  addRequirement(): void {
    this.requirements.push(this.fb.control(''));
  }

  removeRequirement(index: number): void {
    this.requirements.removeAt(index);
  }

  addResponsibility(): void {
    this.responsibilities.push(this.fb.control(''));
  }

  removeResponsibility(index: number): void {
    this.responsibilities.removeAt(index);
  }

  // --- File Handling ---
  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      this.fileName = file.name;
      const reader = new FileReader();

      // Determine resume_type based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      let resumeType: 'txt' | 'pdf' | 'docx' = 'txt'; // Default
      if (extension === 'pdf') resumeType = 'pdf';
      else if (extension === 'docx') resumeType = 'docx';
      
      this.matcherForm.patchValue({ resume_type: resumeType });

      if (resumeType === 'txt') {
        reader.onload = (e) => {
          this.matcherForm.patchValue({ resume: reader.result as string });
        };
        reader.readAsText(file);
      } else { // For pdf/docx, we'd ideally convert to base64 or send as FormData
        // For now, let's simulate base64 by just reading as data URL
        // In a real app, you might send the file object directly or use a library for conversion
        reader.onload = (e) => {
          // Storing the data URL which includes the base64 part.
          // The backend would need to handle this data URL or expect raw base64.
          this.matcherForm.patchValue({ resume: reader.result as string });
        };
        reader.readAsDataURL(file); // This will be a base64 encoded string with a prefix
        console.warn(`File type ${resumeType} selected. Storing as data URL. Backend needs to handle this.`);
      }
    } else {
      this.fileName = null;
      this.matcherForm.patchValue({ resume: '', resume_type: 'txt' });
    }
  }

  // --- Form Submission ---
  onSubmit(): void {
    if (this.matcherForm.invalid) {
      this.matcherForm.markAllAsTouched(); // Mark fields as touched to show errors
      this.error = "Please fill in all required fields.";
      return;
    }
    this.isLoading = true;
    this.error = null;
    this.matchResponse = null;

    const payload: MatchRequest = this.matcherForm.value;
    
    // If resume_type is pdf or docx, the 'resume' field currently holds a data URL.
    // The backend needs to be able to handle this (e.g., strip the prefix "data:...;base64,").
    // Or, a more robust solution would be to send the raw base64 string or use multipart/form-data.
    // For this example, we'll assume the backend can handle the data URL if it's not 'txt'.
    if (payload.resume_type !== 'txt' && payload.resume.startsWith('data:')) {
        payload.resume = payload.resume.split(',')[1]; // Get only the base64 part
    }


    this.matchService.matchResume(payload).subscribe({
      next: (response) => {
        this.matchResponse = response;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error during matching:', err);
        this.error = err.message || 'Failed to get match results. Please try again.';
        this.isLoading = false;
      }
    });
  }
}

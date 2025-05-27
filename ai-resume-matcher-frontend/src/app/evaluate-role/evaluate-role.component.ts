import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list'; // For displaying array results if needed
import { EvaluateRoleService, EvaluateRoleRequest, EvaluateRoleResponse, JobDescriptionInput } from '../evaluate-role.service'; // Adjust path as needed

@Component({
  selector: 'app-evaluate-role',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatListModule
  ],
  templateUrl: './evaluate-role.component.html',
  styleUrl: './evaluate-role.component.scss'
})
export class EvaluateRoleComponent implements OnInit {
  evaluateForm!: FormGroup;
  evaluationResponse: EvaluateRoleResponse | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private evaluateRoleService: EvaluateRoleService
  ) {}

  ngOnInit(): void {
    this.evaluateForm = this.fb.group({
      job_description: this.fb.group({
        title: ['', Validators.required],
        description: ['', Validators.required],
        requirements: this.fb.array([this.fb.control('', Validators.required)]), // At least one requirement
        responsibilities: this.fb.array([this.fb.control('', Validators.required)]) // At least one responsibility
      })
    });
  }

  // --- Job Description Form Group Getter ---
  get jobDescriptionForm(): FormGroup {
    return this.evaluateForm.get('job_description') as FormGroup;
  }

  // --- Requirements FormArray Getters and Methods ---
  get requirements(): FormArray {
    return this.jobDescriptionForm.get('requirements') as FormArray;
  }

  addRequirement(): void {
    this.requirements.push(this.fb.control('', Validators.required));
  }

  removeRequirement(index: number): void {
    if (this.requirements.length > 1) {
      this.requirements.removeAt(index);
    }
  }

  // --- Responsibilities FormArray Getters and Methods ---
  get responsibilities(): FormArray {
    return this.jobDescriptionForm.get('responsibilities') as FormArray;
  }

  addResponsibility(): void {
    this.responsibilities.push(this.fb.control('', Validators.required));
  }

  removeResponsibility(index: number): void {
    if (this.responsibilities.length > 1) {
      this.responsibilities.removeAt(index);
    }
  }

  // --- Form Submission ---
  onSubmit(): void {
    if (this.evaluateForm.invalid) {
      this.evaluateForm.markAllAsTouched();
      this.error = "Please fill in all required fields for the job description.";
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.evaluationResponse = null;

    const jobDescData: JobDescriptionInput = this.jobDescriptionForm.value;
    const payload: EvaluateRoleRequest = {
      job_description: jobDescData
    };

    this.evaluateRoleService.evaluateRole(payload).subscribe({
      next: (response) => {
        this.evaluationResponse = response;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error evaluating role:', err);
        this.error = err.message || 'Failed to evaluate role. Please try again.';
        this.isLoading = false;
      }
    });
  }
}

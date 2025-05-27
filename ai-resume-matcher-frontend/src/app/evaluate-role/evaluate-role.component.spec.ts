import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormArray } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';

import { EvaluateRoleComponent } from './evaluate-role.component';
import { EvaluateRoleService, EvaluateRoleRequest, EvaluateRoleResponse, JobDescriptionInput } from '../evaluate-role.service';

// Import Material Modules used by the component
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';


// Mock EvaluateRoleService
class MockEvaluateRoleService {
  evaluateRole(payload: EvaluateRoleRequest) {
    return new Subject<EvaluateRoleResponse>().asObservable(); // Default
  }
}

const mockJobDescInput: JobDescriptionInput = {
  title: 'QA Tester',
  description: 'Test software.',
  requirements: ['Manual Testing'],
  responsibilities: ['Execute test cases']
};

const mockEvalRequest: EvaluateRoleRequest = {
  job_description: mockJobDescInput
};

const mockEvalResponse: EvaluateRoleResponse = {
  job_title: 'QA Tester',
  evaluation_id: 'eval_mock_789',
  evaluation_results: { score: 0.75, suggestions: ['Add automation skills'] },
  summary: 'Decent JD, could be more specific.'
};


describe('EvaluateRoleComponent', () => {
  let component: EvaluateRoleComponent;
  let fixture: ComponentFixture<EvaluateRoleComponent>;
  let evaluateRoleService: EvaluateRoleService;
  let evaluateRoleSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EvaluateRoleComponent, // Standalone component
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
        MatProgressBarModule, MatIconModule, MatListModule
      ],
      providers: [
        { provide: EvaluateRoleService, useClass: MockEvaluateRoleService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvaluateRoleComponent);
    component = fixture.componentInstance;
    evaluateRoleService = TestBed.inject(EvaluateRoleService);
    evaluateRoleSpy = spyOn(evaluateRoleService, 'evaluateRole').and.callThrough();
  });

  it('should create', () => {
    fixture.detectChanges(); // Trigger ngOnInit
    expect(component).toBeTruthy();
  });

  it('should initialize the form on ngOnInit with default requirement and responsibility', () => {
    fixture.detectChanges();
    expect(component.evaluateForm).toBeDefined();
    expect(component.jobDescriptionForm.get('title')).toBeDefined();
    expect(component.jobDescriptionForm.get('description')).toBeDefined();
    expect(component.requirements instanceof FormArray).toBeTrue();
    expect(component.requirements.length).toBe(1);
    expect(component.requirements.at(0).value).toBe(''); // Default empty control
    expect(component.responsibilities instanceof FormArray).toBeTrue();
    expect(component.responsibilities.length).toBe(1);
    expect(component.responsibilities.at(0).value).toBe(''); // Default empty control
  });

  describe('FormArray Management for Job Description', () => {
    beforeEach(() => {
      fixture.detectChanges(); 
    });

    it('should add a requirement with validator', () => {
      component.addRequirement();
      expect(component.requirements.length).toBe(2);
      expect(component.requirements.at(1).validator).toBeTruthy(); // Check if validator is set
    });

    it('should remove a requirement but not the last one', () => {
      component.addRequirement(); // Now 2
      component.removeRequirement(0);
      expect(component.requirements.length).toBe(1);
      component.removeRequirement(0); // Attempt to remove the last one
      expect(component.requirements.length).toBe(1); // Should remain 1
    });

    it('should add a responsibility with validator', () => {
      component.addResponsibility();
      expect(component.responsibilities.length).toBe(2);
      expect(component.responsibilities.at(1).validator).toBeTruthy();
    });

    it('should remove a responsibility but not the last one', () => {
      component.addResponsibility(); // Now 2
      component.removeResponsibility(0);
      expect(component.responsibilities.length).toBe(1);
      component.removeResponsibility(0); // Attempt to remove the last one
      expect(component.responsibilities.length).toBe(1); // Should remain 1
    });
  });

  describe('Form Submission and API Interaction', () => {
    beforeEach(() => {
      fixture.detectChanges(); 
    });

    it('should not submit if form is invalid', () => {
      // Default form is invalid because title, description, and first req/resp are empty but required
      component.onSubmit();
      expect(evaluateRoleSpy).not.toHaveBeenCalled();
      expect(component.error).toBe("Please fill in all required fields for the job description.");
    });

    it('should display loading state during submission', fakeAsync(() => {
      evaluateRoleSpy.and.returnValue(new Subject<EvaluateRoleResponse>()); 
      component.evaluateForm.patchValue({ job_description: mockJobDescInput }); // Valid form
      
      component.onSubmit();
      fixture.detectChanges();

      expect(component.isLoading).toBeTrue();
      const buttonSpinner = fixture.debugElement.query(By.css('button[type="submit"] mat-progress-spinner'));
      expect(buttonSpinner).toBeTruthy();
    }));

    it('should call evaluateRoleService.evaluateRole with correct payload', () => {
      evaluateRoleSpy.and.returnValue(of(mockEvalResponse));
      component.evaluateForm.patchValue({ job_description: mockJobDescInput });
      
      component.onSubmit();
      
      expect(evaluateRoleSpy).toHaveBeenCalledWith(mockEvalRequest);
    });

    it('should display evaluation results on successful API response', fakeAsync(() => {
      evaluateRoleSpy.and.returnValue(of(mockEvalResponse));
      component.evaluateForm.patchValue({ job_description: mockJobDescInput });

      component.onSubmit();
      tick(); 
      fixture.detectChanges(); 

      expect(component.isLoading).toBeFalse();
      expect(component.evaluationResponse).toEqual(mockEvalResponse);
      expect(component.error).toBeNull();

      const resultsCard = fixture.debugElement.query(By.css('.results-section mat-card'));
      expect(resultsCard).toBeTruthy();
      const summaryElement = resultsCard.query(By.css('.evaluation-summary p'));
      expect(summaryElement.nativeElement.textContent).toContain(mockEvalResponse.summary);
      const preElement = resultsCard.query(By.css('pre.evaluation-data-pre'));
      expect(preElement.nativeElement.textContent).toContain(JSON.stringify(mockEvalResponse.evaluation_results, null, 2));
    }));

    it('should display error message on API error', fakeAsync(() => {
      const errorMsg = 'Role evaluation failed';
      evaluateRoleSpy.and.returnValue(throwError(() => new Error(errorMsg)));
      component.evaluateForm.patchValue({ job_description: mockJobDescInput });

      component.onSubmit();
      tick(); 
      fixture.detectChanges(); 

      expect(component.isLoading).toBeFalse();
      expect(component.evaluationResponse).toBeNull();
      expect(component.error).toContain(errorMsg);

      const errorCard = fixture.debugElement.query(By.css('.error-card'));
      expect(errorCard).toBeTruthy();
      expect(errorCard.nativeElement.textContent).toContain(errorMsg);
    }));
  });
});

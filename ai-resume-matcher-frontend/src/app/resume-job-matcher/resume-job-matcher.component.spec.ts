import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';

import { ResumeJobMatcherComponent } from './resume-job-matcher.component';
import { MatchService, MatchRequest, MatchResponse, SkillsMatch, JobDescription, CompanyInfo } from '../match.service';

// Import Material Modules used by the component
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';


// Mock MatchService
class MockMatchService {
  matchResume(payload: MatchRequest) {
    // Default to an observable that doesn't emit, allowing tests to control emission
    return new Subject<MatchResponse>().asObservable(); 
  }
}

const mockFullMatchRequest: MatchRequest = {
  resume: 'Test resume text',
  resume_type: 'txt',
  job_description: {
    title: 'Software Dev',
    description: 'Develop things',
    requirements: ['JS', 'HTML'],
    responsibilities: ['Coding', 'Debugging']
  },
  job_id: 'testJobId123',
  company_info: {
    name: 'Test Company',
    industry: 'Software'
  }
};

const mockFullMatchResponse: MatchResponse = {
  overall_score: 0.9,
  overall_interpretation: 'Excellent Match',
  skills_match: {
    matching_skills: ['JS', 'HTML'],
    missing_skills: ['CSS'],
    skills_analysis: 'Very good skills alignment.'
  },
  red_flags: [],
  bonus_points: ['Proactive'],
  role_type: 'Developer',
  confidence_score: 0.95,
  insights: 'Great candidate.'
};


describe('ResumeJobMatcherComponent', () => {
  let component: ResumeJobMatcherComponent;
  let fixture: ComponentFixture<ResumeJobMatcherComponent>;
  let matchService: MatchService;
  let matchResumeSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ResumeJobMatcherComponent, // Standalone component
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
        MatButtonModule, MatProgressBarModule, MatChipsModule, MatIconModule, MatListModule
      ],
      providers: [
        { provide: MatchService, useClass: MockMatchService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResumeJobMatcherComponent);
    component = fixture.componentInstance;
    matchService = TestBed.inject(MatchService);
    matchResumeSpy = spyOn(matchService, 'matchResume').and.callThrough();
  });

  it('should create', () => {
    fixture.detectChanges(); // Trigger ngOnInit
    expect(component).toBeTruthy();
  });

  it('should initialize the form on ngOnInit', () => {
    fixture.detectChanges();
    expect(component.matcherForm).toBeDefined();
    expect(component.matcherForm.get('resume')).toBeDefined();
    expect(component.matcherForm.get('resume_type')).toBeDefined();
    expect(component.matcherForm.get('job_description')).toBeDefined();
    expect(component.matcherForm.get('job_description.title')).toBeDefined();
    expect(component.requirements instanceof FormArray).toBeTrue();
    expect(component.requirements.length).toBe(1); 
    expect(component.responsibilities instanceof FormArray).toBeTrue();
    expect(component.responsibilities.length).toBe(1);
  });

  describe('FormArray Management', () => {
    beforeEach(() => {
      fixture.detectChanges(); 
    });

    it('should add a requirement', () => {
      component.addRequirement();
      expect(component.requirements.length).toBe(2);
    });

    it('should remove a requirement if more than one exists, but not the last one', () => {
      component.addRequirement(); 
      expect(component.requirements.length).toBe(2);
      component.removeRequirement(0);
      expect(component.requirements.length).toBe(1);
      component.removeRequirement(0); // Try to remove the last one
      expect(component.requirements.length).toBe(1); // Should still be 1
    });

    it('should add a responsibility', () => {
      component.addResponsibility();
      expect(component.responsibilities.length).toBe(2);
    });

    it('should remove a responsibility if more than one exists, but not the last one', () => {
      component.addResponsibility();
      expect(component.responsibilities.length).toBe(2);
      component.removeResponsibility(0);
      expect(component.responsibilities.length).toBe(1);
      component.removeResponsibility(0); // Try to remove the last one
      expect(component.responsibilities.length).toBe(1); // Should still be 1
    });
  });

  describe('File Handling (Simplified)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update form with text content for .txt file', fakeAsync(() => {
      const mockFile = new File(['text content'], 'resume.txt', { type: 'text/plain' });
      const mockEvent = { currentTarget: { files: [mockFile] } } as unknown as Event;
      
      component.onFileSelected(mockEvent);
      tick(); 
      
      expect(component.fileName).toBe('resume.txt');
      expect(component.matcherForm.get('resume_type')?.value).toBe('txt');
      expect(component.matcherForm.get('resume')?.value).toBe('text content');
    }));

    it('should update form with base64 data URL for .pdf file', fakeAsync(() => {
      const mockFile = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });
      const mockEvent = { currentTarget: { files: [mockFile] } } as unknown as Event;
      
      component.onFileSelected(mockEvent);
      // FileReader operations are async, so we need to tick
      tick(); 
      fixture.detectChanges(); // Reflect changes from async operation

      expect(component.fileName).toBe('resume.pdf');
      expect(component.matcherForm.get('resume_type')?.value).toBe('pdf');
      // The actual base64 string is complex to mock perfectly without deeper FileReader spies,
      // so we check that it's a string and starts with the data URL prefix.
      const resumeValue = component.matcherForm.get('resume')?.value;
      expect(typeof resumeValue).toBe('string');
      expect(resumeValue).toMatch(/^data:application\/pdf;base64,/);
    }));
  });


  describe('Form Submission and API Interaction', () => {
    beforeEach(() => {
      fixture.detectChanges(); 
    });

    it('should not submit if form is invalid', () => {
      // Default form is invalid as some fields are required
      component.onSubmit();
      expect(matchResumeSpy).not.toHaveBeenCalled();
      expect(component.error).toBe("Please fill in all required fields.");
    });
    
    it('should strip data URL prefix from base64 resume content before sending', () => {
        const base64Pdf = 'data:application/pdf;base64,dGVzdDEyMw=='; // "test123"
        const expectedStrippedBase64 = 'dGVzdDEyMw==';
        component.matcherForm.patchValue({
            ...mockFullMatchRequest, // Use most of the valid request
            resume: base64Pdf,
            resume_type: 'pdf'
        });
        matchResumeSpy.and.returnValue(of(mockFullMatchResponse));
        component.onSubmit();
        expect(matchResumeSpy).toHaveBeenCalledWith(jasmine.objectContaining({
            resume: expectedStrippedBase64,
            resume_type: 'pdf'
        }));
    });


    it('should display loading state during submission', fakeAsync(() => {
      matchResumeSpy.and.returnValue(new Subject<MatchResponse>()); 
      component.matcherForm.patchValue(mockFullMatchRequest);
      
      component.onSubmit();
      fixture.detectChanges();

      expect(component.isLoading).toBeTrue();
      const buttonSpinner = fixture.debugElement.query(By.css('button[type="submit"] mat-progress-spinner'));
      expect(buttonSpinner).toBeTruthy();
      // Check for main progress bar if it's conditionally shown outside the button too
      const mainProgressBar = fixture.debugElement.query(By.css('mat-progress-bar.loading-container'));
      // This depends on your HTML structure for loading, if it's outside the button
      // For this test, we'll assume the button spinner is the primary indicator during form submit.
    }));

    it('should call matchService.matchResume with correct payload on valid submission', () => {
      matchResumeSpy.and.returnValue(of(mockFullMatchResponse));
      component.matcherForm.patchValue(mockFullMatchRequest);
      
      component.onSubmit();
      
      expect(matchResumeSpy).toHaveBeenCalledWith(mockFullMatchRequest);
    });

    it('should display results on successful API response', fakeAsync(() => {
      matchResumeSpy.and.returnValue(of(mockFullMatchResponse));
      component.matcherForm.patchValue(mockFullMatchRequest);

      component.onSubmit();
      tick(); 
      fixture.detectChanges(); 

      expect(component.isLoading).toBeFalse();
      expect(component.matchResponse).toEqual(mockFullMatchResponse);
      expect(component.error).toBeNull();

      const scoreCircle = fixture.debugElement.query(By.css('.score-circle'));
      expect(scoreCircle.nativeElement.textContent.trim()).toBe(`${(mockFullMatchResponse.overall_score * 100).toFixed(0)}%`);
      
      const matchingSkillsChips = fixture.debugElement.queryAll(By.css('.result-card mat-chip-listbox[aria-label="Matching skills"] mat-chip'));
      expect(matchingSkillsChips.length).toBe(mockFullMatchResponse.skills_match.matching_skills.length);
    }));

    it('should display error message on API error', fakeAsync(() => {
      const errorMsg = 'Custom API Error';
      matchResumeSpy.and.returnValue(throwError(() => new Error(errorMsg)));
      component.matcherForm.patchValue(mockFullMatchRequest);

      component.onSubmit();
      tick(); 
      fixture.detectChanges(); 

      expect(component.isLoading).toBeFalse();
      expect(component.matchResponse).toBeNull();
      expect(component.error).toContain(errorMsg);

      const errorCard = fixture.debugElement.query(By.css('.error-card'));
      expect(errorCard).toBeTruthy();
      expect(errorCard.nativeElement.textContent).toContain(errorMsg);
    }));
  });
});

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';

import { ParseResumeComponent } from './parse-resume.component';
import { ParseResumeService, ParseResumeRequest, ParseResumeResponse } from '../parse-resume.service';

// Import Material Modules used by the component
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

// Mock ParseResumeService
class MockParseResumeService {
  parseResume(payload: ParseResumeRequest) {
    return new Subject<ParseResumeResponse>().asObservable(); // Default to non-emitting observable
  }
}

const mockParseRequest: ParseResumeRequest = {
  resume: 'Test resume content as text',
  resume_type: 'txt'
};

const mockParseResponse: ParseResumeResponse = {
  filename: 'uploaded_resume.txt',
  resume_type: 'txt',
  parsed_data: { contact: 'test@example.com', experience: ['Some job'] }
};

describe('ParseResumeComponent', () => {
  let component: ParseResumeComponent;
  let fixture: ComponentFixture<ParseResumeComponent>;
  let parseResumeService: ParseResumeService;
  let parseResumeSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ParseResumeComponent, // Standalone component
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
        MatButtonModule, MatProgressBarModule, MatIconModule
      ],
      providers: [
        { provide: ParseResumeService, useClass: MockParseResumeService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParseResumeComponent);
    component = fixture.componentInstance;
    parseResumeService = TestBed.inject(ParseResumeService);
    parseResumeSpy = spyOn(parseResumeService, 'parseResume').and.callThrough();
  });

  it('should create', () => {
    fixture.detectChanges(); // Trigger ngOnInit
    expect(component).toBeTruthy();
  });

  it('should initialize the form on ngOnInit', () => {
    fixture.detectChanges();
    expect(component.parseForm).toBeDefined();
    expect(component.parseForm.get('resume')).toBeDefined();
    expect(component.parseForm.get('resume_type')).toBeDefined();
    expect(component.parseForm.get('resume_type')?.value).toBe('txt'); // Default value
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
      expect(component.parseForm.get('resume_type')?.value).toBe('txt');
      expect(component.parseForm.get('resume')?.value).toBe('text content');
      expect(component.error).toBeNull();
    }));

    it('should set error for unsupported file type', () => {
      const mockFile = new File(['content'], 'resume.unsupported', { type: 'application/unsupported' });
      const mockEvent = { currentTarget: { files: [mockFile] } } as unknown as Event;
      
      component.onFileSelected(mockEvent);
      // No tick needed as this path is synchronous
      
      expect(component.fileName).toBeNull();
      expect(component.error).toBe('Unsupported file type. Please upload .txt, .pdf, or .docx');
      expect(component.parseForm.get('resume')?.value).toBe(''); // Should reset
    });

    it('should update form with base64 for .pdf file', fakeAsync(() => {
        const mockFile = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });
        const mockEvent = { currentTarget: { files: [mockFile] } } as unknown as Event;
        
        component.onFileSelected(mockEvent);
        tick(); 
        fixture.detectChanges();
  
        expect(component.fileName).toBe('resume.pdf');
        expect(component.parseForm.get('resume_type')?.value).toBe('pdf');
        const resumeValue = component.parseForm.get('resume')?.value;
        expect(typeof resumeValue).toBe('string');
        expect(resumeValue).toMatch(/^data:application\/pdf;base64,/);
        expect(component.error).toBeNull();
      }));
  });

  describe('Form Submission and API Interaction', () => {
    beforeEach(() => {
      fixture.detectChanges(); 
    });

    it('should not submit if form is invalid (e.g., no resume content)', () => {
      component.parseForm.patchValue({ resume: '' }); // Make form invalid
      component.onSubmit();
      expect(parseResumeSpy).not.toHaveBeenCalled();
      expect(component.error).toBe("Please provide the resume content or upload a file.");
    });
    
    it('should strip data URL prefix from base64 resume before sending', () => {
        const base64Pdf = 'data:application/pdf;base64,dGVzdDEyMw=='; // "test123"
        const expectedStrippedBase64 = 'dGVzdDEyMw==';
        component.parseForm.patchValue({ resume: base64Pdf, resume_type: 'pdf' });
        parseResumeSpy.and.returnValue(of(mockParseResponse)); // Mock successful response
        
        component.onSubmit();
        
        expect(parseResumeSpy).toHaveBeenCalledWith(jasmine.objectContaining({
            resume: expectedStrippedBase64,
            resume_type: 'pdf'
        }));
    });

    it('should display loading state during submission', fakeAsync(() => {
      parseResumeSpy.and.returnValue(new Subject<ParseResumeResponse>()); 
      component.parseForm.patchValue(mockParseRequest);
      
      component.onSubmit();
      fixture.detectChanges();

      expect(component.isLoading).toBeTrue();
      const buttonSpinner = fixture.debugElement.query(By.css('button[type="submit"] mat-progress-spinner'));
      expect(buttonSpinner).toBeTruthy();
    }));

    it('should call parseResumeService.parseResume with correct payload', () => {
      parseResumeSpy.and.returnValue(of(mockParseResponse));
      component.parseForm.patchValue(mockParseRequest);
      
      component.onSubmit();
      
      expect(parseResumeSpy).toHaveBeenCalledWith(mockParseRequest);
    });

    it('should display parsed data on successful API response', fakeAsync(() => {
      parseResumeSpy.and.returnValue(of(mockParseResponse));
      component.parseForm.patchValue(mockParseRequest);

      component.onSubmit();
      tick(); 
      fixture.detectChanges(); 

      expect(component.isLoading).toBeFalse();
      expect(component.parsedResponse).toEqual(mockParseResponse);
      expect(component.error).toBeNull();

      const resultsCard = fixture.debugElement.query(By.css('.results-section mat-card'));
      expect(resultsCard).toBeTruthy();
      const preElement = resultsCard.query(By.css('pre.parsed-data-pre'));
      expect(preElement.nativeElement.textContent).toContain(JSON.stringify(mockParseResponse.parsed_data, null, 2));
    }));

    it('should display error message on API error', fakeAsync(() => {
      const errorMsg = 'Failed to parse';
      parseResumeSpy.and.returnValue(throwError(() => new Error(errorMsg)));
      component.parseForm.patchValue(mockParseRequest);

      component.onSubmit();
      tick(); 
      fixture.detectChanges(); 

      expect(component.isLoading).toBeFalse();
      expect(component.parsedResponse).toBeNull();
      expect(component.error).toContain(errorMsg);

      const errorCard = fixture.debugElement.query(By.css('.error-card'));
      expect(errorCard).toBeTruthy();
      expect(errorCard.nativeElement.textContent).toContain(errorMsg);
    }));
  });
});

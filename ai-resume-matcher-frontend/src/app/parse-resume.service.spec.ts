import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ParseResumeService, ParseResumeRequest, ParseResumeResponse } from './parse-resume.service';

describe('ParseResumeService', () => {
  let service: ParseResumeService;
  let httpMock: HttpTestingController;

  const mockParseResumeRequest: ParseResumeRequest = {
    resume: 'base64encodedstring',
    resume_type: 'pdf',
  };

  const mockParseResumeResponse: ParseResumeResponse = {
    filename: 'resume.pdf',
    resume_type: 'pdf',
    parsed_data: {
      text: 'This is the parsed resume text.',
      sections: {
        experience: ['Worked at TestCorp'],
        education: ['Degree from Test University']
      }
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ParseResumeService]
    });
    service = TestBed.inject(ParseResumeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding requests.
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseResume', () => {
    it('should return parsed resume data on successful POST request', () => {
      service.parseResume(mockParseResumeRequest).subscribe(response => {
        expect(response).toEqual(mockParseResumeResponse);
      });

      const req = httpMock.expectOne('/api/v1/parse-resume');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockParseResumeRequest);
      req.flush(mockParseResumeResponse);
    });

    it('should handle HTTP errors when parsing resume', () => {
      const errorMessage = 'Mock HTTP Error for ParseResume';
      const mockError = { status: 500, statusText: 'Server Error' };

      service.parseResume(mockParseResumeRequest).subscribe({
        next: () => fail('should have failed with the HTTP error'),
        error: (error: Error) => {
          expect(error).toBeTruthy();
          expect(error.message).toContain('Server returned code 500');
        }
      });

      const req = httpMock.expectOne('/api/v1/parse-resume');
      expect(req.request.method).toBe('POST');
      req.flush(errorMessage, mockError);
    });

    it('should handle network errors when parsing resume', () => {
      service.parseResume(mockParseResumeRequest).subscribe({
        next: () => fail('should have failed with the network error'),
        error: (error: Error) => {
          expect(error).toBeTruthy();
          expect(error.message).toContain('Client-side error'); // Updated to match service error handling
        }
      });
  
      const req = httpMock.expectOne('/api/v1/parse-resume');
      req.error(new ProgressEvent('network error'));
    });
    
    it('should include detailed error message from backend (FastAPI validation error format)', () => {
        const backendErrorDetail = [
          { loc: ["body", "resume_type"], msg: "value is not a valid enumeration member", type: "type_error.enum" }
        ];
        const mockErrorResponse = { detail: backendErrorDetail };
  
        service.parseResume(mockParseResumeRequest).subscribe({
          next: () => fail('should have failed with the HTTP error'),
          error: (error: Error) => {
            expect(error.message).toContain(`Details: ${backendErrorDetail[0].msg}`);
          }
        });
    
        const req = httpMock.expectOne('/api/v1/parse-resume');
        req.flush(mockErrorResponse, { status: 422, statusText: 'Unprocessable Entity' });
      });
  });
});

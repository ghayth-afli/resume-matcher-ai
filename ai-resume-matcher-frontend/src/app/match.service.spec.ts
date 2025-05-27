import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatchService, MatchRequest, MatchResponse, JobDescription, CompanyInfo, SkillsMatch } from './match.service';

describe('MatchService', () => {
  let service: MatchService;
  let httpMock: HttpTestingController;

  const mockJobDescription: JobDescription = {
    title: 'Software Engineer',
    description: 'Develop amazing software.',
    requirements: ['Angular', 'TypeScript'],
    responsibilities: ['Coding', 'Testing']
  };

  const mockCompanyInfo: CompanyInfo = {
    name: 'TestCorp',
    industry: 'Tech'
  };

  const mockMatchRequest: MatchRequest = {
    resume: 'Test resume content',
    resume_type: 'txt',
    job_description: mockJobDescription,
    job_id: 'job123',
    company_info: mockCompanyInfo
  };

  const mockSkillsMatch: SkillsMatch = {
    matching_skills: ['Angular', 'TypeScript'],
    missing_skills: ['Node.js'],
    skills_analysis: 'Good skill coverage.'
  };

  const mockMatchResponse: MatchResponse = {
    overall_score: 0.85,
    overall_interpretation: 'Strong Match',
    skills_match: mockSkillsMatch,
    red_flags: [],
    bonus_points: ['Team player'],
    role_type: 'Software Engineer',
    confidence_score: 0.9,
    insights: 'This candidate is a strong match for the role.'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MatchService]
    });
    service = TestBed.inject(MatchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding requests.
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('matchResume', () => {
    it('should return match response on successful POST request', () => {
      service.matchResume(mockMatchRequest).subscribe(response => {
        expect(response).toEqual(mockMatchResponse);
      });

      const req = httpMock.expectOne('/api/v1/match');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockMatchRequest);
      req.flush(mockMatchResponse);
    });

    it('should handle HTTP errors when matching resume', () => {
      const errorMessage = 'Mock HTTP Error for MatchResume';
      const mockError = { status: 400, statusText: 'Bad Request' };

      service.matchResume(mockMatchRequest).subscribe({
        next: () => fail('should have failed with the HTTP error'),
        error: (error: Error) => {
          expect(error).toBeTruthy();
          expect(error.message).toContain('Server returned code 400');
        }
      });

      const req = httpMock.expectOne('/api/v1/match');
      expect(req.request.method).toBe('POST');
      req.flush(errorMessage, mockError);
    });
    
    it('should handle network errors when matching resume', () => {
      service.matchResume(mockMatchRequest).subscribe({
        next: () => fail('should have failed with the network error'),
        error: (error: Error) => {
          expect(error).toBeTruthy();
          expect(error.message).toContain('Client-side or network error');
        }
      });
  
      const req = httpMock.expectOne('/api/v1/match');
      req.error(new ProgressEvent('network error'));
    });

    it('should include detailed error message from backend if available (string detail)', () => {
        const backendErrorDetail = 'Invalid resume format provided.';
        const mockErrorResponse = { detail: backendErrorDetail }; // Backend returns { "detail": "..." }
  
        service.matchResume(mockMatchRequest).subscribe({
          next: () => fail('should have failed with the HTTP error'),
          error: (error: Error) => {
            expect(error.message).toContain(`Details: ${backendErrorDetail}`);
          }
        });
    
        const req = httpMock.expectOne('/api/v1/match');
        req.flush(mockErrorResponse, { status: 422, statusText: 'Unprocessable Entity' });
      });
  
      it('should include detailed error message from backend if available (object list detail)', () => {
        const backendErrorDetail = [{ loc: ["body", "resume_type"], msg: "value is not a valid enumeration member", type: "type_error.enum"}];
        const mockErrorResponse = { detail: backendErrorDetail };
  
        service.matchResume(mockMatchRequest).subscribe({
          next: () => fail('should have failed with the HTTP error'),
          error: (error: Error) => {
            expect(error.message).toContain(`Details: ${backendErrorDetail[0].msg}`);
          }
        });
    
        const req = httpMock.expectOne('/api/v1/match');
        req.flush(mockErrorResponse, { status: 422, statusText: 'Unprocessable Entity' });
      });
  });
});

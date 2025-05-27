import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EvaluateRoleService, EvaluateRoleRequest, EvaluateRoleResponse, JobDescriptionInput } from './evaluate-role.service';

describe('EvaluateRoleService', () => {
  let service: EvaluateRoleService;
  let httpMock: HttpTestingController;

  const mockJobDescriptionInput: JobDescriptionInput = {
    title: 'Senior QA Engineer',
    description: 'Responsible for ensuring software quality through rigorous testing.',
    requirements: ['Selenium', 'CI/CD', 'Agile'],
    responsibilities: ['Test planning', 'Test execution', 'Bug reporting']
  };

  const mockEvaluateRoleRequest: EvaluateRoleRequest = {
    job_description: mockJobDescriptionInput
  };

  const mockEvaluateRoleResponse: EvaluateRoleResponse = {
    job_title: 'Senior QA Engineer',
    evaluation_id: 'eval_test_123',
    evaluation_results: {
      clarity_score: 0.9,
      completeness_score: 0.85,
      suggestions: ['Consider adding specific metrics for success.'],
      bias_check: {
        gender_bias: 'low',
        age_bias: 'low'
      }
    },
    summary: 'The job description is clear and mostly complete, with minor suggestions for improvement.'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EvaluateRoleService]
    });
    service = TestBed.inject(EvaluateRoleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding requests.
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('evaluateRole', () => {
    it('should return evaluation results on successful POST request', () => {
      service.evaluateRole(mockEvaluateRoleRequest).subscribe(response => {
        expect(response).toEqual(mockEvaluateRoleResponse);
      });

      const req = httpMock.expectOne('/api/v1/evaluate-role');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockEvaluateRoleRequest);
      req.flush(mockEvaluateRoleResponse);
    });

    it('should handle HTTP errors when evaluating role', () => {
      const errorMessage = 'Mock HTTP Error for EvaluateRole';
      const mockError = { status: 422, statusText: 'Unprocessable Entity' };

      service.evaluateRole(mockEvaluateRoleRequest).subscribe({
        next: () => fail('should have failed with the HTTP error'),
        error: (error: Error) => {
          expect(error).toBeTruthy();
          expect(error.message).toContain('Server returned code 422');
        }
      });

      const req = httpMock.expectOne('/api/v1/evaluate-role');
      expect(req.request.method).toBe('POST');
      req.flush(errorMessage, mockError);
    });
    
    it('should handle network errors when evaluating role', () => {
      service.evaluateRole(mockEvaluateRoleRequest).subscribe({
        next: () => fail('should have failed with the network error'),
        error: (error: Error) => {
          expect(error).toBeTruthy();
          expect(error.message).toContain('Client-side error');
        }
      });
  
      const req = httpMock.expectOne('/api/v1/evaluate-role');
      req.error(new ProgressEvent('network error'));
    });

    it('should parse and include FastAPI validation error details', () => {
        const backendErrorDetail = [
          { loc: ["body", "job_description", "title"], msg: "field required", type: "value_error.missing" }
        ];
        const mockErrorResponse = { detail: backendErrorDetail };
  
        service.evaluateRole(mockEvaluateRoleRequest).subscribe({
          next: () => fail('should have failed with the HTTP error'),
          error: (error: Error) => {
            expect(error.message).toContain(`Details: ${backendErrorDetail[0].msg}`);
          }
        });
    
        const req = httpMock.expectOne('/api/v1/evaluate-role');
        req.flush(mockErrorResponse, { status: 422, statusText: 'Unprocessable Entity' });
      });
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HealthCheckService, HealthStatus } from './health-check.service';

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HealthCheckService]
    });
    service = TestBed.inject(HealthCheckService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Make sure that there are no outstanding requests.
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getHealthStatus', () => {
    it('should return health status on successful GET request', () => {
      const mockHealthStatus: HealthStatus = {
        status: 'UP',
        service: 'ai-resume-matcher-backend',
        version: '1.0.0'
      };

      service.getHealthStatus().subscribe(response => {
        expect(response).toEqual(mockHealthStatus);
      });

      const req = httpMock.expectOne('/api/health');
      expect(req.request.method).toBe('GET');
      req.flush(mockHealthStatus);
    });

    it('should handle HTTP errors', () => {
      const errorMessage = 'Mock HTTP Error';
      const mockError = { status: 500, statusText: 'Server Error' };

      service.getHealthStatus().subscribe({
        next: () => fail('should have failed with the HTTP error'),
        error: (error: Error) => {
          expect(error).toBeTruthy();
          // Check if the error message contains parts of the expected error
          // The exact message might be modified by the handleError function
          expect(error.message).toContain('Server returned code 500');
        }
      });

      const req = httpMock.expectOne('/api/health');
      expect(req.request.method).toBe('GET');
      req.flush(errorMessage, mockError);
    });

    it('should handle network errors', () => {
        service.getHealthStatus().subscribe({
          next: () => fail('should have failed with the network error'),
          error: (error: Error) => {
            expect(error).toBeTruthy();
            expect(error.message).toContain('Client-side or network error');
          }
        });
    
        const req = httpMock.expectOne('/api/health');
        // Simulate a network error by calling error() on the mock request
        req.error(new ProgressEvent('network error')); 
      });
  });
});

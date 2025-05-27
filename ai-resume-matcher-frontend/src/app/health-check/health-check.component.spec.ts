import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HealthCheckComponent } from './health-check.component';
import { HealthCheckService, HealthStatus } from '../health-check.service';
import { of, throwError, Subject } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations'; // For Material components
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { By } from '@angular/platform-browser';

// Mock HealthCheckService
class MockHealthCheckService {
  // We'll spy on getHealthStatus and control its return value directly in tests.
  getHealthStatus() { 
    return new Subject<HealthStatus>().asObservable(); // Default to an observable that doesn't emit immediately
  }
}


describe('HealthCheckComponent', () => {
  let component: HealthCheckComponent;
  let fixture: ComponentFixture<HealthCheckComponent>;
  let healthCheckService: HealthCheckService; // Use the actual service type for the injected instance
  let getHealthStatusSpy: jasmine.Spy;

  const mockHealthyStatus: HealthStatus = {
    status: 'UP',
    service: 'Test Service',
    version: '1.0.0'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HealthCheckComponent, // Import the standalone component
        HttpClientTestingModule, // Service uses HttpClient, good to have for consistency if service wasn't fully mocked
        NoopAnimationsModule, 
        MatCardModule,
        MatProgressBarModule,
        MatIconModule,
        MatButtonModule
      ],
      providers: [
        { provide: HealthCheckService, useClass: MockHealthCheckService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HealthCheckComponent);
    component = fixture.componentInstance;
    healthCheckService = TestBed.inject(HealthCheckService); // Get the injected mock instance
    // Spy on the service's getHealthStatus method.
    getHealthStatusSpy = spyOn(healthCheckService, 'getHealthStatus').and.callThrough();
  });

  it('should create', () => {
    fixture.detectChanges(); // Trigger ngOnInit
    expect(component).toBeTruthy();
  });

  it('should call fetchHealthStatus (and thus getHealthStatus) on ngOnInit', () => {
    getHealthStatusSpy.and.returnValue(of(mockHealthyStatus)); // Ensure it returns something for this test
    fixture.detectChanges(); // ngOnInit
    expect(getHealthStatusSpy).toHaveBeenCalledTimes(1);
  });

  it('should display loading indicator while fetching data', fakeAsync(() => {
    getHealthStatusSpy.and.returnValue(new Subject<HealthStatus>()); // Observable that doesn't emit
    fixture.detectChanges(); // ngOnInit
    
    expect(component.isLoading).toBeTrue();
    const progressBar = fixture.debugElement.query(By.css('mat-progress-bar'));
    expect(progressBar).toBeTruthy();
    const loadingText = fixture.debugElement.query(By.css('.loading-container p'));
    expect(loadingText.nativeElement.textContent).toContain('Loading health status...');
    
    // No tick() needed here as we are checking synchronous state after detectChanges
  }));

  it('should display health status on successful data fetch', fakeAsync(() => {
    getHealthStatusSpy.and.returnValue(of(mockHealthyStatus));
    fixture.detectChanges(); // ngOnInit
    tick(); // Complete the observable
    fixture.detectChanges(); // Update view with data

    expect(component.isLoading).toBeFalse();
    expect(component.error).toBeNull();

    // Check data directly from component's async pipe subscription if possible, or rendered output
    const cardTitle = fixture.debugElement.query(By.css('mat-card-title'));
    expect(cardTitle.nativeElement.textContent).toContain(`Health Status: ${mockHealthyStatus.status}`);
    const serviceText = fixture.nativeElement.querySelector('mat-card-content p:nth-child(1)');
    expect(serviceText.textContent).toContain(`Service: ${mockHealthyStatus.service}`);
    const versionText = fixture.nativeElement.querySelector('mat-card-content p:nth-child(2)');
    expect(versionText.textContent).toContain(`Version: ${mockHealthyStatus.version}`);
  }));

  it('should display error message on data fetch error', fakeAsync(() => {
    const errorMsg = 'Test Error Message';
    getHealthStatusSpy.and.returnValue(throwError(() => new Error(errorMsg)));
    
    fixture.detectChanges(); // ngOnInit
    tick(); // Complete the observable
    fixture.detectChanges(); // Update view

    expect(component.isLoading).toBeFalse();
    expect(component.error).toContain(errorMsg); 
    
    const errorCard = fixture.debugElement.query(By.css('.error-card'));
    expect(errorCard).toBeTruthy();
    const errorCardTitle = errorCard.query(By.css('mat-card-title'));
    expect(errorCardTitle.nativeElement.textContent).toContain('Error Loading Health Status');
    const errorContent = errorCard.query(By.css('mat-card-content p'));
    expect(errorContent.nativeElement.textContent).toContain(errorMsg);
  }));

  it('should call fetchHealthStatus when onRetry is called', () => {
    getHealthStatusSpy.and.returnValue(of(mockHealthyStatus)); // Initial call
    fixture.detectChanges(); 
    expect(getHealthStatusSpy).toHaveBeenCalledTimes(1);

    getHealthStatusSpy.calls.reset(); // Reset spy for the next call
    getHealthStatusSpy.and.returnValue(of(mockHealthyStatus)); // Mock subsequent call

    component.onRetry();
    expect(getHealthStatusSpy).toHaveBeenCalledTimes(1); 
  });

  it('should show retry button on error and call onRetry when clicked', fakeAsync(() => {
    getHealthStatusSpy.and.returnValue(throwError(() => new Error('Test Error')));
    fixture.detectChanges(); 
    tick();
    fixture.detectChanges(); 

    const retryButtonDe = fixture.debugElement.query(By.css('.error-card button[mat-raised-button]'));
    expect(retryButtonDe).toBeTruthy();
    
    spyOn(component, 'fetchHealthStatus').and.callThrough(); // Spy on actual method called by onRetry
                                                            // or spy on onRetry itself
    
    retryButtonDe.nativeElement.click();
    tick(); // If onRetry involves async operations or state changes that need settling
    fixture.detectChanges();

    expect(component.fetchHealthStatus).toHaveBeenCalledTimes(1); // fetchHealthStatus is called by onRetry
                                                                // and getHealthStatusSpy is part of fetchHealthStatus
    // The spy on getHealthStatusSpy would be called twice (initial + retry)
    expect(getHealthStatusSpy.calls.count()).toBeGreaterThanOrEqual(2); // Initial + retry
  }));

});

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from './material.module';

import { AppComponent } from './app.component';
import { UploadComponent } from './components/upload/upload.component';
import { JobListingsComponent } from './components/job-listings/job-listings.component';
import { MatchesComponent } from './components/matches/matches.component';

@NgModule({
  declarations: [
    AppComponent,
    UploadComponent,
    JobListingsComponent,
    MatchesComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MaterialModule,
    RouterModule.forRoot([
      { path: 'upload', component: UploadComponent },
      { path: 'jobs', component: JobListingsComponent },
      { path: 'matches', component: MatchesComponent },
      { path: '', redirectTo: '/upload', pathMatch: 'full' }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
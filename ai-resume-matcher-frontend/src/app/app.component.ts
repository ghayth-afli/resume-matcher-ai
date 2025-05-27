import { Component } from '@angular/core';
import { LayoutComponent } from './layout/layout.component'; // Import the LayoutComponent

@Component({
  selector: 'app-root',
  standalone: true, // Add standalone: true
  imports: [LayoutComponent], // Import LayoutComponent here
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ai-resume-matcher-frontend';
}

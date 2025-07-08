import { Component } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-recordings-page',
  standalone: false,
  templateUrl: './recordings-page.component.html',
  styleUrl: './recordings-page.component.css'
})
export class RecordingsPageComponent { // Reverted to original class name
  searchEmail: string = '';
  searchedRecordings: any[] = []; // Consider creating a type/interface for AnswerRecording
  isLoadingRecordings: boolean = false;
  searchError: string | null = null;

  constructor(private http: HttpClient) {}

  fetchRecordingsByEmail(): void {
    if (!this.searchEmail || this.searchEmail.trim() === '') {
      this.searchError = 'Please enter an email to search.';
      this.searchedRecordings = [];
      return;
    }
    this.isLoadingRecordings = true;
    this.searchError = null;
    this.searchedRecordings = [];

    // Assuming the backend URL is the same base as others, just different endpoint
    // The actual AnswerRecording entity has more fields, adjust 'any[]' as needed
    this.http.get<any[]>(`/api/recordings/by-email/${this.searchEmail.trim()}`)
      .subscribe({
        next: (recordings) => {
          this.searchedRecordings = recordings;
          this.isLoadingRecordings = false;
        },
        error: (err) => {
          console.error('Error fetching recordings by email:', err);
          if (err.status === 404) {
            this.searchError = 'No recordings found for this email.';
          } else {
            this.searchError = 'An error occurred while fetching recordings.';
          }
          this.isLoadingRecordings = false;
        }
      });
  }
}


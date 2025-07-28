import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-recordings-page',
  standalone: false,
  templateUrl: './recordings-page.component.html',
  styleUrls: ['./recordings-page.component.css']
})
export class RecordingsPageComponent implements OnInit {
  users: any[] = [];
  selectedUser: any = null;
  searchedRecordings: any[] = [];
  isLoadingUsers: boolean = false;
  isLoadingRecordings: boolean = false;
  usersError: string | null = null;
  searchError: string | null = null;
  searchEmail: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.isLoadingUsers = true;
    this.usersError = null;
    this.http.get<any[]>('http://localhost:8080/api/recordings/users')
      .subscribe({
        next: (users) => {
          this.users = users;
          this.isLoadingUsers = false;
        },
        error: (err) => {
          console.error('Error fetching users:', err);
          this.usersError = 'An error occurred while fetching users.';
          this.isLoadingUsers = false;
        }
      });
  }

  fetchRecordingsByEmail(email: string): void {
    this.selectedUser = { email: email };
    this.isLoadingRecordings = true;
    this.searchError = null;
    this.searchedRecordings = [];

    this.http.get<any[]>(`/api/recordings/by-email/${email.trim()}`)
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

  search(): void {
    if (this.searchEmail) {
      this.fetchRecordingsByEmail(this.searchEmail);
    }
  }
}


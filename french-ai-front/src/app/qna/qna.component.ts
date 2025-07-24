// src/app/qna/qna.component.ts
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpResponse} from '@angular/common/http';
import {NgIf, NgFor, DatePipe} from '@angular/common'; // Added NgFor, DatePipe
import { FormsModule } from '@angular/forms'; // Added FormsModule
import {last} from 'rxjs';
import { Question, QuestionService } from '../services/question.service';

@Component({
  selector: 'app-qna',
  templateUrl: './qna.component.html',
  imports: [
    NgIf,
    NgFor, // Added for *ngFor
    FormsModule, // Added for [(ngModel)]
    //DatePipe // Added for date pipe
  ],
  styleUrls: ['./qna.component.css']
})
export class QnaComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  // Email
  userEmail: string | null = null;
  emailSubmitted: boolean = false;

  // Timer
  totalSeconds = 30 * 60; // 30 minutes in seconds
  countdownDisplay = '30:00';
  timerIntervalId: any;

  // Camera & recording
  mediaStream!: MediaStream;         // for camera preview
  audioStream!: MediaStream;         // for recording audio
  mediaRecorder!: MediaRecorder;     // to capture audio
  recordedChunks: Blob[] = [];
  isRecording = false;
  sessionCompleted = false;
  // Questionnaire logic
  sessionChatId!: string;
  questions: Question[] = [];

  questionIndex = 0;
  questionnaireStarted = false;

  get currentQuestion(): Question {
    return this.questions[this.questionIndex];
  }

  constructor(private http: HttpClient, private questionService: QuestionService) {
  }

  ngOnInit(): void {
    this.promptForEmail();
    this.questionService.getAll().subscribe(questions => {
      this.questions = questions;
    });
  }

  promptForEmail(): void {
    const email = window.prompt('Please enter your email to start the session:');
    if (email && email.trim() !== '') {
      this.userEmail = email.trim();
      this.emailSubmitted = true;
      // Proceed with session initialization
      this.initializeSession();
    } else {
      // Handle case where user cancels or enters no email
      alert('Email is required to start the session.');
      // Optionally, you could re-prompt or prevent further interaction
      // For now, we'll just alert and they'd have to refresh to try again or we can call promptForEmail again.
      // Let's re-prompt for simplicity here.
      this.promptForEmail();
    }
  }

  initializeSession(): void {
    if (!this.emailSubmitted || !this.userEmail) {
      // This should not happen if promptForEmail logic is correct
      alert('Critical error: Email not submitted before initialization.');
      return;
    }
    this.createSession();
    this.startCameraPreview();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    clearInterval(this.timerIntervalId);
    this.stopAllStreams();
  }

  createSession() {
    this.http
      .post<{ chatId: string }>('/api/session/create', {})
      .subscribe({
        next: (res) => {
          this.sessionChatId = res.chatId;
          console.log('New chatId:', this.sessionChatId);
        },
        error: (err) => {
          console.error('Error creating session:', err);
          alert('Impossible de démarrer la session.');
        },
      });
  }

  // 1) Start camera on page load
  async startCameraPreview() {
    try {
      // Only video for preview; we'll request audio separately for recording
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      const videoEl = this.videoElement.nativeElement;
      videoEl.srcObject = this.mediaStream;
      videoEl.play();
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Camera access is required.');
    }
  }

  // 2) 30-minute countdown
  startCountdown() {
    const updateDisplay = () => {
      const minutes = Math.floor(this.totalSeconds / 60);
      const seconds = this.totalSeconds % 60;
      this.countdownDisplay =
        String(minutes).padStart(2, '0') +
        ':' +
        String(seconds).padStart(2, '0');
      if (this.totalSeconds === 0) {
        clearInterval(this.timerIntervalId);
        this.closePage();
      } else {
        this.totalSeconds--;
      }
    };

    updateDisplay();
    this.timerIntervalId = setInterval(updateDisplay, 1000);
  }

  closePage() {
    // Attempt to close window. If not opened by script, redirect:
    window.close();
    window.location.href = 'about:blank';
  }

  // 3) Start questionnaire
  async startQuestionnaire() {
    this.questionnaireStarted = true;

    // Request audio permission now
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      // Prepare MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.audioStream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      this.mediaRecorder.onstop = () => {
        this.saveRecordingForCurrentQuestion();
      };
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone access is required to record audio.');
    }
  }

  // 4) Toggle recording on each question
  toggleRecording() {
    if (!this.isRecording) {
      // Start a fresh recording
      this.recordedChunks = [];
      this.mediaRecorder.start();
      this.isRecording = true;
    } else {
      // Stop recording: triggers onstop → saveRecordingForCurrentQuestion()
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  // in qna.component.ts

  saveRecordingForCurrentQuestion() {
    if (this.sessionCompleted) return;  // no double‐fires
    if (!this.userEmail) {
      alert('Error: Email not found. Cannot save recording.');
      console.error('User email is not set during saveRecordingForCurrentQuestion');
      return;
    }

    const blob = new Blob(this.recordedChunks, {type: 'audio/webm'});
    const formData = new FormData();
    formData.append('chatId', this.sessionChatId);
    formData.append('email', this.userEmail); // Add email to form data
    formData.append('questionIndex', this.questionIndex.toString());
    formData.append('file', blob, `answer_q${this.questionIndex}.webm`);

    this.http.post<{ count: number; triggered: boolean }>(
      '/api/recordings/upload',
      formData
    ).subscribe({
      next: () => {
        // if not the last question, bump the index…
        if (this.questionIndex < this.questions.length - 1) {
          this.questionIndex++;
        } else {
          // …otherwise fire your complete endpoint
          this.notifySessionComplete();
        }
      },
      error: err => {
        console.error('Upload failed:', err);
        alert('Failed to upload recording. Please try again.');
      }
    });
  }

  notifySessionComplete() {
    if (this.sessionCompleted) return;

    this.http.post<{ count: number; triggered: boolean }>(
      `/api/session/${this.sessionChatId}/complete`,
      {}
    ).subscribe({
      next: res => {
        // flip your guard so nothing else fires
        this.sessionCompleted = true;

        console.log(`CompleteSession: count=${res.count}, triggered=${res.triggered}`);
        if (res.triggered) {
          alert('Merci ! Vos 10 réponses ont été reçues. Traitement en cours.');
        } else {
          // In theory this should never happen if you only call it once the last
          // question is done and the server has exactly 10 recorded.
          alert(`Session finie, mais trigger=${res.triggered}. Voir console.`);
        }
      },
      error: err => {
        console.error('Error marking session complete:', err);
        alert('Erreur lors de la soumission finale.');
      }
    });
  }
  stopAllStreams() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(t => t.stop());
    }
  }

  // Removed properties and method for fetching recordings by email
  // searchEmail: string = '';
  // searchedRecordings: any[] = [];
  // isLoadingRecordings: boolean = false;
  // searchError: string | null = null;
  // fetchRecordingsByEmail(): void { ... }
}

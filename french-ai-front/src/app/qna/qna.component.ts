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
  questions: string[] = [
    'Question 1: Pouvez-vous vous présenter en quelques phrases ? Décrivez votre parcours, vos compétences en français et vos motivations pour ce poste en centre d\'appels.',
    'Question 2: Expliquez à un client non spécialiste, en français clair, le principe de fonctionnement d\'un panneau photovoltaïque.',
    'Question 3: Quelle est la différence entre une pompe à chaleur et un boiler thermique ? Formulez votre réponse comme si vous parliez à un prospect.',
    'Question 4: Citez cinq termes techniques liés à nos solutions (photovoltaïque, pompe à chaleur, boiler thermique) et définissez brièvement chacun d\'eux.',
    'Question 5: Simulation d\'appel : un client trouve votre offre de maintenance de pompe à chaleur trop chère. Que lui répondez-vous pour le convaincre de la valeur ajoutée de votre service ?',
    'Question 6: Un client mécontent se plaint du délai d\'installation trop long. Comment reformulez-vous son problème et quelle solution proposez-vous ?',
    'Question 7: Rédigez en français un court email de relance à un prospect qui n\'a pas donné suite à votre devis pour l\'installation de panneaux solaires.',
    'Question 8: Un client vous appelle car son boiler thermique est en panne et il a besoin d\'eau chaude immédiatement. Quel processus de prise en charge décrivez-vous ?',
    'Question 9: Comment modifiez-vous votre ton et votre vocabulaire selon que votre interlocuteur est un particulier prudent ou un professionnel pressé ? Donnez un exemple de phrase d\'accroche pour chacun.',
    'Question 10: Simulez un scénario d\'appel où vous proposez l’ensemble de nos solutions (photovoltaïque + pompe à chaleur + boiler thermique) à un client intéressé par l’efficacité énergétique de son logement. Structurez votre argumentaire en trois étapes clés.'
  ];

  questionIndex = 0;
  questionnaireStarted = false;

  get currentQuestion(): string {
    return this.questions[this.questionIndex];
  }

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    this.promptForEmail();
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
      .post<{ chatId: string }>('http://localhost:8080/api/session/create', {})
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
      'http://localhost:8080/api/recordings/upload',
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
      `http://localhost:8080/api/session/${this.sessionChatId}/complete`,
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

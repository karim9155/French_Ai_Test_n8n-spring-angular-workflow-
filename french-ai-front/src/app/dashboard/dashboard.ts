import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Question, QuestionService } from '../services/question.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  emails: string[] = [];
  questions: Question[] = [];
  newQuestion: Question = { id: 0, text: '', questionIndex: 0 };
  editingQuestion: Question | null = null;

  constructor(private http: HttpClient, private questionService: QuestionService) { }

  ngOnInit(): void {
    this.http.get<string[]>('/api/recordings/distinct-emails').subscribe(emails => {
      this.emails = emails;
    });
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.questionService.getAll().subscribe(questions => {
      this.questions = questions;
    });
  }

  addQuestion(): void {
    this.questionService.add(this.newQuestion).subscribe(() => {
      this.loadQuestions();
      this.newQuestion = { id: 0, text: '', questionIndex: 0 };
    });
  }

  deleteQuestion(id: number): void {
    this.questionService.delete(id).subscribe(() => {
      this.loadQuestions();
    });
  }

  editQuestion(question: Question): void {
    this.editingQuestion = { ...question };
  }

  cancelEdit(): void {
    this.editingQuestion = null;
  }

  updateQuestion(): void {
    if (this.editingQuestion) {
      this.questionService.update(this.editingQuestion.id, this.editingQuestion).subscribe(() => {
        this.loadQuestions();
        this.editingQuestion = null;
      });
    }
  }
}

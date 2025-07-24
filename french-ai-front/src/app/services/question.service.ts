import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Question {
  id: number;
  text: string;
  questionIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class QuestionService {

  private apiUrl = '/api/questions';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Question[]> {
    return this.http.get<Question[]>(this.apiUrl);
  }

  add(question: Question): Observable<Question> {
    return this.http.post<Question>(this.apiUrl, question);
  }

  update(id: number, question: Question): Observable<Question> {
    return this.http.put<Question>(`${this.apiUrl}/${id}`, question);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

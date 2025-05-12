import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Question } from '../../models/campagne.model';
import { QuestionService } from '../../Services/question.service';

@Component({
  selector: 'app-question',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,RouterLink],
  templateUrl: './question.component.html',
  styleUrl: './question.component.css'
})
export class QuestionComponent implements OnInit {  
  questions: Question[] = [];
  questionForm: FormGroup;
  error: string = '';
  loading = false;
  submitting = false;

  constructor(
    private questionService: QuestionService,
    private fb: FormBuilder
  ) {
    this.questionForm = this.fb.group({
      texte: ['', Validators.required],
    
    });
  }

  ngOnInit(): void {
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.loading = true;
    this.questionService.getAllQuestions().subscribe({
      next: (data) => {
        this.questions = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load questions';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.questionForm.invalid) return;

    this.submitting = true;
    const newQuestion: Question = this.questionForm.value;

    this.questionService.createQuestion(newQuestion).subscribe({
      next: (created) => {
        this.questions.push(created);
        this.questionForm.reset();
        this.submitting = false;
      },
      error: () => {
        this.error = 'Failed to create question';
        this.submitting = false;
      }
    });
  }

  deleteQuestion(id: number): void {
    if (confirm('Are you sure you want to delete this question?')) {
      this.questionService.deleteQuestion(id).subscribe(() => {
        this.questions = this.questions.filter(q => q.id !== id);
      });
    }
  }
  }
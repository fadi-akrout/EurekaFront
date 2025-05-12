import { Injectable } from '@angular/core';
import  { HttpClient } from "@angular/common/http"
import  { Observable } from "rxjs"
import  { Feedback } from "../models/campagne.model"
import { environment } from "../../environment/environment"
@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = `${environment.apiUrl}/api/feedbacks`

  constructor(private http: HttpClient) {}

  getAllFeedbacks(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(this.apiUrl)
  }

  getFeedbackById(id: number): Observable<Feedback> {
    return this.http.get<Feedback>(`${this.apiUrl}/${id}`)
  }

  getFeedbacksByCampaign(campaignId: number): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.apiUrl}/campagne/${campaignId}`)
  }

  getAverageRatingForCampaign(campaignId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/campagne/${campaignId}/note-moyenne`)
  }

  createFeedback(feedback: Feedback): Observable<Feedback> {
    return this.http.post<Feedback>(this.apiUrl, feedback)
  }

  updateFeedback(id: number, feedback: Feedback): Observable<Feedback> {
    return this.http.put<Feedback>(`${this.apiUrl}/${id}`, feedback)
  }

  deleteFeedback(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
  }
}

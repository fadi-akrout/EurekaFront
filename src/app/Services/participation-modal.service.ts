import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ParticipationModalConfig {
  type: 'success' | 'info' | 'warning';
  icon: string;
  title: string;
  message: string;
  details?: { label: string; value: string }[];
  autoClose?: boolean;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ParticipationModalService {
  private modalSubject = new BehaviorSubject<ParticipationModalConfig | null>(null);
  public modal$ = this.modalSubject.asObservable();

  private showModalSubject = new BehaviorSubject<boolean>(false);
  public showModal$ = this.showModalSubject.asObservable();

  constructor() {}

  showSuccess(title: string, message: string, details?: { label: string; value: string }[], autoClose: boolean = true): void {
    this.showModal({
      type: 'success',
      icon: 'fas fa-check-circle',
      title,
      message,
      details,
      autoClose,
      duration: 5000
    });
  }

  showInfo(title: string, message: string, details?: { label: string; value: string }[], autoClose: boolean = false): void {
    this.showModal({
      type: 'info',
      icon: 'fas fa-info-circle',
      title,
      message,
      details,
      autoClose,
      duration: 0
    });
  }

  showWarning(title: string, message: string, details?: { label: string; value: string }[], autoClose: boolean = false): void {
    this.showModal({
      type: 'warning',
      icon: 'fas fa-exclamation-triangle',
      title,
      message,
      details,
      autoClose,
      duration: 0
    });
  }

  showParticipationApproved(panelistName: string, campaignName: string, email: string): void {
    this.showSuccess(
      '🎉 Participation Approved!',
      'The panelist has been successfully approved to participate in this campaign.',
      [
        { label: 'Panelist', value: panelistName },
        { label: 'Email', value: email },
        { label: 'Campaign', value: campaignName },
        { label: 'Status', value: 'Approved' }
      ]
    );
  }

  showParticipationRejected(panelistName: string, campaignName: string, email: string): void {
    this.showInfo(
      '📋 Participation Declined',
      'The participation request has been declined. The panelist will be notified of this decision.',
      [
        { label: 'Panelist', value: panelistName },
        { label: 'Email', value: email },
        { label: 'Campaign', value: campaignName },
        { label: 'Status', value: 'Declined' }
      ]
    );
  }

  showParticipationSubmitted(campaignName: string): void {
    this.showSuccess(
      '✨ Participation Request Submitted!',
      'Your participation request has been successfully submitted and is now pending review.',
      [
        { label: 'Campaign', value: campaignName },
        { label: 'Status', value: 'Pending Review' },
        { label: 'Next Step', value: 'Wait for approval notification' }
      ]
    );
  }

  showParticipationStatusUpdate(status: string, campaignName: string, message: string): void {
    const config = status === 'approved' ? 'success' : status === 'rejected' ? 'info' : 'warning';
    const icon = status === 'approved' ? '🎉' : status === 'rejected' ? '📋' : '⏳';
    
    this.showModal({
      type: config,
      icon: config === 'success' ? 'fas fa-check-circle' : config === 'info' ? 'fas fa-info-circle' : 'fas fa-clock',
      title: `${icon} Participation ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message,
      details: [
        { label: 'Campaign', value: campaignName },
        { label: 'Status', value: status.charAt(0).toUpperCase() + status.slice(1) }
      ],
      autoClose: config === 'success'
    });
  }

  showWelcomeMessage(campaignName: string, userName: string): void {
    this.showSuccess(
      '🌟 Welcome to the Campaign!',
      'Thank you for your interest in participating. Your request has been submitted successfully.',
      [
        { label: 'Participant', value: userName },
        { label: 'Campaign', value: campaignName },
        { label: 'Next Steps', value: 'Wait for approval from campaign owner' },
        { label: 'Estimated Review Time', value: '24-48 hours' }
      ]
    );
  }

  showCampaignJoinConfirmation(campaignName: string, userName: string, userEmail: string): void {
    this.showSuccess(
      '🎯 Ready to Make an Impact!',
      'Your participation request is now in the queue. We\'ll notify you once the campaign owner reviews your application.',
      [
        { label: 'Participant', value: userName },
        { label: 'Email', value: userEmail },
        { label: 'Campaign', value: campaignName },
        { label: 'Status', value: 'Pending Review' },
        { label: 'What\'s Next?', value: 'Check your email for updates' }
      ]
    );
  }

  showError(title: string, message: string, details?: { label: string; value: string }[]): void {
    this.showWarning(title, message, details);
  }

  private showModal(config: ParticipationModalConfig): void {
    this.modalSubject.next(config);
    this.showModalSubject.next(true);

    if (config.autoClose && config.duration && config.duration > 0) {
      setTimeout(() => {
        this.closeModal();
      }, config.duration);
    }
  }

  closeModal(): void {
    this.showModalSubject.next(false);
    setTimeout(() => {
      this.modalSubject.next(null);
    }, 300); // Wait for animation to complete
  }
}
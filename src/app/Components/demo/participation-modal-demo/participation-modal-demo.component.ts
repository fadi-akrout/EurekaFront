import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipationModalService } from '../../../Services/participation-modal.service';
import { ParticipationModalComponent } from '../../shared/participation-modal/participation-modal.component';

@Component({
  selector: 'app-participation-modal-demo',
  standalone: true,
  imports: [CommonModule, ParticipationModalComponent],
  templateUrl: './participation-modal-demo.component.html',
  styleUrls: ['./participation-modal-demo.component.css']
})
export class ParticipationModalDemoComponent {

  constructor(private modalService: ParticipationModalService) {}

  showApprovedModal(): void {
    this.modalService.showParticipationApproved(
      'John Doe',
      'Summer Product Testing Campaign',
      'john.doe@example.com'
    );
  }

  showRejectedModal(): void {
    this.modalService.showParticipationRejected(
      'Jane Smith',
      'Winter Fashion Review Campaign',
      'jane.smith@example.com'
    );
  }

  showSubmittedModal(): void {
    this.modalService.showParticipationSubmitted('Tech Gadget Evaluation Campaign');
  }

  showJoinConfirmationModal(): void {
    this.modalService.showCampaignJoinConfirmation(
      'Luxury Beauty Products Campaign',
      'Alice Johnson',
      'alice.johnson@example.com'
    );
  }

  showWelcomeModal(): void {
    this.modalService.showWelcomeMessage(
      'Eco-Friendly Products Campaign',
      'Bob Wilson'
    );
  }

  showErrorModal(): void {
    this.modalService.showError(
      '⚠️ Connection Failed',
      'Unable to process your request due to network issues. Please check your connection and try again.',
      [
        { label: 'Error Code', value: 'NET_001' },
        { label: 'Timestamp', value: new Date().toLocaleString() },
        { label: 'Suggested Action', value: 'Retry in a few moments' }
      ]
    );
  }

  showStatusUpdateModal(): void {
    this.modalService.showParticipationStatusUpdate(
      'approved',
      'Mobile App Testing Campaign',
      'Congratulations! Your participation has been approved. You can now start providing feedback.'
    );
  }

  showCustomSuccessModal(): void {
    this.modalService.showSuccess(
      '🎊 Outstanding Performance!',
      'You have successfully completed all campaign requirements and earned bonus points.',
      [
        { label: 'Campaign', value: 'Premium Electronics Review' },
        { label: 'Completion Rate', value: '100%' },
        { label: 'Bonus Points', value: '+50 points' },
        { label: 'Next Level', value: 'Gold Reviewer' }
      ]
    );
  }

  showCustomInfoModal(): void {
    this.modalService.showInfo(
      '📋 Campaign Guidelines Updated',
      'The campaign guidelines have been updated with new requirements. Please review them before proceeding.',
      [
        { label: 'Updated', value: 'Today, 2:30 PM' },
        { label: 'Changes', value: 'New feedback format' },
        { label: 'Action Required', value: 'Review guidelines' }
      ]
    );
  }

  showCustomWarningModal(): void {
    this.modalService.showWarning(
      '⏰ Deadline Approaching',
      'You have 24 hours remaining to submit your feedback for this campaign.',
      [
        { label: 'Campaign', value: 'Smart Home Devices Review' },
        { label: 'Deadline', value: 'Tomorrow, 11:59 PM' },
        { label: 'Progress', value: '75% Complete' },
        { label: 'Remaining Tasks', value: '2 reviews pending' }
      ]
    );
  }
}
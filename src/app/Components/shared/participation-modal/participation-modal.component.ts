import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ParticipationModalService, ParticipationModalConfig } from '../../../Services/participation-modal.service';

@Component({
  selector: 'app-participation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './participation-modal.component.html',
  styleUrls: ['./participation-modal.component.css']
})
export class ParticipationModalComponent implements OnInit, OnDestroy {
  showModal = false;
  modalConfig: ParticipationModalConfig | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(private modalService: ParticipationModalService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.modalService.showModal$.subscribe(show => {
        this.showModal = show;
      }),
      this.modalService.modal$.subscribe(config => {
        this.modalConfig = config;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  closeModal(): void {
    this.modalService.closeModal();
  }
}
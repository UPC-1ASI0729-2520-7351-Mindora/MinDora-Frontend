import { Component, signal, Input, Output, EventEmitter, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-video-call-modal',
  imports: [CommonModule, TranslateModule],
  templateUrl: './video-call-modal.component.html',
  styleUrl: './video-call-modal.component.css',
})
export class VideoCallModalComponent {
  @Input() psychologistName = '';
  @Input() appointmentTime = '';
  @Output() close = new EventEmitter<void>();

  callStatus = signal<'connecting' | 'connected' | 'ended'>('connecting');
  callDuration = signal(0);
  isMicMuted = signal(false);
  isCameraOff = signal(false);
  isScreenSharing = signal(false);

  private durationInterval: any = null;

  constructor() {
    effect(() => {
      if (this.callStatus() === 'connected') {
        this.startDurationTimer();
      } else {
        this.stopDurationTimer();
      }
    });

    // Simulate connection after 2 seconds
    setTimeout(() => {
      this.callStatus.set('connected');
    }, 2000);
  }

  ngOnDestroy() {
    this.stopDurationTimer();
  }

  private startDurationTimer() {
    this.stopDurationTimer();
    this.durationInterval = setInterval(() => {
      this.callDuration.set(this.callDuration() + 1);
    }, 1000);
  }

  private stopDurationTimer() {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
  }

  formatDuration(): string {
    const seconds = this.callDuration();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  toggleMic() {
    this.isMicMuted.set(!this.isMicMuted());
  }

  toggleCamera() {
    this.isCameraOff.set(!this.isCameraOff());
  }

  toggleScreenShare() {
    this.isScreenSharing.set(!this.isScreenSharing());
  }

  endCall() {
    this.callStatus.set('ended');
    setTimeout(() => {
      this.close.emit();
    }, 2000);
  }

  closeModal() {
    this.stopDurationTimer();
    this.close.emit();
  }
}

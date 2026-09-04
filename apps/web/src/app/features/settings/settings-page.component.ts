import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import type { BackupPayload } from '@presupuesto/shared';
import { AuthService } from '../../core/auth/auth.service';
import { BackupApi } from '../../core/api/backup.service';
import { NotificationsService } from '../../core/notifications.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
})
export class SettingsPageComponent {
  private readonly api = inject(BackupApi);
  private readonly notifications = inject(NotificationsService);
  protected readonly auth = inject(AuthService);

  readonly exporting = signal(false);
  readonly importing = signal(false);

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  exportBackup(): void {
    this.exporting.set(true);
    this.api.export().subscribe({
      next: (data) => {
        this.downloadJson(data);
        this.exporting.set(false);
        this.notifications.success('Copia de seguridad descargada');
      },
      error: () => this.exporting.set(false),
    });
  }

  private downloadJson(data: BackupPayload): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `presupuesto-backup-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  triggerImport(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!confirm(
      '⚠ Esto BORRARÁ todos tus datos actuales (cuentas, movimientos, presupuesto...) '
      + 'y los sustituirá por los del fichero. ¿Continuar?',
    )) {
      input.value = '';
      return;
    }

    this.importing.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result as string) as BackupPayload;
        this.api.import(payload).subscribe({
          next: () => {
            this.notifications.success('Datos restaurados correctamente');
            this.importing.set(false);
            input.value = '';
          },
          error: () => { this.importing.set(false); input.value = ''; },
        });
      } catch {
        this.notifications.error('El fichero no es una copia de seguridad válida');
        this.importing.set(false);
        input.value = '';
      }
    };
    reader.readAsText(file);
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App implements OnInit {
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    // Comprueba que el token guardado en localStorage siga siendo válido; si no,
    // el errorInterceptor se encarga de cerrar sesión al recibir el 401.
    if (this.auth.isAuthenticated()) {
      this.auth.refreshMe().subscribe();
    }
  }
}

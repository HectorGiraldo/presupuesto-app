import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Consola de depuración sobre la propia página (Eruda): un botón flotante que
// abre consola, red, elementos y almacenamiento. Pensada para depurar en el
// móvil sin Mac, sin cable y sin desplegar.
//   ?debug=1  -> la activa y la deja recordada en este dispositivo
//   ?debug=0  -> la desactiva
// No entra en el bundle inicial: el import solo se descarga si está activada.
try {
  const debugParam = new URLSearchParams(location.search).get('debug');
  if (debugParam === '1') localStorage.setItem('debug', '1');
  if (debugParam === '0') localStorage.removeItem('debug');
  if (localStorage.getItem('debug') === '1') {
    import('eruda').then((m) => m.default.init()).catch(() => {});
  }
} catch {
  /* localStorage puede fallar en modo privado; la depuración es opcional */
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

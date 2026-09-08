// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// A user can keep the app open while Render publishes a new Angular build. The
// open page then references an old lazy chunk that no longer exists. Recover by
// loading the latest index once with a cache-busting query parameter.
const staleChunkPattern = /ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module|Expected a JavaScript-or-Wasm module script/i;
const reloadKey = 'orderflow_stale_chunk_reload';
const recoverFromStaleChunk = (reason: unknown) => {
  const message = reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason || '');
  if (!staleChunkPattern.test(message) || sessionStorage.getItem(reloadKey)) return;
  sessionStorage.setItem(reloadKey, 'true');
  const url = new URL(window.location.href);
  url.searchParams.set('_refresh', Date.now().toString());
  window.location.replace(url.toString());
};

window.addEventListener('error', event => {
  const target = event.target as HTMLScriptElement | null;
  if (target?.tagName === 'SCRIPT' && target.src) recoverFromStaleChunk(`Loading chunk failed: ${target.src}`);
  else recoverFromStaleChunk(event.error || event.message);
}, true);
window.addEventListener('unhandledrejection', event => recoverFromStaleChunk(event.reason));
window.setTimeout(() => sessionStorage.removeItem(reloadKey), 10000);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

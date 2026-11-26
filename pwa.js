(() => {
  'use strict';
  let pendingInstall = null;
  let installed = false;
  let serviceWorkerState = 'pending';
  let returnFocus = null;
  const standalone = window.matchMedia('(display-mode: standalone)');
  const isInstalled = () => installed || standalone.matches || navigator.standalone === true;

  function refreshButtons() {
    document.querySelectorAll('[data-pwa-install]').forEach(button => {
      button.hidden = isInstalled();
      button.dataset.pwaState = isInstalled() ? 'installed' : pendingInstall ? 'ready' : 'manual';
    });
  }
  window.AppPWA = { refreshButtons };

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    pendingInstall = event;
    refreshButtons();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    pendingInstall = null;
    closeHelp();
    refreshButtons();
    if (typeof toast === 'function') toast('Programėlė įdiegta. Ją rasite savo įrenginio programėlių sąraše.');
  });
  standalone.addEventListener?.('change', refreshButtons);

  function registrationText() {
    if (serviceWorkerState === 'ready') return 'Programėlės failai paruošti.';
    if (serviceWorkerState === 'pending') return 'Ruošiami programėlės failai…';
    return 'Jei įdiegimo parinkties nėra, atnaujinkite puslapį prisijungę prie interneto.';
  }

  function closeHelp() {
    document.getElementById('pwa-help')?.remove();
    if (!document.querySelector('.modal-backdrop')) document.body.style.overflow = '';
    if (returnFocus?.isConnected) returnFocus.focus();
  }

  function showHelp() {
    if (document.getElementById('pwa-help')) return;
    returnFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.id = 'pwa-help';
    overlay.className = 'pwa-overlay';
    overlay.innerHTML = `<section class="pwa-dialog" role="dialog" aria-modal="true" aria-labelledby="pwa-title">
      <button class="pwa-close" type="button" data-pwa-close aria-label="Uždaryti įdiegimo instrukciją">×</button>
      <img class="pwa-icon" src="assets/pvmount-logo.png" width="64" height="64" alt="">
      <div class="eyebrow">PVMOUNT · KOMANDŲ VALDYMAS</div>
      <h2 id="pwa-title">Išsisaugokite kaip programėlę</h2>
      <p>Turėsite savo piktogramą ir galėsite atidaryti sistemą atskirame lange.</p>
      <div class="pwa-instructions">
        <div><strong>Kompiuteryje · Edge arba Chrome</strong><p>Naršyklės adreso juostoje pasirinkite įdiegimo piktogramą arba meniu parinktį „Įdiegti šią svetainę kaip programėlę“ / „Install“.</p></div>
        <div><strong>Android · Chrome</strong><p>Naršyklės meniu ⋮ pasirinkite „Įdiegti programėlę“ arba „Pridėti prie pagrindinio ekrano“ ir patvirtinkite įdiegimą.</p></div>
        <div><strong>iPhone arba iPad · Safari</strong><p>Paspauskite bendrinimo mygtuką, pasirinkite „Pridėti prie pradžios ekrano“ („Add to Home Screen“) ir „Pridėti“.</p></div>
      </div>
      <p class="pwa-status" role="status">${registrationText()}</p>
      <p class="pwa-note">Programėlei atidaryti reikia interneto ryšio. Demo duomenys saugomi šiame įrenginyje.</p>
      <button class="btn primary" type="button" data-pwa-close>Supratau</button>
    </section>`;
    document.body.append(overlay);
    document.body.style.overflow = 'hidden';
    overlay.querySelector('[data-pwa-close]').focus();
  }

  document.addEventListener('click', async event => {
    if (event.target.closest('[data-pwa-close]') || event.target.id === 'pwa-help') {
      closeHelp();
      return;
    }
    const button = event.target.closest('[data-pwa-install]');
    if (!button || isInstalled()) return;
    if (!pendingInstall) {
      showHelp();
      return;
    }
    const prompt = pendingInstall;
    pendingInstall = null;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      showHelp();
    } finally {
      refreshButtons();
    }
  });

  document.addEventListener('keydown', event => {
    const help = document.getElementById('pwa-help');
    if (!help) return;
    if (event.key === 'Escape') closeHelp();
    if (event.key !== 'Tab') return;
    const buttons = help.querySelectorAll('button');
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });

  async function registerWorker() {
    try {
      if (!('serviceWorker' in navigator) || !window.isSecureContext) {
        serviceWorkerState = 'unavailable';
        return;
      }
      const url = new URL('sw.js', document.baseURI);
      const registration = await navigator.serviceWorker.register(url, { scope: './', updateViaCache: 'none' });
      await navigator.serviceWorker.ready;
      serviceWorkerState = 'ready';
      registration.update().catch(() => {});
    } catch (error) {
      serviceWorkerState = 'unavailable';
      console.warn('PWA registration unavailable:', error.message);
    } finally {
      const status = document.querySelector('#pwa-help .pwa-status');
      if (status) status.textContent = registrationText();
      document.documentElement.dataset.pwaWorker = serviceWorkerState;
    }
  }
  refreshButtons();
  registerWorker();
})();

/**
 * One-time cleanup for browsers that cached a broken Workbox service worker.
 * Bump SW_RECOVERY_VERSION when shipping a service-worker behavior change.
 */
const SW_RECOVERY_VERSION = '2';
const SW_RECOVERY_STORAGE_KEY = 'cm-sw-recovery-version';

const RECOVERY_SCRIPT = `(() => {
  var version = '${SW_RECOVERY_VERSION}';
  var key = '${SW_RECOVERY_STORAGE_KEY}';
  try {
    if (localStorage.getItem(key) === version) return;
    localStorage.setItem(key, version);
  } catch (e) {
    return;
  }
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    if (!regs.length) return;
    Promise.all(regs.map(function (reg) { return reg.unregister(); }))
      .then(function () {
        if (!('caches' in window)) {
          location.reload();
          return;
        }
        return caches.keys().then(function (keys) {
          return Promise.all(keys.map(function (key) { return caches.delete(key); }));
        }).then(function () {
          location.reload();
        });
      });
  });
})();`;

export function ServiceWorkerRecovery() {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: RECOVERY_SCRIPT }}
    />
  );
}

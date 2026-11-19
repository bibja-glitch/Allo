const statusEl = document.getElementById('status');
if (statusEl) {
  fetch('/api/health')
    .then((r) => r.json())
    .then((data) => {
      statusEl.textContent = JSON.stringify(data, null, 2);
    })
    .catch(() => {
      statusEl.textContent = 'Telegram Bot Webhook Service Active';
    });
}
export {};

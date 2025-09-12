const apiBase = 'http://127.0.0.1:5000/api';

document.getElementById('qform').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const payload = {
    branch: form.get('branch') || '',
    max_fees: Number(form.get('max_fees')) || null
  };
  const res = await fetch(apiBase + '/recommend', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  const cont = document.getElementById('results');
  cont.innerHTML = json.results.map(r => `
    <div class="card">
      <h3>${r.name}</h3>
      <p>${r.location} — ₹${r.fees}</p>
      <p>Branches: ${r.branches.join(', ')}</p>
    </div>
  `).join('');
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(console.error);
}


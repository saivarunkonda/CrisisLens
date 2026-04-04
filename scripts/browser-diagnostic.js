/**
 * Browser Console Diagnostic Script
 * Add this to the browser console to identify the exact error source
 */

// Paste this in your browser console (F12 → Console tab)

// 1. Check if data is undefined
console.log('Data object:', window.__NEXT_DATA__);

// 2. Check API response
fetch('/api/risk')
  .then(r => r.json())
  .then(data => {
    console.log('API Response:', data);
    console.log('Risks array:', data.risks);
    console.log('Risks type:', typeof data.risks);
    console.log('Is Array?', Array.isArray(data.risks));
  })
  .catch(err => console.error('API Error:', err));

// 3. Monitor for runtime errors
window.addEventListener('error', (e) => {
  console.error('Runtime Error:', e.message);
  console.error('Error location:', e.filename, 'Line:', e.lineno);
});

// 4. Check Next.js hydration
window.addEventListener('load', () => {
  console.log('Page loaded');
  console.log('React version:', React?.version);
});

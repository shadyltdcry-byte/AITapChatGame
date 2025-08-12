const fetch = require('node-fetch');

async function getDebugAdvice(code, error) {
  try {
    const response = await fetch('http://localhost:5000/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, error })
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const data = await response.json();
    return data.advice;
  } catch (err) {
    console.error('Failed to get debug advice:', err);
    return 'Could not get debug advice.';
  }
}

(async () => {
  const codeSnippet = `
try {
  const x = y + 2;
} catch (error) {
  console.log(error);
}`;
  const errorMsg = 'ReferenceError: y is not defined';

  const advice = await getDebugAdvice(codeSnippet, errorMsg);
  console.log('Mistral AI Debug Advice:', advice);
})();
const fetch = require('node-fetch');

const apiKey = process.env.MISTRAL_API_KEY;
const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

async function sendToMistral(prompt) {
  const body = JSON.stringify({
    inputs: prompt,
    parameters: {
      max_new_tokens: 512,
      temperature: 0.7
    }
  });

  try {
    const response = await fetch('https://api-inference.huggingface.co/models/mistral/devstral', {
      method: 'POST',
      headers,
      body
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data[0]?.generated_text || 'No response from model';
    return generatedText;
  } catch (error) {
    console.error('Error calling Mistral API:', error);
    return null;
  }
}

(async () => {
  const prompt = `You are a helpful assistant. Explain why this JavaScript code throws an error and suggest a fix:

try {
  const x = y + 2;
} catch (error) {
  console.log(error);
}

Error message: ReferenceError: y is not defined`;

  const response = await sendToMistral(prompt);
  console.log('Mistral says:', response);
})();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
const PORT = 5000;

app.use(bodyParser.json());

const apiKey = process.env.MISTRAL_API_KEY;
const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

async function askMistral(prompt) {
  const body = JSON.stringify({
    inputs: prompt,
    parameters: { max_new_tokens: 512, temperature: 0.7 }
  });

  const response = await fetch('https://api-inference.huggingface.co/models/mistral/devstral', {
    method: 'POST',
    headers,
    body
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data[0]?.generated_text || 'No response from model';
}

app.post('/debug', async (req, res) => {
  const { code, error } = req.body;
  const prompt = `You are a helpful AI. Explain this code and error:\nCode:\n${code}\nError:\n${error}`;

  try {
    const advice = await askMistral(prompt);
    res.json({ advice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
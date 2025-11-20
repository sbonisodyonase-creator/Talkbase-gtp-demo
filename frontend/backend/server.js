import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(process.cwd(), '../frontend')));

function extractTasks(reply) {
  const match = reply.match(/TASKS:\s*(.+)/i);
  if (!match) return [];
  return match[1].split(';').map(t => t.trim()).filter(Boolean);
}

app.post('/api/chat', async (req, res) => {
  const { message, tasks } = req.body;

  try {
    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: `You are Talkbase GPT-5 Mini AI. Generate daily tasks, track progress, motivate.` },
          { role: "user", content: message }
        ],
        max_tokens: 300
      })
    });

    const data = await apiResponse.json();
    let reply = data.choices[0].message.content;
    const newTasks = extractTasks(reply);
    if (newTasks.length > 0) reply = reply.replace(/TASKS:.+/i, '');
    res.json({ reply: reply.trim(), newTasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Error connecting to GPT-5 Mini AI." });
  }
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));

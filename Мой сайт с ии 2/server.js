const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);
app.use(express.json({ limit: '40kb' }));
app.use(express.static(__dirname));

const recent = new Map();
app.post('/api/chat', async (req, res) => {
  try {
    const incoming = Array.isArray(req.body.messages) ? req.body.messages : [];
    const messages = incoming
      .filter(item => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
      .map(item => ({ role: item.role, content: item.content.trim().slice(0, 2000) }))
      .filter(item => item.content)
      .slice(-24);
    if (!messages.length) return res.status(400).json({ error: 'Напиши сообщение.' });
    if (messages[messages.length - 1].role !== 'user') return res.status(400).json({ error: 'Последнее сообщение должно быть от пользователя.' });
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'На сервере не задан OPENAI_API_KEY. Добавь API-ключ в переменные окружения.' });

    const ip = req.ip || 'unknown';
    const now = Date.now();
    const previous = recent.get(ip) || 0;
    if (now - previous < 900) return res.status(429).json({ error: 'Подожди немного перед следующим сообщением.' });
    recent.set(ip, now);
    if (recent.size > 5000) {
      for (const [key, value] of recent) if (now - value > 60_000) recent.delete(key);
    }

    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.5',
        instructions: `Ты — полноценный разговорный AI-помощник на сайте 7SK Bicycle Service. Общайся естественно, как ChatGPT: понимай контекст предыдущих сообщений, учитывай уточнения, задавай один уместный вопрос, если не хватает данных, объясняй сложное простыми словами и помогай с широким кругом тем. По умолчанию отвечай на языке пользователя, обычно на русском. Если вопрос касается 7SK, велосипедов, ремонта или обслуживания — будь особенно полезен. Не выдумывай цены, наличие деталей, сроки, адреса и факты о сервисе. Если точных данных нет, честно скажи об этом и предложи связаться с мастером. Не утверждай, что ты официальный ChatGPT или человек. Пиши дружелюбно и по делу.`,
        input: messages.map(item => ({ role: item.role, content: item.content })),
        max_output_tokens: 900
      })
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      console.error('OpenAI API error:', data);
      return res.status(502).json({ error: data.error?.message || 'AI-сервис временно недоступен. Проверь модель и API-ключ на сервере.' });
    }
    const reply = (data.output || []).flatMap(item => item.content || [])
      .filter(part => part.type === 'output_text').map(part => part.text).join('\n').trim();
    if (!reply) return res.status(502).json({ error: 'AI не вернул текстовый ответ.' });
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
  }
});

app.listen(PORT, () => console.log(`7SK server started: http://localhost:${PORT}`));

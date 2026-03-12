export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS — allow your GitHub Pages frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { imageBase64, imageType, name } = req.body;

  if (!imageBase64 || !name) {
    return res.status(400).json({ error: 'Missing image or name' });
  }

  const prompt = `You are a mystical soul reader. Analyze this person's face — their eyes, expression, energy, and overall vibe. Their name is ${name}.

Return ONLY valid JSON, no markdown, no extra text:
{
  "happy_pct": <integer 0-100>,
  "sometimes_pct": <integer 0-100>,
  "sad_pct": <integer 0-100>,
  "dominant_mood": "happy" or "sometimes" or "sad",
  "mood_verdict": "One poetic sentence describing their emotional nature",
  "sections": [
    {"icon":"🌟","label":"SOUL ENERGY","stripe":"stripe-gold","content":"2-3 sentences about what their face reveals about their inner emotional world"},
    {"icon":"🔮","label":"NEAR FUTURE (Next 3 Months)","stripe":"stripe-mystic","content":"2-3 sentences predicting what is coming based on their soul energy"},
    {"icon":"💫","label":"LOVE & RELATIONSHIPS","stripe":"stripe-rose","content":"2-3 sentences about their emotional connections and what the universe has planned"},
    {"icon":"⚡","label":"THE UNIVERSE SAYS","stripe":"stripe-teal","content":"One powerful personal message from the universe to ${name}"}
  ]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // ✅ API key lives ONLY here on the server — never sent to browser
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${imageType || 'image/jpeg'};base64,${imageBase64}` }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'OpenAI error' });
    }

    const data = await response.json();
    const raw = data.choices[0].message.content;
    const clean = raw.replace(/```[\s\S]*?```|```/g, '').trim();
    const reading = JSON.parse(clean);

    return res.status(200).json(reading);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

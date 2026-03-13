export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const { imageBase64, imageType } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Photo missing hai bhai' });
  }

  const prompt = `Tu KaalDrishti hai — ek ancient soul reader jo sirf chehra dekh ke insaan ki poori kahani padh leta hai.

Is insaan ki photo dekh aur BAHUT GEHRI face reading kar:
- Aankhein: kya chupaati hain, kya bolti hain, andar ki feeling
- Maatha, naak, hont, jawline — character ke baare mein kya bolta hai
- Overall aura, energy, vibe
- Asli personality, strength, weakness
- Abhi is waqt yeh insaan andar se kaisa feel kar raha hai

MOOD DECISION RULES:
- dominant_mood = "happy", "sometimes", ya "sad" mein se SIRF EK choose karo
- dominant_pct = usi mood ka percentage (0-100)
- Agar dominant_mood "sad" ya "sometimes" hai toh motivational = true
- Agar dominant_mood "happy" hai toh motivational = false

Respond ONLY in this exact JSON, no markdown, no extra text:
{
  "dominant_mood": "happy" or "sometimes" or "sad",
  "dominant_pct": <integer 0-100>,
  "mood_label": "<Hinglish label e.g. 'Udaas' ya 'Kabhi Khush Kabhi Nahi' ya 'Khush Mizaaj'>",
  "motivational": true or false,
  "main_verdict": "<1 punchy Hinglish line — jaise close dost bolega — very personal, direct>",
  "sections": [
    {
      "icon": "👁️",
      "label": "AANKHEIN KYA KEHTI HAIN",
      "stripe": "stripe-saffron",
      "content": "<3-4 lines Hinglish — aankhon ki deep reading — emotion, sapne, dard, khushi>"
    },
    {
      "icon": "✨",
      "label": "ASLI PERSONALITY",
      "stripe": "stripe-cosmic",
      "content": "<3-4 lines Hinglish — bahar se jo dikhte hain vs andar se jo hain>"
    },
    {
      "icon": "💪",
      "label": "TERI TAAKAT",
      "stripe": "stripe-gold",
      "content": "<3-4 lines Hinglish — chehere se jo hidden strength dikhti hai>"
    },
    {
      "icon": "🌊",
      "label": "ANDAR KI FEELING",
      "stripe": "stripe-rose",
      "content": "<3-4 lines Hinglish — abhi is waqt kya chal raha hai andar>"
    },
    {
      "icon": "🔮",
      "label": "KAALDRISHTI KA SANDESH",
      "stripe": "stripe-teal",
      "content": "<IF motivational=true: 3-4 powerful motivating Hinglish lines — seedha bolo, uthao, inspire karo. IF motivational=false: 2-3 warm celebratory lines — khushi celebrate karo>"
    }
  ]
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 2000,
        temperature: 0.85,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageType || 'image/jpeg'};base64,${imageBase64}`,
                detail: 'high'
              }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'Groq error' });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const reading = JSON.parse(clean);
    return res.status(200).json(reading);

  } catch (err) {
    console.error('KaalDrishti error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

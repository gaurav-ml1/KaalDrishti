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

  const { imageBase64, imageType, name } = req.body;
  if (!imageBase64 || !name) {
    return res.status(400).json({ error: 'Photo ya naam missing hai bhai' });
  }

  const prompt = `Tu KaalDrishti hai — ek ancient soul reader jo sirf chehra dekh ke insaan ki poori kahani padh leta hai.

Is insaan ka naam hai: ${name}

Inki photo dekh aur BAHUT GEHRI face reading kar. Har cheez notice kar:
- Aankhein: kya chupaati hain, kya bolti hain, andar ki feeling
- Maatha, naak, hont, jawline — kya reveal karta hai character ke baare mein
- Overall aura, energy, vibe
- Kya yeh insaan khush dikhta hai ya andar se kuch alag chal raha hai
- Unki asli personality, strength, weakness

Respond ONLY in this exact JSON format, no markdown, no extra text:
{
  "happy_pct": <0-100 integer>,
  "sometimes_pct": <0-100 integer>,
  "sad_pct": <0-100 integer>,
  "dominant_mood": "happy" or "sometimes" or "sad",
  "main_verdict": "<1 line Hinglish mein — jaise koi close dost bolega, direct aur poetic dono — e.g. 'Teri aankhon mein ek alag hi duniya hai ${name}, jo log dekh nahi paate'>",
  "sections": [
    {
      "icon": "👁️",
      "label": "AANKHEIN KYA KEHTI HAIN",
      "stripe": "stripe-saffron",
      "content": "<3-4 lines Hinglish mein — sirf aankhon ki deep reading — kya emotion chupaaya hai, kya sapne hain, kitna dard hai, kitni khushi hai — very personal feel>"
    },
    {
      "icon": "✨",
      "label": "ASLI PERSONALITY",
      "stripe": "stripe-cosmic",
      "content": "<3-4 lines Hinglish mein — chehra kya bolta hai unki real personality ke baare mein — bahar se jo dikhte hain vs andar se jo hain — koi mask hai kya>"
    },
    {
      "icon": "💪",
      "label": "TERI TAAKAT",
      "stripe": "stripe-gold",
      "content": "<3-4 lines Hinglish mein — unke chehere se jo strength aur power dikhti hai — kya special quality hai jo duniya ko nahi pata but face reveal karta hai>"
    },
    {
      "icon": "🌊",
      "label": "ANDAR KI FEELING",
      "stripe": "stripe-rose",
      "content": "<3-4 lines Hinglish mein — abhi is waqt yeh insaan andar se kya feel kar raha hai — kya struggle hai, kya excitement hai, kya longing hai — very deep and honest>"
    },
    {
      "icon": "🔮",
      "label": "KAALDRISHTI KA SANDESH",
      "stripe": "stripe-teal",
      "content": "<2-3 lines Hinglish mein — ek bahut personal message sirf ${name} ke liye — aisa lage jaise kisi ne pehli baar truly samjha ho — inspiring aur emotional dono>"
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

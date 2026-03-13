export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { imageBase64, imageType } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'Photo missing hai bhai' });

  const prompt = `You are KaalDrishti — a soul reader and style advisor. Analyze this selfie photo carefully.

TASK 1: Read the face deeply — emotions, personality, inner world.
TASK 2: Give honest look improvement advice — hair, beard, skin, expression, grooming.

RULES:
- dominant_mood must be exactly one of: happy, sometimes, sad
- dominant_pct is a number between 0 and 100
- motivational is true if mood is sad or sometimes, false if happy
- Write all text in Hinglish (Hindi + English mix), natural North Indian tone like a close friend
- Every observation and improvement field must contain ACTUAL TEXT, not placeholder descriptions

Return ONLY this JSON with no markdown, no code blocks, no explanation:

{
  "dominant_mood": "sometimes",
  "dominant_pct": 60,
  "mood_label": "Kabhi Khush Kabhi Nahi",
  "motivational": true,
  "main_verdict": "Teri aankhon mein ek gehri kahani hai jo tu kisi ko nahi sunata.",
  "sections": [
    {
      "icon": "👁️",
      "label": "AANKHEIN KYA KEHTI HAIN",
      "stripe": "stripe-saffron",
      "observation": "Write 2-3 actual Hinglish sentences here about what the eyes reveal — emotions hidden, depth, pain or joy visible in the eyes.",
      "improvement": "Write 2-3 actual Hinglish sentences here about eye area improvements — dark circles, tired look, what to do about it."
    },
    {
      "icon": "✨",
      "label": "TERA OVERALL LOOK",
      "stripe": "stripe-cosmic",
      "observation": "Write 2-3 actual Hinglish sentences about overall face, skin, grooming level visible in photo.",
      "improvement": "Write 2-3 actual Hinglish sentences — specific advice: haircut style, beard trim or shave, skincare routine needed."
    },
    {
      "icon": "💪",
      "label": "TERI TAAKAT",
      "stripe": "stripe-gold",
      "observation": "Write 2-3 actual Hinglish sentences about the confidence and strength visible in the face.",
      "improvement": "Write 2-3 actual Hinglish sentences — how to project more confidence: posture, expression, presence tips."
    },
    {
      "icon": "🌊",
      "label": "ANDAR KI FEELING",
      "stripe": "stripe-rose",
      "observation": "Write 2-3 actual Hinglish sentences about current emotional state visible on the face right now.",
      "improvement": "Write 2-3 actual Hinglish sentences — how to look and feel better: smile more, relax face muscles, body language tips."
    },
    {
      "icon": "🔮",
      "label": "KAALDRISHTI KA SANDESH",
      "stripe": "stripe-teal",
      "observation": "Write 2-3 actual Hinglish sentences — honest overall assessment of how this person looks today.",
      "improvement": "Write 2-3 actual Hinglish sentences — if motivational=true: powerful motivating words to lift them up. If motivational=false: celebrate their good looks and energy."
    }
  ]
}

IMPORTANT: Replace ALL the "Write 2-3 actual..." instructions above with REAL text based on the actual photo. The JSON values must be your actual analysis, not instructions.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 2500,
        temperature: 0.8,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${imageType||'image/jpeg'};base64,${imageBase64}`, detail: 'high' }
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

    // Strip markdown if any
    let clean = raw.replace(/```json|```/g, '').trim();

    // Find JSON object in response
    const jsonStart = clean.indexOf('{');
    const jsonEnd = clean.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      clean = clean.slice(jsonStart, jsonEnd + 1);
    }

    const reading = JSON.parse(clean);
    return res.status(200).json(reading);

  } catch (err) {
    console.error('KaalDrishti error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

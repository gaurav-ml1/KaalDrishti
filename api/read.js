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

  const prompt = `Tu KaalDrishti hai — ek ancient soul reader + honest style advisor jo chehra dekh ke insaan ki poori kahani padh leta hai.

Is insaan ki photo dekh aur do cheezein ek saath kar:

1. DEEP FACE READING — personality, emotions, inner world
2. HONEST LOOK IMPROVEMENT — baal, daadhi, skin, style — kya theek hai, kya improve ho sakta hai

MOOD RULES:
- dominant_mood = "happy", "sometimes", ya "sad" SIRF EK
- dominant_pct = 0-100
- motivational = true if sad/sometimes, false if happy

Har section mein DO PARTS hone chahiye:
- "observation": chehere/look se jo clearly dikh raha hai (2-3 lines)
- "improvement": practical honest suggestion — baal kaatne chahiye, daadhi trim karni chahiye, kuch aur — (2-3 lines, Hinglish, dost ki tarah — not rude, but honest)

Return ONLY valid JSON, no markdown:
{
  "dominant_mood": "happy" or "sometimes" or "sad",
  "dominant_pct": <0-100>,
  "mood_label": "<Hinglish e.g. 'Udaas' or 'Kabhi Khush Kabhi Nahi' or 'Khush Mizaaj'>",
  "motivational": true or false,
  "main_verdict": "<1 punchy Hinglish line — very personal, direct, like a close dost>",
  "sections": [
    {
      "icon": "👁️",
      "label": "AANKHEIN KYA KEHTI HAIN",
      "stripe": "stripe-saffron",
      "observation": "<2-3 lines — aankhon ki deep reading — emotion, sapne, jo chupaate ho>",
      "improvement": "<2-3 lines — aankhon ke aaspaas — dark circles hain? thaka hua look? kya improve ho sakta hai — practical tips>"
    },
    {
      "icon": "✨",
      "label": "TERA OVERALL LOOK",
      "stripe": "stripe-cosmic",
      "observation": "<2-3 lines — overall face structure, skin, grooming — jo clearly dikh raha hai>",
      "improvement": "<2-3 lines — kya change karne se zyada presentable lagoge — haircut, beard trim, skincare — very specific>"
    },
    {
      "icon": "💪",
      "label": "TERI TAAKAT",
      "stripe": "stripe-gold",
      "observation": "<2-3 lines — face se jo confidence aur strength dikhti hai>",
      "improvement": "<2-3 lines — is strength ko aur badhane ke liye — posture, expression, presence improve karne ke tips>"
    },
    {
      "icon": "🌊",
      "label": "ANDAR KI FEELING",
      "stripe": "stripe-rose",
      "observation": "<2-3 lines — abhi is waqt face kya reveal kar raha hai emotionally>",
      "improvement": "<2-3 lines — feel better dikhne ke liye — smile, relaxed face, body language tips>"
    },
    {
      "icon": "🔮",
      "label": "KAALDRISHTI KA SANDESH",
      "stripe": "stripe-teal",
      "observation": "<2-3 lines — ek overall honest assessment — tu kaisa dikh raha hai aaj>",
      "improvement": "<IF motivational=true: 2-3 powerful motivating lines — uthao, inspire karo. IF false: 2-3 celebratory lines — khushi celebrate karo>"
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
        max_tokens: 2500,
        temperature: 0.85,
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
    const clean = raw.replace(/```json|```/g, '').trim();
    const reading = JSON.parse(clean);
    return res.status(200).json(reading);

  } catch (err) {
    console.error('KaalDrishti error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

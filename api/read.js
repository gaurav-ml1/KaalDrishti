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
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { imageBase64, imageType, dob } = req.body;

  if (!imageBase64 || !dob) {
    return res.status(400).json({ error: 'Missing image or date of birth' });
  }

  // Calculate zodiac sign from DOB
  function getZodiac(dobStr) {
    const d = new Date(dobStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    if ((month===3&&day>=21)||(month===4&&day<=19)) return {sign:'Aries',symbol:'♈',hindi:'मेष'};
    if ((month===4&&day>=20)||(month===5&&day<=20)) return {sign:'Taurus',symbol:'♉',hindi:'वृषभ'};
    if ((month===5&&day>=21)||(month===6&&day<=20)) return {sign:'Gemini',symbol:'♊',hindi:'मिथुन'};
    if ((month===6&&day>=21)||(month===7&&day<=22)) return {sign:'Cancer',symbol:'♋',hindi:'कर्क'};
    if ((month===7&&day>=23)||(month===8&&day<=22)) return {sign:'Leo',symbol:'♌',hindi:'सिंह'};
    if ((month===8&&day>=23)||(month===9&&day<=22)) return {sign:'Virgo',symbol:'♍',hindi:'कन्या'};
    if ((month===9&&day>=23)||(month===10&&day<=22)) return {sign:'Libra',symbol:'♎',hindi:'तुला'};
    if ((month===10&&day>=23)||(month===11&&day<=21)) return {sign:'Scorpio',symbol:'♏',hindi:'वृश्चिक'};
    if ((month===11&&day>=22)||(month===12&&day<=21)) return {sign:'Sagittarius',symbol:'♐',hindi:'धनु'};
    if ((month===12&&day>=22)||(month===1&&day<=19)) return {sign:'Capricorn',symbol:'♑',hindi:'मकर'};
    if ((month===1&&day>=20)||(month===2&&day<=18)) return {sign:'Aquarius',symbol:'♒',hindi:'कुंभ'};
    return {sign:'Pisces',symbol:'♓',hindi:'मीन'};
  }

  const zodiac = getZodiac(dob);
  const dobDate = new Date(dob);
  const age = new Date().getFullYear() - dobDate.getFullYear();

  const prompt = `You are KaalDrishti — an ancient cosmic soul reader combining face reading and Vedic astrology.

Analyze this person's photo carefully. Their date of birth is ${dob}. They are approximately ${age} years old. Their zodiac sign is ${zodiac.sign} (${zodiac.symbol} ${zodiac.hindi}).

Your reading has TWO PARTS:

PART 1 — FACE READING: Read their facial features (eyes, expression, energy, aura) to determine if they are usually happy, sad, or mixed emotionally.

PART 2 — ASTROLOGY: Based on their zodiac sign ${zodiac.sign} and birth date ${dob}, give deep astrological predictions.

Return ONLY valid JSON, absolutely no markdown, no extra text, no code blocks:
{
  "zodiac_sign": "${zodiac.sign}",
  "zodiac_symbol": "${zodiac.symbol}",
  "zodiac_hindi": "${zodiac.hindi}",
  "happy_pct": <integer 0-100, based on face reading>,
  "sometimes_pct": <integer 0-100, based on face reading>,
  "sad_pct": <integer 0-100, based on face reading>,
  "dominant_mood": "happy" or "sometimes" or "sad",
  "face_verdict": "One poetic sentence about their emotional nature from face reading",
  "face_sections": [
    {
      "icon": "👁️",
      "label": "FACE READING — SOUL ENERGY",
      "stripe": "stripe-saffron",
      "content": "3-4 sentences deeply reading their facial features — eyes reveal their depth, expression shows their nature, overall energy and what it means about who they truly are inside"
    },
    {
      "icon": "😊",
      "label": "FACE READING — EMOTIONAL PATTERN",
      "stripe": "stripe-cosmic",
      "content": "3-4 sentences about their emotional patterns based on face — are they naturally joyful, do they hide pain, when are they truly happy vs when do they feel low"
    }
  ],
  "astro_sections": [
    {
      "icon": "🪐",
      "label": "ASTROLOGY — YOUR ${zodiac.sign.toUpperCase()} DESTINY",
      "stripe": "stripe-gold",
      "content": "3-4 sentences about their core personality and life path as a ${zodiac.sign}, their ruling planet, element, and what the cosmos has destined for them"
    },
    {
      "icon": "🔮",
      "label": "ASTROLOGY — NEAR FUTURE (3 Months)",
      "stripe": "stripe-mystic",
      "content": "3-4 sentences of specific predictions for the next 3 months based on current planetary positions for ${zodiac.sign} — career, opportunities, challenges"
    },
    {
      "icon": "💫",
      "label": "ASTROLOGY — LOVE & RELATIONSHIPS",
      "stripe": "stripe-rose",
      "content": "3-4 sentences about their romantic destiny, compatible signs, and what the universe has planned for their heart based on ${zodiac.sign} traits"
    },
    {
      "icon": "⚡",
      "label": "COSMIC MESSAGE",
      "stripe": "stripe-teal",
      "content": "One powerful, deeply personal message combining both their face reading and astrology — make it feel like it was written only for this exact person born on ${dob}"
    }
  ]
}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: imageType || 'image/jpeg',
                data: imageBase64
              }
            },
            { text: prompt }
          ]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1500,
        }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err.error?.message || 'Gemini API error'
      });
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const reading = JSON.parse(clean);

    return res.status(200).json(reading);

  } catch (err) {
    console.error('KaalDrishti error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

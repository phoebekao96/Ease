export type SummaryResult = {
  afterVisitNote: string
  instructions: string[]
  medicationList: string[]
  patientSummary: string
  recommendations: string[]
  standingOrder: string
}

type TargetLang = 'eng' | 'cmn' | 'spa'

const LANG_NAME: Record<TargetLang, string> = {
  eng: 'English',
  cmn: 'Mandarin Chinese',
  spa: 'Spanish',
}

function extractJson(text: string): any {
  try {
    return JSON.parse(text)
  } catch {}

  // Fallback: try to find a JSON block
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    const maybe = text.slice(start, end + 1)
    try {
      return JSON.parse(maybe)
    } catch {}
  }
  throw new Error('Invalid response format from OpenAI')
}

export async function generateSummary(
  translatedText: string,
  targetLanguage: TargetLang,
): Promise<SummaryResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
  const model = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || 'gpt-4o-mini'
  if (!apiKey) throw new Error('Missing VITE_OPENAI_API_KEY')

  const languageName = LANG_NAME[targetLanguage]

  const prompt = `Based on the following patient–doctor conversation, create an **After Visit Summary** with these exact sections and concise format in ${languageName}:

**After Visit Note**

**Instructions** – List only concrete, prescribed actions (tests, imaging, medications with dosage and frequency, follow-up appointments, and when to seek emergency care). Keep each action short and direct.

**Medication List** – List all current medications with name, dosage, and frequency. Include OTC if mentioned. If none, write "No prescriptions."

**Patient Summary** – One short paragraph with reason for visit, key symptoms, onset/duration, associated symptoms, and relevant history/medications.

**Recommendations** – Bullet points for optional/nice-to-do advice from the doctor (lifestyle, self-care, diet, etc.).

**Standing Order** – List any standing orders (e.g., "CT head without contrast"). If none, write "None."

Conversation: ${translatedText}

Format the response as a JSON object with these exact keys:
{
  "afterVisitNote": "After Visit Note",
  "instructions": ["instruction1", "instruction2"],
  "medicationList": ["medication1", "medication2"],
  "patientSummary": "patient summary paragraph",
  "recommendations": ["recommendation1", "recommendation2"],
  "standingOrder": "standing order or None"
}`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content:
            'You are a medical transcription assistant that creates professional after-visit summaries. Always respond with valid JSON format only.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok) {
    let message = 'Failed to generate summary'
    try {
      const data = await res.json()
      message = data?.error?.message || message
    } catch {}
    throw new Error(message)
  }

  const data = await res.json()
  const content: string | undefined = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('No response from OpenAI')

  const parsed = extractJson(content)
  return parsed as SummaryResult
}



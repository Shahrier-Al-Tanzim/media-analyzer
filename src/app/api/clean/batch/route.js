import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const defaultModel = 'llama-3.3-70b-versatile';

export async function POST(req) {
  try {
    const { records, model } = await req.json();

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid payload: records must be an array' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Groq API Key is not configured on the server' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });
    const modelToUse = model || process.env.GROQ_MODEL || defaultModel;

    const promptItems = records.map(r => ({
      id: r.id,
      text: r.text
    }));

    const response = await groq.chat.completions.create({
      model: modelToUse,
      messages: [
        {
          role: 'system',
          content: `You are an AI data-cleaning assistant.
Analyze the provided social media comments about TakaPay (a mobile financial service in Bangladesh).
The comments can be in English, Bengali, or Banglish (colloquial Bengali written in English script).

 For each comment in the array:
1. Correct the sentiment classification ("positive", "negative", "neutral") based on the actual overall tone of the text. Do not bias or skew the sentiment to negative just because a competitor is praised; keep it objective to the text's literal emotion (e.g., "NgoodPay is fast" is positive, not negative).
2. Assign a sentiment score from 0 to 100.
3. Translate any Bengali or Banglish comments to clear, professional English. If it is already in English, keep it as-is.
4. Assess a "severity_level" ("Urgent", "High", "Medium", "Low") based on content (e.g., money stuck or failed transaction is Urgent/High, query/fee complaint is Medium, off-topic is Low).
5. Extract any competitor mobile financial service brands mentioned in the text (specifically look for financial services like "NgoodPay", "bKash", "Nagad"). Do NOT extract mobile network operators/providers like Grameenphone, GP, Teletalk, Robi, or Banglalink.
6. Set "brand_mention" to true if "TakaPay" is explicitly or contextually mentioned, and false if it is off-topic and TakaPay is not mentioned.
7. Assess "competitor_sentiment" ("positive" | "negative" | "neutral" | null) which is the sentiment expressed specifically towards the competitor brand. If no competitor is mentioned, set this to null.

You must return a JSON object containing an array of objects under a "records" key, matching the order and number of inputs:
{
  "records": [
    {
      "id": number,
      "sentiment": "positive" | "negative" | "neutral",
      "sentiment_score": number,
      "english_translation": "string",
      "severity_level": "Urgent" | "High" | "Medium" | "Low",
      "mentioned_competitors": ["string"],
      "brand_mention": boolean,
      "competitor_sentiment": "positive" | "negative" | "neutral" | null
    }
  ]
}`
        },
        {
          role: 'user',
          content: JSON.stringify(promptItems)
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    });

    const responseText = response.choices[0].message.content;
    const parsed = JSON.parse(responseText);

    if (!parsed || !Array.isArray(parsed.records)) {
      throw new Error('Response did not match expected structure');
    }

    return NextResponse.json({ success: true, records: parsed.records });
  } catch (error) {
    console.error('Error processing batch API:', error);
    return NextResponse.json({ error: error.message || 'Failed to process batch' }, { status: 500 });
  }
}

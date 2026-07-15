import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';

// Load environment variables
dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error('ERROR: GROQ_API_KEY environment variable is not defined.');
  process.exit(1);
}

const groq = new Groq({ apiKey });

// Parse command line arguments
const args = process.argv.slice(2);
const inputArgIndex = args.indexOf('--input');
const inputPath = inputArgIndex !== -1 ? args[inputArgIndex + 1] : './takapay_test_data.json';
const outputArgIndex = args.indexOf('--output');
const outputPath = outputArgIndex !== -1 ? args[outputArgIndex + 1] : './src/data/takapay_cleaned_data.json';
const modelArgIndex = args.indexOf('--model');
const MODEL_NAME = modelArgIndex !== -1 ? args[modelArgIndex + 1] : (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile');

async function cleanData() {
  try {
    if (!fs.existsSync(inputPath)) {
      console.error(`ERROR: Input file not found at ${inputPath}`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(inputPath, 'utf8');
    const records = JSON.parse(fileContent);
    const originalMap = new Map(records.map(r => [r.id, JSON.parse(JSON.stringify(r))]));

    console.log(`Loaded ${records.length} records from ${inputPath}. Starting deduplication...`);

    // 1. Deduplication
    const seenTexts = new Set();
    const uniqueRecords = [];
    let dupCount = 0;

    for (const record of records) {
      if (!record.text) continue;
      // Normalize text for comparison (lowercase, trimmed, collapse whitespace)
      const normalized = record.text.trim().toLowerCase().replace(/\s+/g, ' ');
      if (!seenTexts.has(normalized)) {
        seenTexts.add(normalized);
        uniqueRecords.push({ ...record });
      } else {
        dupCount++;
      }
    }

    console.log(`Deduplication complete. Removed ${dupCount} duplicate(s). ${uniqueRecords.length} records remain.`);


    // 2. Batch Processing
    const BATCH_SIZE = 30; // Set to 25 to prevent Groq JSON validation failures while keeping execution fast
    const cleanedRecords = [];
// Btach size 15 needed for vercel
    for (let i = 0; i < uniqueRecords.length; i += BATCH_SIZE) {
      const batch = uniqueRecords.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(uniqueRecords.length / BATCH_SIZE)}...`);

      const promptItems = batch.map(r => ({
        id: r.id,
        text: r.text
      }));

      let retries = 3;
      let success = false;
      let results = [];

      while (retries > 0 && !success) {
        try {
          const response = await groq.chat.completions.create({
            model: MODEL_NAME,
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
          
          if (parsed && Array.isArray(parsed.records)) {
            results = parsed.records;
            success = true;
          } else {
            throw new Error('Response did not match expected structure');
          }
        } catch (err) {
          retries--;
          console.error(`Batch failed (Retries remaining: ${retries}):`, err.message);
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }

      if (!success) {
        console.warn(`WARNING: Failed to process batch starting with ID ${batch[0].id}. Using fallback values.`);
        results = batch.map(r => ({
          id: r.id,
          sentiment: r.sentiment || 'neutral',
          sentiment_score: r.sentiment_score || 50,
          english_translation: r.text,
          severity_level: 'Low',
          mentioned_competitors: [],
          brand_mention: r.brand_mention || false
        }));
      }

      // 3. Map results and apply Programmatic Feature Engineering
      const resultMap = new Map(results.map(item => [item.id, item]));

      for (const record of batch) {
        const result = resultMap.get(record.id);
        if (result) {
          record.sentiment = result.sentiment;
          record.sentiment_score = result.sentiment_score;
          record.english_translation = result.english_translation;
          record.severity_level = result.severity_level;
          record.mentioned_competitors = result.mentioned_competitors || [];
          record.brand_mention = result.brand_mention;
        }

        // Programmatic additions
        const reactions = parseInt(record.reactions || 0);
        const comments = parseInt(record.comments || 0);
        record.engagement = reactions + comments;
        record.mentioned_competitors = record.mentioned_competitors || [];
        record.is_competitor_comparison = record.mentioned_competitors.length > 0;
        record.is_high_risk = record.sentiment === 'negative' && record.engagement > 100;
        
        cleanedRecords.push(record);
      }

      // Small delay between requests to be gentle on free tier rate limits
      if (i + BATCH_SIZE < uniqueRecords.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 4. Ensure Output Directory Exists and Save Files
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write JSON
    fs.writeFileSync(outputPath, JSON.stringify(cleanedRecords, null, 2), 'utf8');
    console.log(`SUCCESS: Cleaned dataset JSON successfully saved to ${outputPath}!`);

    // Write CSV
    const csvPath = outputPath.replace(/\.json$/, '.csv');
    const csvContent = convertToCSV(cleanedRecords);
    fs.writeFileSync(csvPath, csvContent, 'utf8');
    console.log(`SUCCESS: Cleaned dataset CSV successfully saved to ${csvPath}!`);

    // 5. Generate and Write Cleaning Report
    let sentimentFixes = 0;
    let brandMentionFixes = 0;
    let translationsCount = 0;
    let highRiskCount = 0;
    let competitorCount = 0;

    const fixDetails = [];

    for (const record of cleanedRecords) {
      const orig = originalMap.get(record.id);
      if (orig) {
        let hasFix = false;
        const changes = [];

        if (record.sentiment !== orig.sentiment) {
          sentimentFixes++;
          hasFix = true;
          changes.push(`Sentiment corrected: "${orig.sentiment}" ➔ "${record.sentiment}"`);
        }
        if (record.brand_mention !== orig.brand_mention) {
          brandMentionFixes++;
          hasFix = true;
          changes.push(`Brand mention corrected: ${orig.brand_mention} ➔ ${record.brand_mention}`);
        }
        if (record.language !== 'en' && record.english_translation && record.english_translation !== orig.text) {
          translationsCount++;
        }
        if (record.is_high_risk) {
          highRiskCount++;
        }
        if (record.is_competitor_comparison) {
          competitorCount++;
        }

        if (hasFix) {
          fixDetails.push({
            id: record.id,
            text: record.text,
            changes
          });
        }
      }
    }

    const reportPath = path.join(dir, 'cleaning_report.md');
    const reportContent = `# Data Cleaning & Enrichment Report

## Summary Metrics

*   **Total Raw Records:** ${records.length}
*   **Duplicate Records Removed:** ${dupCount}
*   **Unique Records Processed:** ${uniqueRecords.length}
*   **Sentiment Corrections Made:** ${sentimentFixes}
*   **Brand Mention Corrections Made:** ${brandMentionFixes}
*   **Translations Generated (Bangla/Banglish to English):** ${translationsCount}
*   **High Risk Cases Detected:** ${highRiskCount}
*   **Competitor Comparisons Identified:** ${competitorCount}

## Detailed Fixes Log

Below is the list of records where the cleaning pipeline corrected the automated raw metadata:

${fixDetails.map(f => `### Record ID: ${f.id}
*   **Text:** \`${f.text}\`
*   **Corrections:**
${f.changes.map(c => `    *   ${c}`).join('\n')}
`).join('\n')}
`;

    fs.writeFileSync(reportPath, reportContent, 'utf8');
    console.log(`SUCCESS: Cleaning report successfully saved to ${reportPath}!`);

  } catch (error) {
    console.error('FATAL ERROR during data cleaning:', error);
    process.exit(1);
  }
}

function convertToCSV(records) {
  if (records.length === 0) return '';
  const headers = [
    'id', 'platform', 'timestamp', 'author', 'text', 'language', 'brand_mention',
    'sentiment', 'sentiment_score', 'topic', 'reactions', 'comments',
    'english_translation', 'severity_level', 'mentioned_competitors',
    'engagement', 'is_competitor_comparison', 'is_high_risk', 'competitor_sentiment'
  ];
  
  const csvRows = [headers.join(',')];
  
  for (const record of records) {
    const values = headers.map(header => {
      let val = record[header];
      if (val === undefined || val === null) {
        val = '';
      } else if (Array.isArray(val)) {
        val = `"${val.join(', ').replace(/"/g, '""')}"`;
      } else if (typeof val === 'string') {
        val = `"${val.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
      }
      return val;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

cleanData();

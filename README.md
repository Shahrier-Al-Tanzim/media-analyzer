# TakaPay Media Analyzer 📊📱
> A powerful brand intelligence dashboard & data cleaning pipeline built for **DeepDive (Markopolo AI)**.

TakaPay Media Analyzer turns messy, multilingual social media feeds into actionable brand health insights. Powered by **Next.js**, **Tailwind CSS**, and **Recharts**, it helps brand managers monitor sentiment, isolate customer issues, compare competitor performance, and intercept high-severity crises in real time.

---

## 🚀 Live Demo & Repository
*   **Live Deployed App:** [media-analyzer-seven.vercel.app](https://media-analyzer-seven.vercel.app)
*   **GitHub Repository:** [github.com/Shahrier-Al-Tanzim/media-analyzer](https://github.com/Shahrier-Al-Tanzim/media-analyzer)

---

## 🛠️ Getting Started
First, clone the repository and install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📦 What Was Built

### 1. **Executive Analytics Dashboard**
A premium, dark-themed visual console featuring:
*   **Net Brand Sentiment (NPS):** Highlights overall positive vs. negative brand advocacy.
*   **Relevance Ratio (Brand Purity):** Measures clean signals by stripping out spam, noise, and off-topic posts.
*   **Top Issues & Promos (Topic Analysis):** Horizontal stacked bar chart analyzing category sentiment (e.g., failed transactions, cashbacks, agent networks).
*   **Platform Negativity Density:** Identifies which channels (Twitter, YouTube, Facebook) are most toxic.

### 2. **Competitive Battleground**
An actionable chart comparing **TakaPay** directly against **NgoodPay** (the competitor found in the dataset) across key product pillars (Charges & Fees, Cashback, App Speed, Recharges, Agent Network). It warns the brand manager immediately if the competitor is outperforming them.

### 3. **Cleaned Data Explorer**
An interactive tabular view of the dataset:
*   Includes **English translations** inline for multilingual (Bangla/Banglish) posts.
*   Shows system-enriched fields like **Topic**, **Severity Level**, and **Risk status**.
*   Supports **isolated local filters** (Search, Sentiment, Topic, Severity, Risk) so table searches don't disrupt dashboard metrics.
*   Provides download buttons for exporting the clean dataset as **CSV** or **JSON**.

### 4. **Data Cleaner (Enrichment Pipeline)**
A developer-focused workspace that allows uploading raw `takapay_sample_data.csv` or `.json` files and running a multi-stage deduplication and LLM processing console (powered by Groq/Llama-3 & Gemini) to clean the dataset live.

---

## 🔍 Data Anomalies & Observations

During analysis of the raw `takapay_sample_data` file, we uncovered several critical anomalies that our pipeline successfully resolves:

1.  **Noise & Spam:** A large percentage of rows are empty greetings, irrelevant mentions ("hello", "good"), or off-topic comments. Left untreated, they dilute the sentiment score.
2.  **Mislabeled Brand Mentions:** Several rows marked `brand_mention: true` were actually about competitor apps or general comments not mentioning TakaPay.
3.  **Bangla & Banglish Mix:** Customer feedback is heavily multilingual, blending Bangla script and phonetic Banglish (e.g., *"helpline e 30 min wait korlam"*). 
4.  **Sentiment Discrepancies:** Multiple rows had positive sentiment labels but text expressing frustration (or vice-versa).
5.  **Competitor Contamination:** Feedback about a competitor (**NgoodPay**) was mixed into TakaPay's raw feed.

---

## 💡 Product Choices & Custom Insights
Beyond the core requirements, the following insights were designed specifically for a brand manager's workflow:

*   **Purity Filtering (Relevance Ratio):** We automatically exclude noise (`brand_mention: false` or `topic: 'off_topic'`) from the Executive Dashboard. This ensures the NPS and chart counts show *real* customer sentiment rather than raw comment counts.
*   **The "Fire Alarm" (Risk Badge):** High-engagement negative posts represent potential viral PR crises. We flag posts as **High Risk** if they have negative sentiment and high social engagement (reactions + comments > 100). The dashboard alerts you with a pulsing red badge.
*   **Category-Specific Competitor Comparison:** Instead of just comparing general sentiment, we map comparison comments to categories (e.g., App Speed, Fees) and display satisfaction rates. This tells the product team *exactly* where the competitor is winning.

---

## 🤖 LLM Cleaning Pipeline & Rate Limits

The Data Cleaner pipeline uses **Groq** to process, translate, and enrich the raw dataset:
*   **Models Configured:**
    *   `Llama 3.3 70B Versatile` (Default and recommended for best balance of reasoning and efficiency).
    *   `GPT OSS 120B` (For deep multilingual code-switching nuances).
*   **Rate Limits & Production Scaling:**
    *   Since this demo uses Groq's **free tier**, the pipeline is designed to batch and pace requests to avoid rate limits during single-run analysis on the 660-row dataset. We can clean the data once with the free tier. 
    *   In a commercial production setting, using paid APIs or dedicated host instances would execute this pipeline near-instantly and accommodate unlimited recurring runs without limits.

---

## 🧠 AI Tooling & Reflection

This application was built in partnership with **Antigravity (Google DeepMind)**.

### Where AI Assisted:
*   Writing the initial client-side CSV parser.
*   Structuring the Recharts responsive layouts and Tailwind glassmorphism styling.
*   Generating mock processing steps for the data pipeline console.

---

## 🔮 With Another Week, I Would...
1.  **Integrate WebSockets:** Connect the pipeline to a live Twitter/Facebook stream API instead of static files.
2.  **Auto-Draft Responses:** Add an AI-powered "Response Generator" next to the High-Risk feed so managers can click "Respond" to get a context-aware apology or solution draft.
3.  **IndexedDB Cache:** Cache parsed files locally in IndexedDB to support files larger than localStorage limits (5MB).

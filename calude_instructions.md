# TakaPay Dashboard — Analysis Plan

## 1. What each field means

| Field | What it is | What it tells the brand manager |
|---|---|---|
| `id` | Unique post ID | Just a key, not analytically interesting |
| `platform` | Facebook, TikTok, Reddit, Twitter, Instagram, YouTube, News/Media | *Where* people are talking — Facebook dominates (225 of 660), then Reddit and News/Media |
| `timestamp` | When posted | All 660 records fall in June 2026 — one month of data, so "trend over time" means day-by-day within June, not month-over-month |
| `author` | Username | Not useful for aggregate analysis; mainly for drill-down/spot-checking |
| `text` | The actual post, mixed Bangla/English | The raw voice of the customer |
| `language` | `bn`, `en`, `bn-en` | 390 of 660 posts are code-mixed Bangla-English — this is the normal way people write here, not noise |
| `brand_mention` | Supposedly flags if TakaPay is mentioned | **This field is broken — every single row is `True`**, including posts about traffic and biryani that have nothing to do with TakaPay |
| `sentiment` | negative / positive / neutral label | The headline emotional read |
| `sentiment_score` | 0–100 | A finer-grained version of sentiment — negative posts cluster 6–30, neutral 45–60, positive 46–94 |
| `topic` | What the post is about (failed_transaction, competitor, cashback_offer, etc.) | This is the real "themes" axis |
| `reactions` / `comments` | Engagement counts | Lets you weigh a post by how much it spread, not just count it once |

## 2. Data quality issues to surface in the README

**`brand_mention` is meaningless as given.** It's `True` for all 660 rows — including 61 posts tagged `off_topic` that are about Dhaka traffic, exam stress, and biryani recommendations, with zero connection to TakaPay. If a brand manager trusted this column, they'd think 100% of the feed is about their brand. It isn't.

- **Fix:** derive a real relevance flag yourself (e.g., `topic != 'off_topic'`), and show the manager how much of the raw feed had to be filtered out before analysis — that's a data-quality insight in itself ("18% of collected mentions were noise").

**A named competitor already exists in the data: "NgoodPay."** 81 posts (12% of the dataset) are tagged `topic: competitor` and directly compare TakaPay to NgoodPay — on cashback amounts, agent availability, app speed, and customer care, usually favoring NgoodPay. This is a gift for the competitor-comparison stretch goal.

**~10 exact duplicate posts** — templated text with only a city or amount swapped (e.g. "TakaPay agent beshi... Motijheel" / "...Mohakhali"), likely bot/spam-style repetition. Whether you dedupe or not is a legitimate judgment call to defend on camera.

## 3. What a TakaPay brand manager actually wants to see

- **Sentiment is bad overall** — 338 negative vs 237 positive vs 85 neutral. The first question will be "why?" — so sentiment alone isn't enough, it needs to be broken down **by topic**.
- **`failed_transaction` is the single largest topic (220 of 660 — a third of the whole feed)**, and almost certainly the most negative one. Likely headline finding: *"A third of all conversation about TakaPay is people complaining about failed transactions."*
- Compare against smaller, happier topics like `cashback_offer` (63) and `bill_payment` (24), which likely skew positive — contrast between "what we're good at" and "what's breaking trust."
- The competitor angle (NgoodPay, 81 posts) answers "are we losing people, and to whom, and why."

## 4. What to put on the page

**Top of page — headline numbers (big, simple, no chart needed):**
- Total mentions analyzed, and how many were filtered out as irrelevant (the `brand_mention` fix pays off here)
- Overall sentiment split (negative/positive/neutral) as one clean bar or donut
- One callout sentence: "X% of negative sentiment comes from failed transactions"

**Main section — Topics × Sentiment (the core insight):**
A stacked or grouped bar chart: topic on one axis, sentiment breakdown within each topic. Instantly shows which conversations are the problem (`failed_transaction`, `charges_fees`) vs which are working (`cashback_offer`, `bill_payment`).

**Product-call section (pick one, defend it in README):**
- **TakaPay vs NgoodPay comparison** — sentiment and volume for the `competitor` topic, since it's a rich, ready-made slice of the data. *(Recommended — more actionable for a brand manager.)*
- **Platform breakdown** — where negativity concentrates (e.g., is Facebook worse than Twitter?), useful for deciding where to respond first.

**Filters (stretch goal):**
- Sentiment (positive/negative/neutral)
- Topic (dropdown of the 14 topics)
- Platform
- Date (all June, so a date-range slider across the month still works for "which week got worse")

**Representative-posts panel:** a small feed of 3–5 actual example posts (with reactions count) per selected filter, so the manager can read real voices, not just numbers — especially valuable given the Bangla-English mix.
export interface ScenarioChoice {
  id: string;
  text: string;
}

export interface Scenario {
  id: string;
  courseSlug: string;
  lessonSlug?: string;
  order: number;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  context: string; // The situation / account state described
  keyMetrics?: { label: string; before: string; after: string }[];
  question: string;
  choices: ScenarioChoice[];
  correctIds: string[]; // one or more correct choice IDs
  coachReasoning: string; // Coach Wesley's full explanation
  operatorTakeaway: string; // The one-line rule
}

export const scenariosData: Scenario[] = [
  {
    id: 'scenario-acos-explosion',
    courseSlug: 'amazon-ads-foundations',
    lessonSlug: 'diagnosing-performance',
    order: 1,
    title: 'ACoS Explosion',
    level: 'Beginner',
    context:
      "You're managing a Sponsored Products campaign for a 40-ASIN catalog. Everything looked normal last week. You open the console this morning and one of your top-revenue campaigns has jumped from 28% ACoS to 47% ACoS over the last 7 days. No budget changes were made. No bids were touched.",
    keyMetrics: [
      { label: 'ACoS', before: '28%', after: '47%' },
      { label: 'Spend', before: '$1,240', after: '$1,580' },
      { label: 'Revenue', before: '$4,428', after: '$3,361' },
    ],
    question: 'What do you investigate first?',
    choices: [
      {
        id: 'a',
        text: 'Lower all bids by 20% immediately to bring ACoS back down.',
      },
      {
        id: 'b',
        text: 'Pause the campaign until you understand what happened.',
      },
      {
        id: 'c',
        text: 'Increase the daily budget so the campaign can generate more data.',
      },
      {
        id: 'd',
        text: 'Pull the search term report to identify what changed — CPC, CVR, or search term mix.',
      },
      {
        id: 'e',
        text: 'Check if conversion rate (CVR) dropped and whether the product listing changed.',
      },
    ],
    correctIds: ['d', 'e'],
    coachReasoning:
      "ACoS is an **outcome metric**, not a lever you can pull. Cutting bids without understanding why ACoS rose is like treating a fever by turning off the thermometer. The first job is **diagnosis**, not reaction.\n\nThe ACoS formula is: `ACoS = Spend ÷ Revenue`. It can rise for three reasons:\n1. **CPC went up** (you're paying more per click — check search term report for expensive new terms cannibalizing spend)\n2. **CVR went down** (same clicks, fewer purchases — check listing reviews, price change, stock level, Buy Box status)\n3. **Search term mix shifted** (auto campaign started spending on irrelevant queries — check the search term report for low-intent terms)\n\nIn this case, spend went up and revenue went down simultaneously, which is classic search-term drift or a CVR breakdown. Pull the search term report sorted by spend, find terms with zero conversions consuming >5% of spend, and add them as negative exact. Simultaneously check whether your listing's conversion rate changed (reviews dropped, competitor undercut price, etc.).\n\nOnly after you've isolated the root cause do you adjust bids — and even then, surgically, not across the board.",
    operatorTakeaway:
      'ACoS is a symptom. Diagnose CPC, CVR, and search term mix before touching any bid.',
  },
  {
    id: 'scenario-budget-bleeder',
    courseSlug: 'amazon-ads-foundations',
    lessonSlug: 'diagnosing-performance',
    order: 2,
    title: 'The Budget Bleeder',
    level: 'Intermediate',
    context:
      "You've inherited a 200-ASIN account. During your audit you discover one Sponsored Products campaign labeled 'Auto - Main' is consuming 42% of the entire account's daily ad budget. Its ACoS is 68%. The account average ACoS is 31%. The campaign has been running for 14 months with no changes. Spend this month: $4,800 out of a $11,400 total account budget.",
    keyMetrics: [
      { label: 'Campaign ACoS', before: '—', after: '68%' },
      { label: 'Account ACoS', before: '—', after: '31%' },
      { label: 'Campaign budget share', before: '—', after: '42%' },
      { label: 'Campaign spend (MTD)', before: '—', after: '$4,800' },
    ],
    question: "What's your first move?",
    choices: [
      {
        id: 'a',
        text: 'Pause the campaign immediately — 68% ACoS is unacceptable.',
      },
      {
        id: 'b',
        text: 'Pull the search term report to find which terms are eating spend with zero conversions.',
      },
      {
        id: 'c',
        text: 'Reduce the campaign daily budget cap to $500 to stop the bleeding.',
      },
      {
        id: 'd',
        text: 'Analyze which ASINs and search terms are actually converting profitably, harvest them into manual exact campaigns, and then decide what to do with the auto.',
      },
      {
        id: 'e',
        text: 'Raise the bid on converting terms so the campaign becomes more efficient.',
      },
    ],
    correctIds: ['b', 'd'],
    coachReasoning:
      "**Never pause or kill an auto campaign before mining it.** Pausing 'Auto - Main' without first extracting its converting search terms would destroy 14 months of discovery data and kill whatever organic signal was being sustained.\n\nThe correct sequence is:\n1. **Pull the search term report** for the full 14-month lifetime of the campaign\n2. **Filter for converting search terms** (orders ≥ 1) — these are gold. Export and build manual exact campaigns around the top performers\n3. **Filter for zero-conversion bleeders** — search terms with significant spend (>$30) and zero orders. These get added as negative exact to the auto\n4. **Reduce the auto campaign budget cap** to a controlled discovery budget (e.g., $200–400/day) once you've extracted the winners\n5. **Monitor for 2 weeks** to ensure manual campaigns sustain performance before making further changes\n\nA 68% ACoS auto campaign with 14 months of data is a **gold mine wrapped in a dumpster fire**. The data is valuable; the uncontrolled spend is the problem.",
    operatorTakeaway:
      'Mine auto campaigns before touching them. Converting search terms = manual exact candidates. Zero-conversion spend = negative exact targets.',
  },
  {
    id: 'scenario-tacos-rise',
    courseSlug: 'amazon-ads-foundations',
    lessonSlug: 'metrics-measurement',
    order: 3,
    title: 'TACoS Rising with Stable Organics',
    level: 'Advanced',
    context:
      "A brand you manage has been running for 8 months. Organic sales are stable and growing slightly. But over the last 30 days, Sponsored Products spend increased 31% while Total Advertising Cost of Sale (TACoS) rose from 14% to 21%. ACoS itself is 38% (hasn't changed much). The category has no major seasonal events.",
    keyMetrics: [
      { label: 'TACoS', before: '14%', after: '21%' },
      { label: 'ACoS', before: '37%', after: '38%' },
      { label: 'Paid Spend (30d)', before: '$3,800', after: '$4,978' },
      {
        label: 'Organic Revenue',
        before: 'Growing',
        after: 'Stable/Slight growth',
      },
    ],
    question: 'What does this TACoS pattern actually signal?',
    choices: [
      {
        id: 'a',
        text: 'ACoS is still fine at 38% so there is no real problem here.',
      },
      {
        id: 'b',
        text: 'TACoS is rising because organic revenue growth slowed — ads now represent a bigger share of total sales.',
      },
      {
        id: 'c',
        text: 'This means paid ads are cannibalizing organic rank and should be reduced immediately.',
      },
      {
        id: 'd',
        text: 'The campaign became less efficient — bids should be cut across the board.',
      },
      {
        id: 'e',
        text: 'Investigate whether organic rank for core keywords is slipping, causing sales to shift from organic to paid.',
      },
    ],
    correctIds: ['b', 'e'],
    coachReasoning:
      "This is one of the most misunderstood metrics patterns in Amazon advertising.\n\n**TACoS = Total Ad Spend ÷ Total Revenue (organic + paid)**\n\nWhen TACoS rises but ACoS stays flat, it means **the organic-to-paid revenue ratio is shifting** — more of your total revenue is now coming through paid channels instead of organic. This can happen for two reasons:\n\n1. **Organic rank slipped** for core keywords → customers who would have found you organically are now clicking your ads instead. This is the dangerous scenario. You're paying for clicks that used to be free.\n2. **You scaled spend correctly** → you're deliberately buying more market share and TACoS rising is expected. This is fine if your unit economics support it.\n\nThe diagnostic: **Pull organic keyword rank for your top 5 revenue-driving keywords.** If ranks dropped from page 1 position 3–6 to page 2, your organic capture rate fell and ads are compensating. The fix is not cutting spend — it's diagnosing *why* rank dropped (review velocity, conversion rate, competitor new listing, etc.).\n\nACoS being stable at 38% is irrelevant to this analysis. ACoS only measures paid efficiency. TACoS measures your advertising dependence on total business revenue. A business with 21% TACoS is spending $0.21 of every revenue dollar on ads — that's a P&L alarm worth understanding.",
    operatorTakeaway:
      'TACoS rising with stable ACoS = organic rank may be slipping. Check keyword rank before adjusting bids.',
  },
  {
    id: 'scenario-new-asin-launch',
    courseSlug: 'amazon-ads-foundations',
    lessonSlug: 'how-amazon-advertising-works',
    order: 4,
    title: 'New ASIN Launch — Ad Decision',
    level: 'Beginner',
    context:
      'A client just got their first shipment of a new product into FBA. The listing is live. It has 0 reviews. The images are decent but not professional-grade. The main image meets Amazon requirements. Price point is competitive. The client is excited and asks: "Should we turn on Sponsored Products ads right now to get momentum?"',
    keyMetrics: [
      { label: 'Reviews', before: '—', after: '0' },
      { label: 'Star rating', before: '—', after: 'N/A' },
      {
        label: 'Main image',
        before: '—',
        after: 'Compliant, not professional',
      },
      { label: 'A+ Content', before: '—', after: 'Not uploaded' },
    ],
    question: 'What do you recommend?',
    choices: [
      {
        id: 'a',
        text: 'Yes — start ads immediately on Auto targeting with a low daily budget to gather early data.',
      },
      {
        id: 'b',
        text: 'No — wait until you have at least 15 reviews and a 4.0+ star rating before spending on ads.',
      },
      {
        id: 'c',
        text: 'Run a small exact-match campaign only on the brand name to protect the listing, but hold off on broad discovery spend.',
      },
      {
        id: 'd',
        text: 'Fix the listing first: professional main image, A+ Content, and get 10–15 early reviews via Vine or reviewer program before launching paid discovery.',
      },
      {
        id: 'e',
        text: 'Launch ads but only for keywords where competitors have similar or lower review counts.',
      },
    ],
    correctIds: ['d'],
    coachReasoning:
      "**Running ads on a listing with zero reviews is burning money to drive traffic to a conversion dead-end.**\n\nHere's the math: if your listing converts at 4% (which is below average with no social proof), you need 25 clicks to make one sale. At $0.80 CPC average, that's $20 in ad spend per order — before you've even proven the listing can convert at all.\n\nWith 0 reviews, your conversion rate on cold traffic is likely 1–2%. That means 50–100 clicks ($40–$80) per sale. At that conversion rate, almost no product can maintain a profitable ACoS.\n\n**The correct sequence for launch:**\n1. Professional-grade main image (the highest-ROI listing investment)\n2. Complete A+ Content uploaded (brand-registered sellers)\n3. All 5 bullet points written with primary keyword in the first bullet\n4. Backend search terms populated\n5. Enroll in Amazon Vine to get 1–30 reviews (if eligible)\n6. Alternatively, use friends/family for legitimate early reviews\n7. **Once you have 10+ reviews and 4.0+ stars → activate Sponsored Products Auto at controlled budget**\n\nThe exception: you can run a **brand name exact match campaign** immediately to protect your listing from competitor conquesting, but discovery spend (auto, broad) should wait for conversion rate proof.",
    operatorTakeaway:
      'Ads drive traffic. Listings convert traffic. Fix conversion rate before buying traffic — never the reverse.',
  },
  {
    id: 'scenario-dynamic-bidding',
    courseSlug: 'amazon-ads-foundations',
    lessonSlug: 'bids-budgets',
    order: 5,
    title: 'Dynamic Bidding — Which Strategy?',
    level: 'Intermediate',
    context:
      "You're setting up a new Sponsored Products campaign for an established product. It has 4.4 stars, 280 reviews, and a proven 12% conversion rate on organic traffic. You've confirmed the listing is strong. This is a manual exact-match campaign targeting your top 8 proven keywords. You're now at the bidding strategy selection screen. Options are: Dynamic Bids - Down Only, Dynamic Bids - Up and Down, or Fixed Bids.",
    keyMetrics: [
      { label: 'Product reviews', before: '—', after: '280 (4.4★)' },
      { label: 'Organic CVR', before: '—', after: '12%' },
      { label: 'Campaign type', before: '—', after: 'Manual exact match' },
      { label: 'Goal', before: '—', after: 'Profitable scale' },
    ],
    question: 'Which bidding strategy do you select and why?',
    choices: [
      {
        id: 'a',
        text: 'Dynamic Bids – Up and Down: Amazon will optimize bids automatically in both directions for maximum conversions.',
      },
      {
        id: 'b',
        text: 'Fixed Bids: You control exactly what you pay per click with no algorithmic adjustment.',
      },
      {
        id: 'c',
        text: 'Dynamic Bids – Down Only: Amazon can lower bids when a conversion is less likely, but cannot raise them above your set bid.',
      },
      {
        id: 'd',
        text: 'Dynamic Bids – Up and Down with a placement multiplier of +100% on top of search.',
      },
    ],
    correctIds: ['c'],
    coachReasoning:
      "**Dynamic Bids – Down Only is the correct starting strategy for almost every manual campaign.**\n\nHere's why 'Up and Down' is dangerous:\n- Amazon can raise your bid by up to **100% above your set bid** when it thinks a conversion is likely\n- This means a $1.20 bid can become $2.40 without your explicit permission\n- Amazon's conversion likelihood model is based on population averages — it doesn't know your specific margin requirements\n- You can easily blow through budget on high-CPC placements that don't align with your profitability targets\n\n**Down Only** is the disciplined operator's choice because:\n- Your bid is a **ceiling**, not a floor\n- Amazon can reduce the bid when placement quality is lower (e.g., off-search, bottom of page)\n- But it cannot exceed your specified maximum\n- You maintain margin control while still benefiting from algorithmic efficiency on low-value placements\n\n**Fixed Bids** are useful for situations where you want absolute predictability (e.g., brand defense campaigns, retargeting campaigns) but they miss efficiency opportunities on lower-quality placements.\n\n**The Up and Down + placement multiplier combination** (Option D) is the most dangerous choice — you're telling Amazon it can double your bid at top of search AND use dynamic bidding on top of that. This is how $200 daily budgets disappear in 4 hours.\n\nRule: **Start every manual campaign on Down Only. Graduate to Up and Down only after 30 days of proven CVR data shows the algorithm is making good decisions.**",
    operatorTakeaway:
      'Down Only = bid ceiling you control. Up and Down = blank check for Amazon to spend above your target. Start with Down Only, always.',
  },
];

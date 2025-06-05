import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Initializes the Google Generative AI client.
 * Retrieves the API key from environment variables and throws an error if it's not found.
 * @returns An instance of GoogleGenerativeAI.
 * @throws {Error} If GEMINI_API_KEY is not defined.
 */
export const initGeminiAI = (): GoogleGenerativeAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Log the error for debugging purposes
    console.error(
      'Configuration Error: GEMINI_API_KEY is not defined in environment variables.',
    );
    throw new Error(
      'Missing GEMINI_API_KEY environment variable. Please configure your environment.',
    );
  }
  // Return a new instance of the AI client
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Centralized AI model configurations.
 * Defines default settings for different AI models.
 */
export const AI_MODELS = {
  gemini: {
    default: 'gemini-1.5-flash-latest', // Using a potentially more up-to-date model identifier if available and suitable
    config: {
      maxOutputTokens: 1000,
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    },
  },
  // Add configurations for other models here if needed
} as const;

/**
 * AI feature-specific configurations.
 * Overrides or extends default model configurations for specific use cases.
 */
export const AI_FEATURES = {
  keywordAnalyzer: {
    model: AI_MODELS.gemini.default, // Explicitly referencing the default model
    config: {
      ...AI_MODELS.gemini.config, // Start with default settings
      temperature: 0.5, // More focused for keyword analysis (override)
      maxOutputTokens: 800, // Potentially smaller output needed
    },
  },
  listingOptimizer: {
    model: AI_MODELS.gemini.default,
    config: {
      ...AI_MODELS.gemini.config,
      temperature: 0.6, // Balanced creativity for listings (override)
      maxOutputTokens: 1200, // Potentially larger output needed
    },
  },
  ppcCampaign: {
    model: AI_MODELS.gemini.default,
    config: {
      ...AI_MODELS.gemini.config,
      temperature: 0.3, // More conservative for PPC suggestions (override)
      topP: 0.7, // Tighter sampling
    },
  },
  seoAnalyzer: {
    model: AI_MODELS.gemini.default,
    config: {
      ...AI_MODELS.gemini.config,
      temperature: 0.4, // Balanced for SEO analysis (override)
      maxOutputTokens: 1500, // Allow more detailed SEO reports (override)
    },
  },
  // Add configurations for other features here
  wesAIAgent: {
    model: AI_MODELS.gemini.default,
    config: {
      ...AI_MODELS.gemini.config,
      temperature: 0.7, // Default temperature for the agent
    },
    systemPrompt: `**Prompt for WesAI Agent:**

Hey WesAI, it's John Wesley Quintero. I need your assistance with crafting responses for my job applications. I'll provide data from LinkedIn, Online Jobs PH, or other platforms, and we'll use it to create tailored and effective application materials. Here's how you can assist me:

**Objective:**
Generate accurate, concise, and natural-sounding answers for job application questions. Highlight my relevant skills and experiences without exaggeration, using a professional yet slightly casual tone.

**Context:**
Use my profile data and any additional context I provide to create these responses. Focus on my experience in Amazon account management, SEO, PPC advertising, and other e-commerce-related tasks.

**Task Request:**

1. **Job Application Questions:**
   - Create responses to job application questions if any are provided within the context.
   - Clearly label each answer with the corresponding question.
   - Keep answers concise, generally no more than three sentences per question.
   - Focus on specific examples and quantifiable achievements where possible.

2. **Dynamic Content Creation:**
   - **Headline:** Create a straightforward and concise headline that reflects my key qualifications and experiences.
   - **Summary:** Write a brief summary highlighting my key qualifications and experiences, focusing on my ability to increase conversion rates, address technical issues, and develop strategic marketing plans.
   - **Cover Letter:** Draft a tailored cover letter that aligns with the job description. Address it to "Dear Hiring Manager." Mention the company's reputation for innovation and how my skills align with their mission and values. Include a brief mention of a specific project or challenge I overcame that is relevant to the role. Use a standard business letter format with clear paragraphs and a professional closing. Include my email and links to my LinkedIn and portfolio in the signature as text-based links.

   - **LinkedIn Hiring Team Message Draft:** Create a concise and professional message to send to the hiring team on LinkedIn. Express my interest in the position and briefly highlight my relevant experience. Keep it concise and to the point. Include my LinkedIn link as a text-based link in the message.

**Focus Areas:**
- Amazon Account Management
- SEO (Search Engine Optimization)
- PPC (Pay-Per-Click) Advertising
- Any E-commerce Related Tasks

**Specific Job Requirements:**
Focus on increasing conversion rates, addressing technical and customer issues, and developing strategic marketing plans.

**Key Achievements:**
Highlight my experience in increasing Amazon sales and successfully managing PPC campaigns. Keep it factual and straightforward. Mention specific achievements and use quantifiable data where possible.

**Formatting Guidelines:**
- For the cover letter, use a standard business letter format with clear paragraphs and a professional closing.
- For the LinkedIn message, keep it concise and to the point, ideally no more than three to four sentences.

**Contact Information:**
- Email: wesley.ecomva@gmail.com
- LinkedIn: https://www.linkedin.com/in/johnwesleyquintero
- Portfolio: https://wescode.vercel.app/

**Examples of Questions:**
- "Can you describe a time when you successfully managed an Amazon account?"
- "How do you approach SEO for a new product launch?"

**Note:**
- Do not mention SP API (Selling Partner API) at this stage.
- Avoid using placeholder brackets and utilize the available data.
- Ensure that all responses are tailored to the specific job description and company.

**Feedback Loop:**
Provide responses in a format that allows me to easily review and give feedback. This will help us refine and improve the quality of the responses over time.`,
    modes: ['default', 'content', 'code'], // Define available modes, including 'code'
  },
} as const;

// Example of how these configurations might be used (not part of the refactored export)
/*
import { initGeminiAI, AI_FEATURES } from './this-file';

async function analyzeKeywords(prompt: string) {
  try {
    const genAI = initGeminiAI(); // Initialize the client
    const featureConfig = AI_FEATURES.keywordAnalyzer;
    const model = genAI.getGenerativeModel({
      model: featureConfig.model,
      generationConfig: featureConfig.config,
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    console.log(response.text());
  } catch (error) {
    console.error('Error during keyword analysis:', error);
    // Handle the error appropriately
  }
}
*/

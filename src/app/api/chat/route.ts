import { rateLimiter } from '@/lib/api/rate-limiter';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

// Enhanced Type Definitions
interface PersonalInfo {
  name: string;
  email: string;
  location: string;
  phone: string;
  familyInfo?: {
    sibling?: string;
    mother?: string;
    father?: string;
    girlfriend?: string;
  };
  socialLinks?: {
    blog?: { url: string; summary: string };
    amazonToolsBlog?: { url: string; summary: string };
    aiBlog?: { url: string; summary: string };
    ecommerceBlog?: { url: string; summary: string };
  };
}

interface ProfessionalProfile {
  title: string;
  summary: string;
  coreCompetencies?: string[];
}

interface Skills {
  technicalProficiencies?: string[];
  soft?: string[];
}

interface AmazonExpertise {
  certifications?: AmazonCertification[];
  areasOfExpertise?: string[];
  keyAchievements?: string[];
}

interface AmazonCertification {
  name: string;
}

interface WorkExperience {
  title: string;
  company: string;
  period: string;
  description: string;
  achievements: string[];
}

interface Education {
  degree: string;
  institution: string;
  period: string;
  description: string;
}

interface GeneralCertification {
  name: string;
  issuer: string;
  date: string;
  status: string;
}

interface FAQ {
  category: string;
  question: string;
  answer: string;
}

interface DevelopmentSetup {
  hardware?: string;
  connectivity?: string;
  audioVideo?: string;
  powerBackup?: string;
  devToolsWorkflow?: {
    collaboration?: string[];
    development?: string[];
  };
}

interface WebAppContext {
  projectOverview?: {
    name?: string;
    description?: string;
  };
}

interface PersonalContext {
  personalInfo?: PersonalInfo;
  professionalProfile?: ProfessionalProfile;
  skills?: Skills;
  amazonExpertise?: AmazonExpertise;
  workExperience?: WorkExperience[];
  education?: Education[];
  certifications?: GeneralCertification[];
}

interface PortfolioContext {
  personalContext?: PersonalContext;
  webappContext?: WebAppContext;
  developmentSetup?: DevelopmentSetup;
  faqs?: FAQ[];
}

interface ChatRequest {
  message: string;
  history?: ChatHistoryMessage[];
}

interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  response: string;
}

const NOT_SPECIFIED = 'Not specified';
const DEFAULT_MODEL = 'gemini-1.5-flash-latest';
const MAX_OUTPUT_TOKENS = 1000;
const TEMPERATURE = 0.85;
const TOP_P = 0.9;
const TOP_K = 40;

/**
 * Formats a section of the system instruction with proper fallbacks
 */
const formatSection = <T>(
  title: string,
  content: T[] | string | undefined,
  itemFormatter?: (item: T) => string,
): string => {
  if (!content) return `${title}: ${NOT_SPECIFIED}`;

  if (Array.isArray(content)) {
    if (content.length === 0) return `${title}: ${NOT_SPECIFIED}`;
    return `${title}:\n${content
      .map((item) => (itemFormatter ? `- ${itemFormatter(item)}` : `- ${item}`))
      .join('\n')}`;
  }

  return `${title}: ${content}`;
};

/**
 * Builds the comprehensive system instruction from portfolio context
 */
const buildSystemInstruction = (portfolioContext: PortfolioContext): string => {
  const { personalContext, webappContext, developmentSetup, faqs } =
    portfolioContext;

  return `You are Wesley Quintero, a skilled and experienced software engineer. Your personality is professional, friendly, and helpful. Respond in the first person, using "I", "me", "my". You have access to the following information about yourself:

Personal Information:
${formatSection('Name', personalContext?.personalInfo?.name)}
${formatSection('Email (Primary)', personalContext?.personalInfo?.email)}
${formatSection('Location', personalContext?.personalInfo?.location)}
${formatSection(
  'Family',
  personalContext?.personalInfo?.familyInfo
    ? [
        `My brother is ${personalContext.personalInfo.familyInfo.sibling ?? NOT_SPECIFIED}`,
        `my mother is ${personalContext.personalInfo.familyInfo.mother ?? NOT_SPECIFIED}`,
        `my father is ${personalContext.personalInfo.familyInfo.father ?? NOT_SPECIFIED}`,
        `my girlfriend is ${personalContext.personalInfo.familyInfo.girlfriend ?? NOT_SPECIFIED}`,
      ]
    : NOT_SPECIFIED,
)}
${formatSection('Phone', personalContext?.personalInfo?.phone)}
${formatSection('Role', personalContext?.professionalProfile?.title)}
${formatSection('Summary', personalContext?.professionalProfile?.summary)}
${formatSection('Core Competencies', personalContext?.professionalProfile?.coreCompetencies)}

Technical Skills:
${formatSection('Proficiencies', personalContext?.skills?.technicalProficiencies)}
${formatSection('Soft Skills', personalContext?.skills?.soft)}

Amazon Web Services (AWS) Expertise:
${formatSection(
  'My Amazon Specific Certifications (Conceptual)',
  personalContext?.amazonExpertise?.certifications?.map(
    (c: AmazonCertification) => c.name,
  ),
)}
${formatSection('Areas', personalContext?.amazonExpertise?.areasOfExpertise)}
${formatSection('Key Achievements', personalContext?.amazonExpertise?.keyAchievements)}

Work Experience:
${formatSection(
  '',
  personalContext?.workExperience,
  (exp: WorkExperience) =>
    `${exp.title} at ${exp.company} (${exp.period}): ${exp.description}. Achievements: ${exp.achievements.join(', ')}.`,
)}

Education:
${formatSection(
  '',
  personalContext?.education,
  (edu: Education) =>
    `${edu.degree} from ${edu.institution} (${edu.period}). ${edu.description}`,
)}

Certifications:
${formatSection(
  '',
  personalContext?.certifications,
  (cert: GeneralCertification) =>
    `${cert.name} from ${cert.issuer} (Issued: ${cert.date}, Status: ${cert.status})`,
)}

Web App Information:
${formatSection('Project', webappContext?.projectOverview?.name)}
${formatSection('Description', webappContext?.projectOverview?.description)}

Additional Resources:
${formatSection(
  'Blog',
  personalContext?.personalInfo?.socialLinks?.blog?.url,
  () =>
    `${personalContext?.personalInfo?.socialLinks?.blog?.url} (Summary: ${personalContext?.personalInfo?.socialLinks?.blog?.summary ?? NOT_SPECIFIED})`,
)}
${formatSection(
  'Amazon Tools Blog',
  personalContext?.personalInfo?.socialLinks?.amazonToolsBlog?.url,
  () =>
    `${personalContext?.personalInfo?.socialLinks?.amazonToolsBlog?.url} (Summary: ${personalContext?.personalInfo?.socialLinks?.amazonToolsBlog?.summary ?? NOT_SPECIFIED})`,
)}
${formatSection(
  'AI Implementation Blog',
  personalContext?.personalInfo?.socialLinks?.aiBlog?.url,
  () =>
    `${personalContext?.personalInfo?.socialLinks?.aiBlog?.url} (Summary: ${personalContext?.personalInfo?.socialLinks?.aiBlog?.summary ?? NOT_SPECIFIED})`,
)}
${formatSection(
  'E-commerce Tips Blog',
  personalContext?.personalInfo?.socialLinks?.ecommerceBlog?.url,
  () =>
    `${personalContext?.personalInfo?.socialLinks?.ecommerceBlog?.url} (Summary: ${personalContext?.personalInfo?.socialLinks?.ecommerceBlog?.summary ?? NOT_SPECIFIED})`,
)}

Development Setup:
${formatSection('Hardware', developmentSetup?.hardware)}
${formatSection('Connectivity', developmentSetup?.connectivity)}
${formatSection('Audio/Video', developmentSetup?.audioVideo)}
${formatSection('Power Backup', developmentSetup?.powerBackup)}
${formatSection('Collaboration Tools', developmentSetup?.devToolsWorkflow?.collaboration)}
${formatSection('Development Tools', developmentSetup?.devToolsWorkflow?.development)}

FAQs:
${formatSection(
  '',
  faqs,
  (faq: FAQ) =>
    `Category: ${faq.category}, Question: ${faq.question}, Answer: ${faq.answer}`,
)}

[Rest of the system instruction with core directives remains the same...]`;
};

export async function POST(request: NextRequest) {
  const identifier = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success } = await rateLimiter.limit(identifier);

  if (!success) {
    return NextResponse.json(
      createErrorResponse('Too many requests', 'RATE_LIMIT_EXCEEDED'),
      { status: 429 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      'Chat API Error: Missing GEMINI_API_KEY environment variable',
    );
    return NextResponse.json(
      createErrorResponse(
        'Chat service configuration error. API key is missing.',
        'MISSING_API_KEY',
      ),
      { status: 500 },
    );
  }

  let body: ChatRequest;
  try {
    body = await request.json();
    if (!body.message?.trim()) {
      return NextResponse.json(
        createErrorResponse('Message is required', 'MISSING_MESSAGE'),
        { status: 400 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      createErrorResponse('Invalid request body', 'INVALID_REQUEST'),
      { status: 400 },
    );
  }

  const { message, history = [] } = body;
  console.log('Received history from frontend:', history);

  try {
    // Load portfolio context
    const portfolioContextData = await import('@/data/chat-context.json');
    const portfolioContext: PortfolioContext = portfolioContextData.default[0];

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL_NAME || DEFAULT_MODEL,
      generationConfig: {
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: TEMPERATURE,
        topP: TOP_P,
        topK: TOP_K,
      },
      systemInstruction: {
        role: 'system',
        parts: [{ text: buildSystemInstruction(portfolioContext) }],
      },
    });

    // Filter and transform history to Gemini format
    const transformedHistory = history
      .filter((msg, index) => !(index === 0 && msg.role === 'assistant'))
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    const chat = model.startChat({ history: transformedHistory });

    const startTime = Date.now();
    console.log('Sending message to Gemini:', message);
    const result = await chat.sendMessage(message);
    const endTime = Date.now();
    console.log(`Gemini API call duration: ${endTime - startTime}ms`);

    const responseText = result.response.text();
    console.log('Response text from response.text():', responseText);

    const response: ChatResponse = { response: responseText };
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Chat API Error:', {
      error,
      message: (error as Error)?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      ...(body?.message && { lastMessage: body.message }),
    });

    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

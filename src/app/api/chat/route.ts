import { rateLimiter } from '@/lib/api/rate-limiter';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

// --- Updated Type Definitions ---

// Personal Information related types
interface FamilyInfo {
  sibling?: string;
  mother?: string;
  father?: string;
  girlfriend?: string;
}

interface SocialLinkDetail {
  url: string;
  summary: string;
}

interface SocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  resume?: string;
  blog?: SocialLinkDetail;
  amazonToolsBlog?: SocialLinkDetail;
  aiBlog?: SocialLinkDetail;
  ecommerceBlog?: SocialLinkDetail;
}

interface PersonalInfo {
  name: string;
  email: string;
  secondaryEmail?: string;
  phone: string;
  location: string;
  familyInfo?: FamilyInfo;
  socialLinks?: SocialLinks;
}

// Professional Profile related types
interface ProfessionalProfile {
  title: string;
  tagline?: string;
  summary: string;
  coreCompetencies?: string[];
  careerGoals?: string[];
  strengths?: string[];
  details?: string;
  keyAchievements?: string[];
  typicalResponsibilities?: string[]; // Added based on JSON refinement
}

// Skills
interface Skills {
  technicalProficiencies?: string[];
  soft?: string[];
}

// Amazon Expertise related types
interface AmazonCertification {
  name: string;
  issuingBody?: string;
  status?: string;
  startDate?: string;
  link?: string;
}

interface AmazonExpertise {
  certifications?: AmazonCertification[];
  areasOfExpertise?: string[];
  details?: string; // Can refer to main profile or be specific
  keyAchievements?: string; // Can refer to main profile or be specific
}

// Work Experience
interface WorkExperience {
  title: string;
  company: string;
  period: string;
  description: string;
  achievements: string[];
  startDate?: string;
  endDate?: string | null;
}

// Education
interface Education {
  degree: string;
  institution: string;
  period: string;
  description: string;
  skills?: string[];
}

// General Certifications
interface GeneralCertification {
  name: string;
  issuer: string;
  date: string;
  status: string;
  credentialId?: string;
}

// FAQs
interface FAQ {
  category: string;
  question: string;
  answer: string;
}

// Common Queries (New in PersonalContext)
interface CommonQueryDetail {
  summary: string;
  details: string;
  keywords: string[];
}
interface CommonQueries {
  [key: string]: CommonQueryDetail; // e.g., portfolio, experience
}

// Job Application Profile (New in PersonalContext)
interface JobApplicationProfile {
  targetRoles?: string[];
  keySkillsEmphasized?: string[];
  preferredTools?: string[];
  jobSearchStatus?: {
    activelyApplying?: boolean;
    targetSalaryRangeUSD?: string;
    willingToWorkUsHours?: boolean;
    acceptableWorkArrangements?: string[];
  };
  summaryStatement?: string; // Changed from additional_context for clarity
}

// Personal Context
interface PersonalContext {
  personalInfo?: PersonalInfo;
  professionalProfile?: ProfessionalProfile;
  skills?: Skills;
  amazonExpertise?: AmazonExpertise;
  workExperience?: WorkExperience[];
  education?: Education[];
  certifications?: GeneralCertification[];
  commonQueries?: CommonQueries; // Added
  jobApplicationProfile?: JobApplicationProfile; // Added
}

// Web App Context
interface WebAppTool {
  name: string;
  description: string;
  category?: string;
  keywords?: string[];
  version?: string;
  status?: string;
  features?: string[];
  knownIssues?: string[];
  roadmap?: string[];
  impact?: string; // Added from amazonPortfolioPlatform example
  keyEnhancements?: string[]; // Added to match CRMFeature, ProjectManagementFeature, AmazonSellerToolsFeature
  subToolsExamples?: string[]; // Added to match AmazonSellerToolsFeature
}
interface WebAppComponents {
  [key: string]: {
    // e.g. listingQualityChecker, errorBoundary
    name: string;
    targetAudience: string;
    description: string;
    functionalities?: string[];
    testing?: string;
    file?: string;
    technicalDetails?: string;
    dependencies?: string[];
  };
}
interface WebAppTechnicalDetails {
  majorLibraries?: { name: string; purpose: string }[];
  testing?: { approach: string; examples: string[] };
  errorHandling?: { methods: string[]; example: string };
  projectStructure?: {
    description: string;
    directories: { [key: string]: string };
  };
  ui?: { libraries: string[]; styling: string };
}

interface WebAppContext {
  projectOverview?: {
    name?: string;
    description?: string;
    currentStatus?: string;
    version?: string;
    lastUpdate?: string;
    developmentPriorities?: string[];
    repository?: string;
    documentation?: string;
  };
  tools?: {
    // Index signature for various tools
    [toolKey: string]: WebAppTool;
  };
  components?: WebAppComponents;
  technicalDetails?: WebAppTechnicalDetails;
}

// Development Setup
interface DevToolsWorkflow {
  collaboration?: string[];
  development?: string[];
  monitoring?: string[];
  ciCd?: string[];
  versionControl?: string;
}
interface DevelopmentSetup {
  hardware?: string;
  connectivity?: string;
  audioVideo?: string;
  powerBackup?: string;
  devToolsWorkflow?: DevToolsWorkflow;
}

// Interactive Capabilities (New at root)
interface InteractiveCapability {
  id: string;
  name: string;
  description: string;
  activationPhrases: string[];
  outputFormatHints: string;
  relatedTools?: string[];
}

// System Directives (New at root)
interface SystemDirectives {
  greeting?: string;
  persona?: string;
  contextAdherence?: string;
  capabilitiesStatement?: string;
  mermaidSyntax?: string;
  htmlGeneration?: string;
  jsonGeneration?: string;
  codeEditing?: string;
  privacy?: string;
  appBuildingAssistance?: string;
  dataAnalysisAssistance?: string;
  generalAssistance?: string; // Added to match updated chat-context.json
}

// Root Portfolio Context type matching the single JSON object
interface PortfolioContext {
  version?: string;
  lastUpdated?: string;
  metadata?: {
    author?: string;
    purpose?: string;
    schemaVersion?: string;
  };
  personalContext?: PersonalContext;
  webappContext?: WebAppContext;
  developmentSetup?: DevelopmentSetup;
  faqs?: FAQ[];
  interactiveCapabilities?: InteractiveCapability[]; // Added
  systemDirectives?: SystemDirectives; // Added
}

// Chat Request/Response types
interface ChatRequest {
  message: string;
  history?: ChatHistoryMessage[];
  mode?: 'default' | 'content'; // Add mode to the request interface
}

interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GeminiHistoryPart {
  role: 'user' | 'model';
  parts: Part[];
}

interface ChatResponse {
  response: string;
}

// --- Constants ---
const NOT_SPECIFIED = 'Not specified';

const GEMINI_CONFIG = {
  DEFAULT_MODEL: 'gemini-1.5-flash-latest',
  MAX_OUTPUT_TOKENS: 1000,
  TEMPERATURE: 0.85,
  TOP_P: 0.9,
  TOP_K: 40,
};

// --- Portfolio Context Loading (Memoized) ---
let portfolioContextPromise: Promise<PortfolioContext> | null = null;

async function getPortfolioContext(): Promise<PortfolioContext> {
  if (portfolioContextPromise) {
    return portfolioContextPromise;
  }
  portfolioContextPromise = (async () => {
    try {
      const portfolioContextModule = await import('@/data/chat-context.json');
      // FIX: Load the default export, which is now the single context object
      const context = portfolioContextModule.default;

      if (!context || typeof context !== 'object' || Array.isArray(context)) {
        console.error(
          'Failed to load or parse portfolio context from chat-context.json. Expected a single object.',
        );
        throw new Error('Chat context data is invalid or missing.');
      }
      return context as PortfolioContext;
    } catch (error) {
      console.error('Error loading portfolio context:', error);
      portfolioContextPromise = null; // Allow retry on next call
      throw new Error('Failed to initialize chat context.');
    }
  })();
  return portfolioContextPromise;
}

// --- System Instruction Builder ---

const formatSection = <T>(
  title: string,
  content: T[] | string | undefined | null,
  itemFormatter?: (item: T) => string,
): string => {
  const formatContent = (): string => {
    if (
      content === undefined ||
      content === null ||
      (typeof content === 'string' && content.trim() === '') ||
      (Array.isArray(content) && content.length === 0)
    ) {
      return NOT_SPECIFIED;
    }
    if (Array.isArray(content)) {
      return content
        .map((item) => (itemFormatter ? itemFormatter(item) : String(item)))
        .map((line) =>
          !line.trim().startsWith('-') && !line.trim().startsWith('*')
            ? `- ${line}`
            : line,
        )
        .join('\n');
    }
    return String(content);
  };

  const formattedContent = formatContent();
  if (!title) {
    return formattedContent;
  }
  if (formattedContent === NOT_SPECIFIED) {
    return `${title}: ${NOT_SPECIFIED}`;
  }
  if (
    Array.isArray(content) &&
    content.length > 0 &&
    formattedContent !== NOT_SPECIFIED
  ) {
    return `${title}:\n${formattedContent}`;
  }
  return `${title}: ${formattedContent}`;
};

const formatFamilyInfo = (family?: FamilyInfo): string => {
  if (!family || Object.keys(family).length === 0)
    return `Family: ${NOT_SPECIFIED}`;
  const members = [
    family.sibling && `My brother is ${family.sibling}`,
    family.mother && `my mother is ${family.mother}`,
    family.father && `my father is ${family.father}`,
    family.girlfriend && `my girlfriend is ${family.girlfriend}`,
  ].filter(Boolean);

  return members.length > 0
    ? `Family:\n${members.map((m) => `- ${m}`).join('\n')}` // Ensure bullet points here too
    : `Family: ${NOT_SPECIFIED}`;
};

const formatSocialLink = (
  linkName: string,
  linkData?: SocialLinkDetail | string, // Allow for simple string URLs from socialLinks like linkedin
): string => {
  if (!linkData) return `${linkName}: ${NOT_SPECIFIED}`;
  if (typeof linkData === 'string') {
    return `${linkName}: ${linkData}`;
  }
  return `${linkName}: ${linkData.url} (Summary: ${linkData.summary ?? NOT_SPECIFIED})`;
};

const _formatPersonalInfo = (
  personalInfo?: PersonalInfo,
  socialLinks?: SocialLinks,
  familyInfo?: FamilyInfo,
): string[] => {
  if (!personalInfo) return [`Personal Information: ${NOT_SPECIFIED}`];

  const parts = [
    'Personal Information:',
    formatSection('Name', personalInfo.name),
    formatSection('Email (Primary)', personalInfo.email),
    formatSection('Secondary Email', personalInfo.secondaryEmail),
    formatSection('Location', personalInfo.location),
    formatFamilyInfo(familyInfo),
    formatSection('Phone', personalInfo.phone),
  ];

  if (socialLinks) {
    parts.push(
      formatSocialLink('LinkedIn', socialLinks.linkedin),
      formatSocialLink('GitHub', socialLinks.github),
      formatSocialLink('Portfolio Site', socialLinks.portfolio),
      formatSocialLink('Resume', socialLinks.resume),
    );
  }
  return parts.filter(Boolean) as string[];
};

const _formatProfessionalProfile = (
  profile?: ProfessionalProfile,
): string[] => {
  if (!profile) return [`Professional Profile: ${NOT_SPECIFIED}`];

  return [
    '\nProfessional Profile:',
    formatSection('Role', profile.title),
    formatSection('Tagline', profile.tagline),
    formatSection('Summary', profile.summary),
    formatSection('Core Competencies', profile.coreCompetencies),
    formatSection('Career Goals', profile.careerGoals),
    formatSection('Strengths', profile.strengths),
    formatSection('Detailed Experience/Approach', profile.details),
    formatSection('Key Achievements (Professional)', profile.keyAchievements),
    formatSection('Typical Responsibilities', profile.typicalResponsibilities),
  ].filter(Boolean) as string[];
};

const _formatSkills = (skills?: Skills): string[] => {
  if (!skills) return [`Technical Skills: ${NOT_SPECIFIED}`];

  return [
    '\nTechnical Skills:',
    formatSection('Proficiencies', skills.technicalProficiencies),
    formatSection('Soft Skills', skills.soft),
  ].filter(Boolean) as string[];
};

const _formatAmazonExpertise = (
  amazonExpertise?: AmazonExpertise,
): string[] => {
  if (!amazonExpertise)
    return [`Amazon Web Services (AWS) Expertise: ${NOT_SPECIFIED}`];

  return [
    '\nAmazon Web Services (AWS) Expertise:',
    formatSection(
      'My Amazon Specific Certifications (Conceptual)',
      amazonExpertise.certifications?.map(
        (c) =>
          `${c.name} (${c.status || 'N/A'}) - ${c.issuingBody || 'Self-study'}`,
      ),
    ),
    formatSection('Areas of Expertise', amazonExpertise.areasOfExpertise),
    formatSection('Detailed Amazon Experience', amazonExpertise.details),
    formatSection('Key Amazon Achievements', amazonExpertise.keyAchievements),
  ].filter(Boolean) as string[];
};

const _formatWorkExperience = (workExperience: WorkExperience[]): string => {
  return `\nWork Experience:\n${formatSection(
    '',
    workExperience,
    (exp: WorkExperience) =>
      `${exp.title} at ${exp.company} (${exp.period}): ${exp.description}. Achievements: ${exp.achievements.join(', ')}.`,
  )}`;
};

const _formatEducation = (education: Education[]): string => {
  return `\nEducation:\n${formatSection(
    '',
    education,
    (edu: Education) =>
      `${edu.degree} from ${edu.institution} (${edu.period}). ${edu.description}${edu.skills ? ` Skills: ${edu.skills.join(', ')}` : ''}`,
  )}`;
};

const _formatCertifications = (
  generalCertifications: GeneralCertification[],
): string => {
  return `\nCertifications:\n${formatSection(
    '',
    generalCertifications,
    (cert: GeneralCertification) =>
      `${cert.name} from ${cert.issuer} (Issued: ${cert.date}, Status: ${cert.status}${cert.credentialId ? `, ID: ${cert.credentialId}` : ''})`,
  )}`;
};

const _formatCommonQueries = (commonQueries?: CommonQueries): string[] => {
  if (!commonQueries) return [];
  return [
    '\nCommonly Asked Questions & Quick Info:',
    ...Object.entries(commonQueries).map(([key, cq]) =>
      formatSection(
        `${key.charAt(0).toUpperCase() + key.slice(1)} Info`,
        `${cq.summary} Details: ${cq.details} (Keywords: ${cq.keywords.join(', ')})`,
      ),
    ),
  ].filter(Boolean) as string[];
};

const _formatJobApplicationProfile = (
  profile?: JobApplicationProfile,
): string[] => {
  if (!profile) return [];
  const parts: string[] = [
    '\nJob Application Profile Summary:',
    formatSection('Target Roles', profile.targetRoles),
    formatSection('Key Skills for Emphasis', profile.keySkillsEmphasized),
    formatSection('Preferred Tools', profile.preferredTools),
  ].filter(Boolean) as string[];

  if (profile.jobSearchStatus) {
    parts.push(
      formatSection(
        'Job Search Status',
        `Actively Applying: ${profile.jobSearchStatus.activelyApplying ? 'Yes' : 'No'}. US Hours: ${profile.jobSearchStatus.willingToWorkUsHours ? 'Yes' : 'No'}. Salary: ${profile.jobSearchStatus.targetSalaryRangeUSD}. Arrangements: ${profile.jobSearchStatus.acceptableWorkArrangements?.join(', ')}`,
      ),
    );
  }
  parts.push(formatSection('Summary Statement', profile.summaryStatement));
  return parts;
};

const _formatWebAppInformation = (webappContext?: WebAppContext): string[] => {
  if (!webappContext)
    return [`Web App Information (ScaleSmart Platform): ${NOT_SPECIFIED}`];

  const parts = [
    '\nWeb App Information (ScaleSmart Platform):',
    formatSection('Project', webappContext.projectOverview?.name),
    formatSection('Description', webappContext.projectOverview?.description),
    formatSection(
      'Current Status',
      webappContext.projectOverview?.currentStatus,
    ),
    formatSection('Version', webappContext.projectOverview?.version),
    formatSection(
      'Development Priorities',
      webappContext.projectOverview?.developmentPriorities,
    ),
  ].filter(Boolean) as string[];

  if (webappContext.tools) {
    Object.entries(webappContext.tools).forEach(([key, tool]) => {
      parts.push(
        `\nTool: ${tool.name || key}`,
        formatSection('Description', tool.description),
        formatSection('Status', tool.status),
        formatSection('Features', tool.features),
        formatSection('Roadmap', tool.roadmap),
      );
    });
  }
  return parts;
};

const _formatAdditionalResources = (socialLinks?: SocialLinks): string[] => {
  if (!socialLinks) return [`Additional Resources (Blogs): ${NOT_SPECIFIED}`];

  return [
    '\nAdditional Resources (Blogs):',
    formatSocialLink('Main Blog', socialLinks.blog),
    formatSocialLink('Amazon Tools Blog', socialLinks.amazonToolsBlog),
    formatSocialLink('AI Implementation Blog', socialLinks.aiBlog),
    formatSocialLink('E-commerce Tips Blog', socialLinks.ecommerceBlog),
  ].filter(Boolean) as string[];
};

const _formatDevelopmentSetup = (
  developmentSetup?: DevelopmentSetup,
): string[] => {
  if (!developmentSetup) return [`Development Setup: ${NOT_SPECIFIED}`];

  return [
    '\nDevelopment Setup:',
    formatSection('Hardware', developmentSetup.hardware),
    formatSection('Connectivity', developmentSetup.connectivity),
    formatSection('Audio/Video', developmentSetup.audioVideo),
    formatSection('Power Backup', developmentSetup.powerBackup),
    formatSection(
      'Collaboration Tools',
      developmentSetup.devToolsWorkflow?.collaboration,
    ),
    formatSection(
      'Development Tools',
      developmentSetup.devToolsWorkflow?.development,
    ),
    formatSection(
      'Monitoring Tools',
      developmentSetup.devToolsWorkflow?.monitoring,
    ),
    formatSection('CI/CD Tools', developmentSetup.devToolsWorkflow?.ciCd),
    formatSection(
      'Version Control',
      developmentSetup.devToolsWorkflow?.versionControl,
    ),
  ].filter(Boolean) as string[];
};

const _formatFAQs = (faqs: FAQ[]): string => {
  return `\nFAQs (General):\n${formatSection(
    '',
    faqs,
    (faq: FAQ) =>
      `Category: ${faq.category}, Question: ${faq.question}, Answer: ${faq.answer}`,
  )}`;
};

const _formatInteractiveCapabilities = (
  capabilities?: InteractiveCapability[],
): string[] => {
  if (!capabilities || capabilities.length === 0) return [];
  return [
    '\nMy Interactive Capabilities:',
    ...capabilities.map((cap) =>
      formatSection(
        cap.name,
        `${cap.description} (Activate by saying things like: "${cap.activationPhrases[0]}") Output: ${cap.outputFormatHints}`,
      ),
    ),
  ].filter(Boolean) as string[];
};

const _formatSystemDirectives = (
  systemDirectives?: SystemDirectives,
): string[] => {
  if (!systemDirectives) return [];
  return [
    systemDirectives.capabilitiesStatement
      ? `\nImportant Note for Me (AI): ${systemDirectives.capabilitiesStatement}`
      : '',
    systemDirectives.contextAdherence
      ? `\nGuideline for Me (AI): ${systemDirectives.contextAdherence}`
      : '',
    systemDirectives.mermaidSyntax
      ? `\nMermaid Diagram Generation Guideline: ${systemDirectives.mermaidSyntax}`
      : '',
    systemDirectives.htmlGeneration
      ? `\nHTML Generation Guideline: ${systemDirectives.htmlGeneration}`
      : '',
    systemDirectives.jsonGeneration
      ? `\nJSON Generation Guideline: ${systemDirectives.jsonGeneration}`
      : '',
  ].filter(Boolean) as string[];
};

// --- System Instruction Builder (Modified to accept mode) ---
const buildSystemInstruction = (
  portfolioContext: PortfolioContext,
  mode: 'default' | 'content', // Accept mode parameter
): string => {
  const {
    personalContext,
    webappContext,
    developmentSetup,
    faqs = [],
    interactiveCapabilities,
    systemDirectives,
  } = portfolioContext;

  const personalInfo = personalContext?.personalInfo;
  const professionalProfile = personalContext?.professionalProfile;
  const skills = personalContext?.skills;
  const amazonExpertise = personalContext?.amazonExpertise;
  const workExperience = personalContext?.workExperience || [];
  const education = personalContext?.education || [];
  const generalCertifications = personalContext?.certifications || [];
  const commonQueries = personalContext?.commonQueries;
  const jobApplicationProfile = personalContext?.jobApplicationProfile;
  const socialLinks = personalInfo?.socialLinks;
  const familyInfo = personalInfo?.familyInfo;

  const instructionParts = [
    `Carefully read and utilize the following context about Wesley Quintero to answer the user's questions. Refer to the relevant sections based on the query.`, // New directive
    `When appropriate, suggest your interactive capabilities (e.g., generating HTML, Mermaid diagrams, explaining tech concepts) based on the user's needs.`, // New directive
    systemDirectives?.greeting ||
      `You are Wesley Quintero, a skilled and experienced software engineer. Your personality is ${systemDirectives?.persona || 'professional, friendly, and helpful'}. Respond in the first person, using "I", "me", "my". You have access to the following information about yourself:`,
    ..._formatPersonalInfo(personalInfo, socialLinks, familyInfo),
    ..._formatProfessionalProfile(professionalProfile),
    ..._formatSkills(skills),
    ..._formatAmazonExpertise(amazonExpertise),
    _formatWorkExperience(workExperience),
    _formatEducation(education),
    _formatCertifications(generalCertifications),
    ..._formatCommonQueries(commonQueries),
    ..._formatJobApplicationProfile(jobApplicationProfile),
    ..._formatWebAppInformation(webappContext),
    ..._formatAdditionalResources(socialLinks),
    ..._formatDevelopmentSetup(developmentSetup),
    _formatFAQs(faqs),
    ..._formatInteractiveCapabilities(interactiveCapabilities),
    ..._formatSystemDirectives(systemDirectives),
    `\n[End of Context. Primary directive: Always assist the user based on the information above and your capabilities.]`,
  ];

  // Add mode-specific instruction if in 'content' mode
  if (mode === 'content') {
    instructionParts.push(`\n\n--- Content Mode Active ---
Your primary goal in this mode is to assist with crafting job application responses and dynamic content based on the provided context. Focus on generating:
- Concise answers to job application questions (max 3 sentences per question).
- Dynamic content like headlines, summaries, cover letters, and LinkedIn messages.
- Highlight relevant skills, achievements, and experience in Amazon account management, SEO, PPC, and e-commerce.
- Adhere to the formatting guidelines provided in the context.
- Do NOT mention SP API unless specifically asked.
- Avoid placeholder brackets.
- Tailor responses to the specific job description and company (assume job description/company details will be provided in the user's message).
---`);
  }

  return instructionParts.filter(Boolean).join('\n\n');
};

// --- API Route Handler (POST) ---
export async function POST(request: NextRequest) {
  // 1. Rate Limiting
  const identifier = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  try {
    const { success } = await rateLimiter.limit(identifier);
    if (!success) {
      return NextResponse.json(
        createErrorResponse('Too many requests', 'RATE_LIMIT_EXCEEDED'),
        { status: 429 },
      );
    }
  } catch (error) {
    console.error('Rate limiter error:', error);
    return NextResponse.json(
      createErrorResponse(
        'Internal server error during rate limiting',
        'RATE_LIMITER_ERROR',
      ),
      { status: 500 },
    );
  }

  // 2. API Key Check
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      'Chat API Error: Missing GEMINI_API_KEY environment variable.',
    );
    return NextResponse.json(
      createErrorResponse(
        'Chat service configuration error. API key is missing.',
        'MISSING_API_KEY',
      ),
      { status: 500 },
    );
  }

  // 3. Request Body Parsing and Validation
  let body: ChatRequest;
  try {
    body = await request.json();
    if (!body.message?.trim()) {
      return NextResponse.json(
        createErrorResponse(
          'Message is required and cannot be empty.',
          'MISSING_MESSAGE',
        ),
        { status: 400 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(
        'Invalid request body. Expected JSON.',
        'INVALID_REQUEST_BODY',
      ),
      { status: 400 },
    );
  }

  const { message, history = [], mode = 'default' } = body; // Extract mode with a default value

  try {
    // 4. Load Portfolio Context (memoized)
    const portfolioContext = await getPortfolioContext();

    // 5. Initialize Gemini AI Model
    const genAI = new GoogleGenerativeAI(apiKey);
    const systemInstructionString = buildSystemInstruction(
      portfolioContext,
      mode, // Pass the mode to the system instruction builder
    );
    // For debugging the generated prompt:
    // console.log("System Instruction Length:", systemInstructionString.length);
    // console.log("System Instruction (first 500 chars):", systemInstructionString.substring(0, 500));

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL_NAME || GEMINI_CONFIG.DEFAULT_MODEL,
      generationConfig: {
        maxOutputTokens: GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
        temperature: GEMINI_CONFIG.TEMPERATURE,
        topP: GEMINI_CONFIG.TOP_P,
        topK: GEMINI_CONFIG.TOP_K,
      },
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemInstructionString }],
      },
    });

    // 6. Transform Chat History for Gemini
    const transformedHistory: GeminiHistoryPart[] = history
      .filter((msg, index) => !(index === 0 && msg.role === 'assistant'))
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    // 7. Start Chat and Send Message
    const chat = model.startChat({ history: transformedHistory });

    const startTime = Date.now();
    const result = await chat.sendMessage(message);
    const endTime = Date.now();
    console.log(`Gemini API call duration: ${endTime - startTime}ms`);

    const responseText = result.response.text();
    const response: ChatResponse = { response: responseText };
    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat API Processing Error:', {
      errorDetails: error,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      ...(body?.message && { lastUserMessage: body.message }),
    });
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

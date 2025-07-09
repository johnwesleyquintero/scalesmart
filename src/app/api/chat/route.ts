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
  aiBlog?: SocialLinkDetail; // Kept as it might be used in other contexts
  ecommerceBlog?: SocialLinkDetail; // Kept as it might be used in other contexts
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
  typicalResponsibilities?: string[];
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
  details?: string;
  keyAchievements?: string;
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

// Common Queries
interface CommonQueryDetail {
  summary: string;
  details: string;
  keywords: string[];
}
interface CommonQueries {
  [key: string]: CommonQueryDetail;
}

// Job Application Profile
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
  summaryStatement?: string;
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
  commonQueries?: CommonQueries;
  jobApplicationProfile?: JobApplicationProfile;
}

// REFINED: RelevantFiles to allow both string[] and string
interface RelevantFiles {
  mainApplicationAndLayout?: string[];
  mainApplicationAndPages?: string[];
  components?: string[];
  apiRoutes?: string[];
  utilitiesAndHooks?: string[];
  indexedDbIntegration?: string;
  testFiles?: string[];
  contentFiles?: string[];
  dataFiles?: string[];
  librariesAndUtilities?: string[];
  contextAndHooks?: string;
  types?: string | string[];
  [key: string]: string[] | string | undefined; // Allow for other keys that are string arrays or single strings
}

// REFINED: WebAppTool to include new fields like overview, objective, and relevantFiles
interface WebAppTool {
  name: string;
  overview?: string; // Added based on JSON
  objective?: string; // Added based on JSON
  description: string;
  category?: string;
  keywords?: string[];
  version?: string;
  status?: string;
  features?: string[];
  knownIssues?: string[];
  roadmap?: string[];
  impact?: string;
  keyEnhancements?: string[];
  subToolsExamples?: string[];
  relevantFiles?: RelevantFiles; // Added based on JSON
}

interface WebAppComponents {
  [key: string]: {
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
    [toolKey: string]: WebAppTool;
  };
  components?: WebAppComponents;
  technicalDetails?: WebAppTechnicalDetails;
  indexedDbImplementation?: {
    // Added from JSON
    overview?: string;
    objective?: string;
    relevantCoreFiles?: {
      dbInitializationAndSchema?: string;
      utilityFunctions?: string;
    };
    featureSpecificFiles?: {
      name: string;
      path: string;
    }[];
  };
  developerGuidelinesAndConsiderations?: {
    // Added from JSON
    objective?: string;
    keyAreasOfChange?: {
      name: string;
      specificVersions?: string;
      impact: string;
      actionRequired: string;
    }[];
  };
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

// Interactive Capabilities
interface InteractiveCapability {
  id: string;
  name: string;
  description: string;
  activationPhrases: string[];
  outputFormatHints: string;
  relatedTools?: string[];
}

// REFINED: SystemDirectives and its nested interfaces to precisely match JSON
interface CodeGenerationDirectives {
  overallQuality: string;
  frontend: string;
  backend: string;
  database: string;
  portableWeb: string;
}

interface CareerAssistanceFramework {
  name: string;
  description: string;
  steps: string[];
}

interface CareerAssistanceContentRules {
  demonstrateNotDeclare: string;
  respectExistingWorkflows: string;
  coreNarrative: string;
  credibleMetrics: string;
}

interface CareerAssistanceDirectives {
  roleDescription: string;
  primeDirective: string;
  tone: string;
  writingPerspective: string;
  framework: CareerAssistanceFramework;
  contentRules: CareerAssistanceContentRules;
  prohibitedActions: string[];
}

interface SystemDirectives {
  greeting: string;
  persona: string;
  contextAdherence: string;
  proactiveEngagement: string;
  technicalGuidanceScope: string;
  codeGeneration: CodeGenerationDirectives;
  codeReviewAndDebugging: string;
  architecturalAndBestPractices: string;
  testingSupport: string;
  dataVisualization: string; // This is a string in the JSON
  jsonGeneration: string;
  codeEditing: string;
  careerAssistance: CareerAssistanceDirectives;
  outputFormatting: string;
  privacy: string;
  limitations: string;
}

// Root Portfolio Context matching the single JSON object
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
  interactiveCapabilities?: InteractiveCapability[];
  systemDirectives?: SystemDirectives;
}

// Chat Request/Response types
interface ChatRequest {
  message: string;
  history?: ChatHistoryMessage[];
  mode?: 'default' | 'content';
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
  MODELS: [
    // prioritize the latest flash model due to its speed and cost-effectiveness.
    'gemini-1.5-flash-latest',
    // Fallback to the latest pro model if flash is unavailable.
    'gemini-1.5-pro-latest',
    // A stable and reliable model as a further fallback.
    'gemini-pro',
  ],
  MAX_OUTPUT_TOKENS: 2048, // Increased for more detailed responses
  TEMPERATURE: 0.75, // Slightly reduced for more focused and less random responses
  TOP_P: 0.95, // Standard value
  TOP_K: 50, // Increased for more diversity in the generated response
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// --- Portfolio Context Loading (Memoized) ---
let portfolioContextPromise: Promise<PortfolioContext> | null = null;

async function getPortfolioContext(): Promise<PortfolioContext> {
  if (portfolioContextPromise) {
    return portfolioContextPromise;
  }
  portfolioContextPromise = (async () => {
    try {
      const portfolioContextModule = await import(
        '@/app/chat/data/chat-context.json'
      );
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

// --- System Instruction Builder Utilities ---

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
    ? `Family:\n${members.map((m) => `- ${m}`).join('\n')}`
    : `Family: ${NOT_SPECIFIED}`;
};

const formatSocialLink = (
  linkName: string,
  linkData?: SocialLinkDetail | string,
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

// REVISED: _formatWebAppInformation to include new tool fields but omit relevantFiles
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
        formatSection('Overview', tool.overview), // Added
        formatSection('Objective', tool.objective), // Added
        formatSection('Category', tool.category),
        formatSection('Description', tool.description),
        formatSection('Version', tool.version), // Tool-specific version
        formatSection('Status', tool.status),
        formatSection('Keywords', tool.keywords),
        formatSection('Features', tool.features),
        formatSection('Key Enhancements', tool.keyEnhancements),
        formatSection('Impact', tool.impact),
        // Relevant files are omitted from system instruction to keep it concise,
        // as the AI can access the full JSON context for detailed file paths if needed.
        formatSection('Known Issues', tool.knownIssues),
        formatSection('Roadmap', tool.roadmap),
        formatSection(
          'Sub-Tools Examples (if applicable)',
          tool.subToolsExamples,
        ),
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

// REVISED: _formatSystemDirectives to match JSON structure and intent for LLM instruction
const _formatSystemDirectives = (
  systemDirectives?: SystemDirectives,
): string[] => {
  if (!systemDirectives) {
    return [
      'AI Persona (Default): You are a helpful, professional, and knowledgeable AI assistant.',
      'Context Adherence: You must strictly adhere to the provided information.',
    ];
  }

  const parts: string[] = [];

  // Core Persona and Greeting
  parts.push(systemDirectives.greeting);
  parts.push(`Persona: ${systemDirectives.persona}`);
  parts.push(''); // Blank line for readability

  // Core Directives & Guardrails
  parts.push('--- Core Directives & Guardrails for My (AI) Operation ---');
  parts.push(`- Context Adherence: ${systemDirectives.contextAdherence}`);
  parts.push(`- Proactive Engagement: ${systemDirectives.proactiveEngagement}`);
  parts.push(
    `- Technical Guidance Scope: ${systemDirectives.technicalGuidanceScope}`,
  );
  parts.push(
    `- Code Review & Debugging: ${systemDirectives.codeReviewAndDebugging}`,
  );
  parts.push(
    `- Architectural & Best Practices: ${systemDirectives.architecturalAndBestPractices}`,
  );
  parts.push(`- Testing Support: ${systemDirectives.testingSupport}`);
  parts.push(`- Output Formatting: ${systemDirectives.outputFormatting}`);
  parts.push(`- Privacy: ${systemDirectives.privacy}`);
  parts.push(`- Limitations: ${systemDirectives.limitations}`);
  parts.push(''); // Blank line for readability

  // Detailed Code Generation Rules
  parts.push('--- Detailed Code Generation Rules ---');
  if (systemDirectives.codeGeneration) {
    const cg = systemDirectives.codeGeneration;
    parts.push(`- Overall Quality: ${cg.overallQuality}`);
    parts.push(`- Frontend (React/Next.js): ${cg.frontend}`);
    parts.push(`- Backend (Node.js/Express): ${cg.backend}`);
    parts.push(`- Database (MongoDB/PostgreSQL): ${cg.database}`);
    parts.push(`- Portable Web (HTML/CSS/JS): ${cg.portableWeb}`);
  }
  parts.push(''); // Blank line for readability

  // Other specific generation/editing rules (they are strings in the JSON)
  parts.push('--- Specific Generation & Editing Rules ---');
  parts.push(`- Data Visualization: ${systemDirectives.dataVisualization}`);
  parts.push(`- JSON Generation: ${systemDirectives.jsonGeneration}`);
  parts.push(`- Code Editing: ${systemDirectives.codeEditing}`);
  parts.push(''); // Blank line for readability

  // Career Assistance Specific Rules (Crucial for persona switching guidance)
  parts.push(
    "--- Career Assistance Guidelines (When providing career advice, adopt John Wesley Quintero's first-person persona) ---",
  );
  if (systemDirectives.careerAssistance) {
    const ca = systemDirectives.careerAssistance;
    parts.push(`- Role Description (as John Wesley): ${ca.roleDescription}`);
    parts.push(`- Prime Directive (as John Wesley): ${ca.primeDirective}`);
    parts.push(`- Tone (as John Wesley): ${ca.tone}`);
    parts.push(
      `- Writing Perspective (as John Wesley): ${ca.writingPerspective}`,
    );
    parts.push(
      `- Application Framework (C-A-P): ${ca.framework.name} - ${ca.framework.description}`,
    );
    ca.framework.steps.forEach((step, index) =>
      parts.push(`  Step ${index + 1}: ${step}`),
    );
    parts.push(`- Content Rules (for John Wesley's voice):`);
    parts.push(
      `  - Demonstrate Not Declare: ${ca.contentRules.demonstrateNotDeclare}`,
    );
    parts.push(
      `  - Respect Existing Workflows: ${ca.contentRules.respectExistingWorkflows}`,
    );
    parts.push(`  - Core Narrative: ${ca.contentRules.coreNarrative}`);
    parts.push(`  - Credible Metrics: ${ca.contentRules.credibleMetrics}`);
    parts.push(`- Prohibited Actions (when acting as John Wesley):`);
    ca.prohibitedActions.forEach((action) => parts.push(`  - ${action}`));
  }

  return parts.filter(Boolean) as string[];
};

// --- System Instruction Builder (Modified to accept mode) ---
const addSections = (
  sections: (string | string[])[],
  portfolioContext: PortfolioContext,
) => {
  const {
    personalContext,
    webappContext,
    developmentSetup,
    faqs = [],
    interactiveCapabilities,
    systemDirectives,
  } = portfolioContext;

  sections.push(_formatSystemDirectives(systemDirectives));
  if (personalContext) {
    sections.push(
      _formatPersonalInfo(
        personalContext.personalInfo,
        personalContext.personalInfo?.socialLinks,
        personalContext.personalInfo?.familyInfo,
      ),
    );
    sections.push(
      _formatProfessionalProfile(personalContext.professionalProfile),
    );
    sections.push(_formatSkills(personalContext.skills));
    sections.push(_formatAmazonExpertise(personalContext.amazonExpertise));
    sections.push(_formatWorkExperience(personalContext.workExperience || []));
    sections.push(_formatEducation(personalContext.education || []));
    sections.push(_formatCertifications(personalContext.certifications || []));
    sections.push(_formatCommonQueries(personalContext.commonQueries));
    sections.push(
      _formatJobApplicationProfile(personalContext.jobApplicationProfile),
    );
    if (personalContext.personalInfo?.socialLinks) {
      sections.push(
        _formatAdditionalResources(personalContext.personalInfo.socialLinks),
      );
    }
  }
  sections.push(_formatWebAppInformation(webappContext));
  sections.push(_formatDevelopmentSetup(developmentSetup));
  sections.push(_formatFAQs(faqs));
  sections.push(_formatInteractiveCapabilities(interactiveCapabilities || []));
};

const buildSystemInstruction = (
  portfolioContext: PortfolioContext,
  mode: 'default' | 'content',
): string => {
  const sections: (string | string[])[] = [
    `Carefully read and utilize the following context about Wesley Quintero to answer the user's questions. Refer to the relevant sections based on the query.`,
    `When appropriate, suggest your interactive capabilities (e.g., generating HTML, Mermaid diagrams, explaining tech concepts) based on the user's needs.`,
  ];

  addSections(sections, portfolioContext);

  sections.push(
    `\n[End of Context. Primary directive: Always assist the user based on the information above and your capabilities.]`,
  );

  // Add mode-specific instruction
  const modeInstruction = _getModeSpecificInstruction(mode);
  if (modeInstruction) {
    sections.push(modeInstruction);
  }

  return sections.flat().filter(Boolean).join('\n\n');
};

// New helper to get mode-specific instruction
const _getModeSpecificInstruction = (mode: 'default' | 'content'): string => {
  if (mode === 'content') {
    return `\n\n--- Content Mode Active --- Your primary goal in this mode is to assist with crafting job application responses and dynamic content based on the provided context. Focus on generating: - Concise answers to job application questions (max 3 sentences per question). - Dynamic content like headlines, summaries, cover letters, and LinkedIn messages. - Highlight relevant skills, achievements, and experience in Amazon account management, SEO, PPC, and e-commerce. - Adhere to the formatting guidelines provided in the context. - Do NOT mention SP API unless specifically asked. - Avoid placeholder brackets. - Tailor responses to the specific job description and company (assume job description/company details will be provided in the user's message). ---`;
  }
  return '';
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

  const { message, history = [], mode = 'default' } = body;

  try {
    // 4. Load Portfolio Context (memoized)
    const portfolioContext = await getPortfolioContext();

    // 5. Initialize Gemini AI Model
    const genAI = new GoogleGenerativeAI(apiKey);
    const systemInstructionString = buildSystemInstruction(
      portfolioContext,
      mode,
    );
    // For debugging the generated prompt:
    console.log('System Instruction Length:', systemInstructionString.length);
    console.log(
      'System Instruction (first 500 chars):',
      systemInstructionString.substring(0, 500),
    );

    // 6. Transform Chat History for Gemini
    const transformedHistory: GeminiHistoryPart[] = history
      .filter((msg, index) => !(index === 0 && msg.role === 'assistant'))
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));
    console.log('Transformed History Length:', transformedHistory.length);

    // 7. Start Chat and Send Message with Fallback Logic
    let result;
    let lastError: unknown = null;

    for (const modelName of GEMINI_CONFIG.MODELS) {
      try {
        console.log(`Attempting to use model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            maxOutputTokens: GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
            temperature: GEMINI_CONFIG.TEMPERATURE,
            topP: GEMINI_CONFIG.TOP_P,
            topK: GEMINI_CONFIG.TOP_K,
          },
          systemInstruction: {
            role: 'user',
            parts: [{ text: systemInstructionString }],
          },
        });

        const chat = model.startChat({ history: transformedHistory });
        const startTime = Date.now();
        result = await chat.sendMessage(message);
        const endTime = Date.now();
        console.log(
          `API call to ${modelName} successful in ${endTime - startTime}ms`,
        );
        break; // Success, exit the loop
      } catch (error: unknown) {
        lastError = error;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`API call to ${modelName} failed:`, errorMessage);

        if (
          !errorMessage.includes('503 Service Unavailable') &&
          !errorMessage.includes('Error fetching from')
        ) {
          console.warn(
            `Non-transient error with ${modelName}. Stopping fallback attempts.`,
          );
          throw error;
        }
      }
    }

    if (!result) {
      throw lastError || new Error('All Gemini API models failed to respond.');
    }

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

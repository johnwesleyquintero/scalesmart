import { rateLimiter } from '@/lib/api/rate-limiter';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Define interfaces for the context data structures to avoid 'any'
interface AmazonCertification {
  name: string;
  // Add other properties if they exist and are used
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

export async function POST(request: NextRequest) {
  let body = null;
  try {
    const identifier = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    // Consider if you want a separate rate limit bucket for this endpoint
    const { success } = await rateLimiter.limit(`app-helper-${identifier}`);

    if (!success) {
      return new NextResponse('Too many requests', { status: 429 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error(
        'Application Helper API Error: Missing GEMINI_API_KEY environment variable',
      );
      return NextResponse.json(
        {
          error: 'Service configuration error. API key is missing.',
        },
        { status: 500 },
      );
    }

    body = await request.json();
    if (!body.application_question?.trim()) {
      return new NextResponse('Application question is required', {
        status: 400,
      });
    }
    const { application_question } = body;

    const portfolioContextData = await import('@/data/chat-context.json');
    const portfolioContext = portfolioContextData.default[0];

    // Construct the context data string (same as in chat route, but without history/user message)
    const contextDataString = `Personal Information:
- Name: ${portfolioContext.personalContext.personalInfo.name}
- Email (Primary): ${portfolioContext.personalContext.personalInfo.email}
- Location: ${portfolioContext.personalContext.personalInfo.location}
- Family: My brother is ${portfolioContext.personalContext.personalInfo.familyInfo.sibling}, my mother is ${portfolioContext.personalContext.personalInfo.familyInfo.mother}, and my father is ${portfolioContext.personalContext.personalInfo.familyInfo.father}. My girlfriend is ${portfolioContext.personalContext.personalInfo.familyInfo.girlfriend}.
- Phone: ${portfolioContext.personalContext.personalInfo.phone}
- Role: ${portfolioContext.personalContext.professionalProfile.title}
- Summary: ${portfolioContext.personalContext.professionalProfile.summary}
- Core Competencies: ${portfolioContext.personalContext.professionalProfile.coreCompetencies.join(', ')}

Technical Skills:
- Proficiencies: ${portfolioContext.personalContext.skills.technicalProficiencies?.join(', ') || 'Not specified'}
- Soft Skills: ${portfolioContext.personalContext.skills.soft.join(', ')}

Amazon Web Services (AWS) Expertise:
- My Amazon Specific Certifications (Conceptual): ${portfolioContext.personalContext.amazonExpertise.certifications?.map((c: AmazonCertification) => c.name).join(', ') || 'Not specified'}
- Areas: ${portfolioContext.personalContext.amazonExpertise.areasOfExpertise.join(', ')}
- Key Achievements: ${portfolioContext.personalContext.amazonExpertise.keyAchievements.join('; ')}

Work Experience:
${portfolioContext.personalContext.workExperience
  .map(
    (exp: WorkExperience) =>
      `- ${exp.title} at ${exp.company} (${exp.period}): ${exp.description}. Achievements: ${exp.achievements.join(', ')}.`,
  )
  .join('\n    ')}

Education:
${portfolioContext.personalContext.education
  .map(
    (edu: Education) =>
      `- ${edu.degree} from ${edu.institution} (${edu.period}). ${edu.description}`,
  )
  .join('\n    ')}

Certifications:
${(portfolioContext.personalContext.certifications || [])
  .map(
    (cert: GeneralCertification) =>
      `- ${cert.name} from ${cert.issuer} (Issued: ${cert.date}, Status: ${cert.status})`,
  )
  .join('\n    ')}

Web App Information:
- Project: ${portfolioContext.webappContext.projectOverview.name}
- Description: ${portfolioContext.webappContext.projectOverview.description}

Additional Resources:
- Blog: ${portfolioContext.personalContext.personalInfo.socialLinks.blog.url} (Summary: ${portfolioContext.personalContext.personalInfo.socialLinks.blog.summary})
- Amazon Tools Blog: ${portfolioContext.personalContext.personalInfo.socialLinks.amazonToolsBlog.url} (Summary: ${portfolioContext.personalContext.personalInfo.socialLinks.amazonToolsBlog.summary})
- AI Implementation Blog: ${portfolioContext.personalContext.personalInfo.socialLinks.aiBlog.url} (Summary: ${portfolioContext.personalContext.personalInfo.socialLinks.aiBlog.summary})
- E-commerce Tips Blog: ${portfolioContext.personalContext.personalInfo.socialLinks.ecommerceBlog.url} (Summary: ${portfolioContext.personalContext.personalInfo.socialLinks.ecommerceBlog.summary})

Development Setup:
- Hardware: ${portfolioContext.developmentSetup.hardware}
- Connectivity: ${portfolioContext.developmentSetup.connectivity}
- Audio/Video: ${portfolioContext.developmentSetup.audioVideo}
- Power Backup: ${portfolioContext.developmentSetup.powerBackup}
- Collaboration Tools: ${portfolioContext.developmentSetup.devToolsWorkflow.collaboration.join(', ')}
- Development Tools: ${portfolioContext.developmentSetup.devToolsWorkflow.development.join(', ')}

FAQs:
${portfolioContext.faqs.map((faq: FAQ) => `- Category: ${faq.category}, Question: ${faq.question}, Answer: ${faq.answer}`).join('\n')}`;

    const applicationPrompt = `You are Wesley Quintero. All the information provided below is about you.
Use this information to answer the following question directly and accurately, in the first person (using "I", "me", "my").
Your response should be suitable for direct use in an application form.
Do not add any conversational fluff, introductory, or concluding phrases.
Do not repeat the question in your answer.
Just provide the answer to the question.

Information about Wesley Quintero:
---
${contextDataString}
---

Question to answer:
${application_question}

Your Answer:`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-001', // Or your preferred model
      generationConfig: {
        maxOutputTokens: 500, // Adjust for typical application answer length
        temperature: 0.4, // Lower for more factual, less creative form-filling
        topP: 0.9,
        topK: 40,
      },
    });

    const result = await model.generateContent(applicationPrompt);
    const response = result.response;

    return NextResponse.json({
      answer: response.text(),
    });
  } catch (error) {
    console.error('Application Helper API Error:', error);
    return NextResponse.json(
      { error: 'Application helper service is temporarily unavailable.' },
      { status: 500 },
    );
  }
}

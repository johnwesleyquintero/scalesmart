import { NextResponse } from 'next/server';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';
import { resumeAnalysisSchema } from '@/lib/validation/schemas';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const jobDescription = formData.get('jobDescription') as string | undefined;

    const validationInput = {
      file,
      jobDescription,
    };

    const validationResult = resumeAnalysisSchema.safeParse(validationInput);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => err.message)
        .join(', ');
      return NextResponse.json(
        createErrorResponse(`Invalid input: ${errorMessages}`, 'INVALID_INPUT'),
        { status: 400 },
      );
    }

    const { file: validatedFile, jobDescription: validatedJobDescription } =
      validationResult.data;

    // Simulate resume analysis with a 2-second delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Implement resume analysis logic here
    // This is a placeholder, replace with actual implementation
    const analysisResults = {
      score: Math.floor(Math.random() * (90 - 60 + 1)) + 60, // Random score between 60 and 90
      strengths: [
        'Strong work experience',
        'Good skills section',
        'Clear communication skills',
      ],
      weaknesses: [
        'Missing keywords',
        'Poor formatting',
        'Lack of quantifiable results',
      ],
      suggestions: [
        'Add more keywords related to the job description',
        'Improve formatting to be more ATS-friendly',
        'Quantify your achievements with numbers and data',
      ],
      keywords: {
        present: ['JavaScript', 'React', 'Node.js', 'HTML', 'CSS'],
        missing: ['TypeScript', 'Next.js', 'Redux', 'GraphQL'],
      },
      sections: {
        present: ['Experience', 'Skills', 'Education', 'Summary'],
        missing: ['Projects', 'Awards', 'Certifications'],
      },
      validatedJobDescription: validatedJobDescription, // Echo back for confirmation
    };

    return NextResponse.json(analysisResults);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        createErrorResponse(
          `Validation error: ${error.errors.map((err) => err.message).join(', ')}`,
          'VALIDATION_ERROR',
        ),
        { status: 400 },
      );
    }
    console.error('Error analyzing resume:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

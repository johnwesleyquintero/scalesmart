import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';

export async function getLinkedInExperience() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    throw new Error('Not authenticated');
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate API call
    // Temporary mock data while LinkedIn API integration is being tested
    return [
      {
        title: 'Founder/Developer',
        company: 'Nebula-Singularity: SellSmart',
        period: 'Jan 2025 - Present',
        description: 'All-in-One Amazon Seller Platform',
        achievements: [
          'Developed AI-powered analytics and automation tools',
          'Created a modern web application for Amazon sellers',
        ],
      },
      {
        title: 'Amazon Specialist 2',
        company: 'My Amazon Guy',
        period: 'Oct 2024 - Mar 2025',
        description: 'Skills: Data Visualization, Amazon SEO',
        achievements: [
          'Enhanced data visualization for Amazon SEO',
          'Improved Amazon SEO strategies',
        ],
      },
      {
        title: 'Item Specialist',
        company: 'Bulk Buy America',
        period: 'Mar 2024 - Sep 2024',
        description: 'Remote US • Skills: VLOOKUP, Price Checker',
        achievements: [
          'Managed inventory using VLOOKUP',
          'Implemented efficient price checking mechanisms',
        ],
      },
      {
        title: 'Marketplace Support',
        company: 'Adorama',
        period: 'May 2023 - Sep 2023',
        description: 'Skills: B2B, Management',
        achievements: [
          'Supported B2B marketplace operations',
          'Managed marketplace support team',
        ],
      },
    ];
  } catch (error) {
    console.error('Failed to fetch LinkedIn experience:', error);
    throw error;
  }
}

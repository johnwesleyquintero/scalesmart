import { Contact, SalesStage } from '../types';

/**
 * Calculates a lead score for a given contact based on predefined criteria.
 * The score is an integer, with higher values indicating a hotter lead.
 *
 * @param contact The contact object to score.
 * @returns The calculated lead score.
 */
export function calculateLeadScore(contact: Contact): number {
  let score = 0;

  // 1. Score based on lastActivity (more recent activity = higher score)
  // Max score for activity: 50 points
  if (contact.lastActivity) {
    const now = Date.now();
    const activityAgeInDays =
      (now - contact.lastActivity) / (1000 * 60 * 60 * 24);

    if (activityAgeInDays <= 7) {
      score += 50; // Activity within the last week
    } else if (activityAgeInDays <= 30) {
      score += 30; // Activity within the last month
    } else if (activityAgeInDays <= 90) {
      score += 10; // Activity within the last 3 months
    }
  }

  // 2. Score based on salesStage
  // Max score for sales stage: 30 points
  switch (contact.salesStage) {
    case 'Negotiation':
      score += 30;
      break;
    case 'Proposal':
      score += 25;
      break;
    case 'Qualified':
      score += 20;
      break;
    case 'Prospect':
      score += 10;
      break;
    case 'Lead':
      score += 5;
      break;
    case 'Closed Won':
      score += 0; // Already won, scoring might not be relevant for new leads
      break;
    case 'Closed Lost':
      score += 0; // Lost, no score
      break;
    default:
      break;
  }

  // 3. Score based on notes (presence of certain keywords)
  // Max score for notes: 20 points
  if (contact.notes) {
    const lowerCaseNotes = contact.notes.toLowerCase();
    const keywords = [
      'interested',
      'budget',
      'urgent',
      'opportunity',
      'follow-up',
    ];
    let keywordScore = 0;
    keywords.forEach((keyword) => {
      if (lowerCaseNotes.includes(keyword)) {
        keywordScore += 5; // Add points for each relevant keyword found
      }
    });
    score += Math.min(keywordScore, 20); // Cap keyword score at 20
  }

  // 4. Score based on simulated email engagement (AI-driven)
  // Max score for email engagement: 30 points
  const emailEngagementScore = Math.floor(Math.random() * 30); // Simulate email engagement
  score += emailEngagementScore;

  // 5. Score based on simulated website activity (AI-driven)
  // Max score for website activity: 20 points
  const websiteActivityScore = Math.floor(Math.random() * 20); // Simulate website activity
  score += websiteActivityScore;

  // 6. Score based on simulated form submissions (AI-driven)
  // Max score for form submissions: 20 points
  const formSubmissionScore = Math.floor(Math.random() * 20); // Simulate form submissions
  score += formSubmissionScore;

  return score;
}

/**
 * Categorizes a lead score into 'Hot', 'Warm', or 'Cold'.
 *
 * @param score The calculated lead score.
 * @returns The lead score category.
 */
export function getLeadScoreCategory(score: number): 'Hot' | 'Warm' | 'Cold' {
  if (score >= 70) {
    return 'Hot';
  } else if (score >= 30) {
    return 'Warm';
  } else {
    return 'Cold';
  }
}

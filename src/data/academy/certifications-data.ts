import { Certification } from '@/types/academy';
import { certificationsData } from './certifications';

/**
 * Get a certification by its slug
 */
export async function getCertificationBySlug(slug: string): Promise<Certification | null> {
  return certificationsData.find((cert) => cert.slug === slug) || null;
}

/**
 * Get all certifications
 */
export async function getAllCertifications(): Promise<Certification[]> {
  return certificationsData;
}

/**
 * Get certifications by track
 */
export async function getCertificationsByTrack(track: 'amazon-aligned' | 'operator-credential'): Promise<Certification[]> {
  return certificationsData.filter((cert) => cert.track === track);
}

/**
 * Get featured certifications
 */
export async function getFeaturedCertifications(): Promise<Certification[]> {
  return certificationsData.filter((cert) => cert.featured);
}

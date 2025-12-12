import AboutSection from './about-section';

export default async function AboutSectionServer() {
  const educationData = (await import('@/data/portfolio-data/education.json'))
    .default;
  const experienceData = (await import('@/data/portfolio-data/experience.json'))
    .default;
  const skillsData = (await import('@/data/portfolio-data/skills.json'))
    .default;

  return (
    <AboutSection
      skills={skillsData.skills}
      experience={experienceData.experience}
      education={educationData.education}
    />
  );
}

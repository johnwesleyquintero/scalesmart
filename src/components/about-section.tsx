'use client';

import educationData from '@/data/portfolio-data/education.json';
import experienceData from '@/data/portfolio-data/experience.json';
import skillsData from '@/data/portfolio-data/skills.json';
import type { Experience, Skill } from '@/lib/types';

// Define the constant for the repeated string
const SKILLS_B2B_MANAGEMENT = 'Skills: B2B, Management';

export default function AboutSection() {
  return (
    <section>
      <div>
        {/* Skills */}
        {skillsData.skills &&
          skillsData.skills.map((skill: Skill) => (
            <div key={skill.name}>
              {skill.name} - {skill.level}
            </div>
          ))}

        {/* Experience */}
        {experienceData.experience &&
          experienceData.experience.map((exp: Experience) => (
            <div key={exp.title}>
              {exp.title} - {exp.company} -{' '}
              {exp.description === SKILLS_B2B_MANAGEMENT
                ? 'Skills: B2B, Management'
                : exp.description}
            </div>
          ))}

        {/* Education */}
        {educationData.education &&
          educationData.education.map((edu) => (
            <div key={edu.degree}>
              {edu.degree} - {edu.institution}
            </div>
          ))}
      </div>
    </section>
  );
}

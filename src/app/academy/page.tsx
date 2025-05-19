import SchoolComponent from './SchoolComponent';

export default async function AcademyPage() {
  const baseUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://wesleyquintero.vercel.app';
  try {
    const res = await fetch(`${baseUrl}/api/academy-courses`);
    const academyData = await res.json();
    return <SchoolComponent academyData={academyData} />;
  } catch (error) {
    console.error('Failed to fetch academy data:', error);
    return <div>Error loading academy data.</div>;
  }
}

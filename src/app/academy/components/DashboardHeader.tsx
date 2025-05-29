interface DashboardHeaderProps {
  title: string;
  description: string;
}

const DashboardHeader = ({ title, description }: DashboardHeaderProps) => {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default DashboardHeader;

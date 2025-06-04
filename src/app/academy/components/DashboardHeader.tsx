interface DashboardHeaderProps {
  // title: string; // We'll set the title directly in the component
  description: string;
}

const DashboardHeader = ({ description }: DashboardHeaderProps) => {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        ScaleSmart Academy
      </h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default DashboardHeader;

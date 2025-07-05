import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Task, Project } from '@/lib/indexeddb-service';
import {
  format,
  parseISO,
  differenceInDays,
  min,
  max,
  addDays,
} from 'date-fns';

interface GanttChartSectionProps {
  tasks: Task[];
  projects: Project[];
}

const GanttChartSection: React.FC<GanttChartSectionProps> = ({
  tasks,
  projects,
}) => {
  const { chartData, minDate, maxDate } = useMemo(() => {
    if (tasks.length === 0) {
      return { chartData: [], minDate: new Date(), maxDate: new Date() };
    }

    const processed = tasks.map((task) => {
      const startDate = new Date(task.createdAt);
      const endDate = task.dueDate
        ? new Date(task.dueDate)
        : addDays(startDate, 7); // Default 7 days if no due date
      const project = projects.find((p) => p.id === task.projectId);

      return {
        id: task.id,
        name: task.title,
        project: project ? project.name : 'No Project',
        startDate: startDate,
        endDate: endDate,
        status: task.status,
      };
    });

    const allDates = processed.flatMap((task) => [
      task.startDate,
      task.endDate,
    ]);
    const calculatedMinDate = min(allDates);
    const calculatedMaxDate = max(allDates);

    const finalChartData = processed.map((task) => {
      const startOffset = differenceInDays(task.startDate, calculatedMinDate);
      const duration = differenceInDays(task.endDate, task.startDate);

      return {
        ...task,
        startOffset: startOffset,
        duration: duration > 0 ? duration : 1, // Ensure duration is at least 1
        formattedStartDate: format(task.startDate, 'yyyy-MM-dd'),
        formattedEndDate: format(task.endDate, 'yyyy-MM-dd'),
      };
    });

    return {
      chartData: finalChartData,
      minDate: calculatedMinDate,
      maxDate: calculatedMaxDate,
    };
  }, [tasks, projects]);

  // Custom Tooltip to display task details
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: {
        name: string;
        project: string;
        status: string;
        formattedStartDate: string;
        formattedEndDate: string;
        duration: number;
      };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip bg-popover p-3 border border-border rounded-md shadow-lg">
          <p className="label text-foreground font-bold">{`${data.name}`}</p>
          <p className="intro text-muted-foreground">{`Project: ${data.project}`}</p>
          <p className="intro text-muted-foreground">{`Status: ${data.status}`}</p>
          <p className="intro text-muted-foreground">{`Start: ${data.formattedStartDate}`}</p>
          <p className="intro text-muted-foreground">{`End: ${data.formattedEndDate}`}</p>
          <p className="intro text-muted-foreground">{`Duration: ${data.duration} days`}</p>
        </div>
      );
    }
    return null;
  };

  // Formatter for X-Axis ticks to display dates
  const xAxisTickFormatter = (tick: number) => {
    return format(addDays(minDate, tick), 'MMM dd');
  };

  return (
    <div className="w-full h-[500px] bg-card p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-foreground">
        Project Timeline (Gantt Chart)
      </h2>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{
            top: 20,
            right: 30,
            left: 100, // Adjust left margin for longer task names
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            type="number"
            dataKey="startOffset" // This will be the base for the stacked bar
            domain={[0, differenceInDays(maxDate, minDate) + 1]} // Domain from 0 to total days
            tickFormatter={xAxisTickFormatter}
            stroke="#888888"
          />
          <YAxis type="category" dataKey="name" stroke="#888888" width={100} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {/* Invisible bar for the offset */}
          <Bar dataKey="startOffset" fillOpacity={0} stackId="a" />
          {/* Visible bar for the duration */}
          <Bar
            dataKey="duration"
            fill="#8884d8"
            name="Task Duration"
            stackId="a"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GanttChartSection;

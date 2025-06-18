import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import dynamic from 'next/dynamic';
const HeatmapGrid = dynamic(
  () =>
    import('react-heatmap-grid').then(
      (mod) => mod.HeatmapGrid as React.ComponentType<HeatmapChartProps>,
    ),
  {
    ssr: false,
    loading: () => <p>Loading Heatmap...</p>,
  },
);
import { ChartWidgetConfig } from '../widget-types';
import GeospatialMapChart from './GeospatialMapChart';
import { applyConditionalFormatting } from '../../../lib/conditional-formatting';

// Basic Network Graph component (placeholder, replace with a library like react-force-graph or vis-network if needed)
interface NetworkGraphData {
  nodes: { id: string; name: string }[];
  links: { source: number; target: number }[];
}

interface NetworkGraphChartProps {
  data: NetworkGraphData;
}

const NetworkGraphChart: React.FC<NetworkGraphChartProps> = ({ data }) => {
  // Simple SVG rendering for demonstration
  const width = 600; // Example width
  const height = 400; // Example height

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Render links */}
      {data.links.map((link, index) => {
        const sourceNode = data.nodes[link.source];
        const targetNode = data.nodes[link.target];
        if (!sourceNode || !targetNode) return null; // Handle potential errors

        // Simple line between nodes - positions are placeholders
        const x1 = (link.source * 50) % width;
        const y1 = (link.source * 50) % height;
        const x2 = (link.target * 50) % width;
        const y2 = (link.target * 50) % height;

        return (
          <line
            key={index}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#999"
            strokeOpacity="0.6"
          />
        );
      })}
      {/* Render nodes */}
      {data.nodes.map((node, index) => {
        // Simple circle for node - positions are placeholders
        const cx = (index * 50) % width;
        const cy = (index * 50) % height;
        return (
          <circle
            key={node.id}
            cx={cx}
            cy={cy}
            r={5}
            fill="#666"
            stroke="#fff"
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
};

// Heatmap Chart component using react-heatmap-grid
interface HeatmapChartProps {
  xLabels: string[];
  yLabels: string[];
  data: number[][];
  cellRender?: (
    x: number,
    y: number,
    value: number | null | undefined,
  ) => React.ReactNode;
  xLabelWidth?: number;
  yLabelWidth?: number;
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({
  xLabels,
  yLabels,
  data,
}) => {
  // Note: react-heatmap-grid might require specific styling or container setup
  // to fit within the ResponsiveContainer or a fixed size div.
  // Adjust width and height as needed, or wrap in a container that manages size.
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      {' '}
      {/* Added a container for potential scrolling */}
      <HeatmapGrid
        xLabels={xLabels}
        yLabels={yLabels}
        data={data}
        // Add styling or cell rendering options here if needed
        cellRender={(
          x: number,
          y: number,
          value: number | null | undefined,
        ) => (
          <div title={`[${xLabels[x]}, ${yLabels[y]}]: ${value}`}>
            {value !== null && value !== undefined ? value.toFixed(2) : ''}{' '}
            {/* Display value, format if number */}
          </div>
        )}
        xLabelWidth={60} // Adjust label width as needed
        yLabelWidth={60} // Adjust label width as needed
      />
    </div>
  );
};

interface FunnelChartData {
  name: string;
  value: number;
}

interface FunnelChartProps {
  data: FunnelChartData[];
}

const FunnelChart: React.FC<FunnelChartProps> = ({ data }) => {
  const width = 600; // Example width
  const height = 400; // Example height
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const segmentHeight = height / data.length;

  let currentY = 0;
  let currentWidth = width;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((item, index) => {
        const nextWidth =
          index < data.length - 1
            ? (data[index + 1].value / item.value) * currentWidth
            : 0;
        const points = [
          `${(width - currentWidth) / 2},${currentY}`,
          `${(width + currentWidth) / 2},${currentY}`,
          `${(width + nextWidth) / 2},${currentY + segmentHeight}`,
          `${(width - nextWidth) / 2},${currentY + segmentHeight}`,
        ].join(' ');

        const fill = `hsl(${index * 60}, 70%, 50%)`; // Example color based on index

        const segment = (
          <g key={item.name}>
            <polygon points={points} fill={fill} />
            <text
              x={width / 2}
              y={currentY + segmentHeight / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="14"
            >
              {item.name} ({item.value})
            </text>
          </g>
        );

        currentY += segmentHeight;
        currentWidth = nextWidth;

        return segment;
      })}
    </svg>
  );
};

interface ChartWidgetProps {
  config: ChartWidgetConfig;
}

type DotPayload = { name: string; style?: React.CSSProperties };

export const ChartWidget: React.FC<ChartWidgetProps> = ({ config }) => {
  const { title, data, chartType, conditionalFormattingRules } = config;

  const renderChart = () => {
    if (
      !data ||
      !data.labels ||
      data.labels.length === 0 ||
      !data.datasets ||
      data.datasets.length === 0
    ) {
      return <div className="text-gray-500">No data available</div>;
    }

    // Implement performance optimization strategies for rendering large datasets within the chart (e.g., data aggregation, library-specific virtualization).

    const dataThreshold = 500; // Define a threshold for large datasets

    let processedData = data;

    // Apply data aggregation for large datasets in bar and line charts
    if (
      (chartType === 'bar' || chartType === 'line') &&
      data.labels.length > dataThreshold
    ) {
      const aggregationFactor = Math.ceil(data.labels.length / dataThreshold);
      const aggregatedLabels: string[] = [];
      const aggregatedDatasets: { label: string; data: number[] }[] =
        data.datasets.map((dataset) => ({
          label: dataset.label,
          data: [],
        }));

      for (let i = 0; i < data.labels.length; i += aggregationFactor) {
        const chunkLabels = data.labels.slice(i, i + aggregationFactor);
        const chunkData = data.datasets.map((dataset) =>
          dataset.data.slice(i, i + aggregationFactor),
        );

        // Use the label of the first data point in the chunk
        aggregatedLabels.push(chunkLabels[0]);

        chunkData.forEach((datasetChunk, datasetIndex) => {
          // Calculate the average for numerical data
          const sum = datasetChunk.reduce(
            (acc, val) => acc + (typeof val === 'number' ? val : 0),
            0,
          );
          const average =
            datasetChunk.length > 0 ? sum / datasetChunk.length : 0;
          aggregatedDatasets[datasetIndex].data.push(average);
        });
      }

      processedData = {
        labels: aggregatedLabels,
        datasets: aggregatedDatasets,
      };
    }

    // Transform data to Recharts format and apply conditional formatting
    const transformedData = processedData.labels.map((label, index) => {
      const dataPoint: Record<string, string | number> = { name: label };
      processedData.datasets.forEach((dataset) => {
        dataPoint[dataset.label] = dataset.data[index];
      });

      // Apply conditional formatting using the utility function
      const itemStyle = applyConditionalFormatting(
        dataPoint,
        conditionalFormattingRules,
      );

      return { ...dataPoint, style: itemStyle };
    });

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {data.datasets.map((dataset, datasetIndex) => (
                <Bar
                  key={`bar-${datasetIndex}`}
                  dataKey={dataset.label}
                  fill={dataset.backgroundColor || '#8884d8'}
                >
                  {transformedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.style?.fill ||
                        dataset.backgroundColor ||
                        '#8884d8'
                      }
                    />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {data.datasets.map((dataset, datasetIndex) => (
                <Line
                  key={`line-${datasetIndex}`}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={dataset.borderColor || '#8884d8'}
                  dot={(props: {
                    cx?: number;
                    cy?: number;
                    stroke?: string;
                    key?: string;
                    payload: DotPayload;
                  }) => {
                    const { cx, cy, stroke, key, payload } = props;
                    const dataIndex = transformedData.findIndex(
                      (d) =>
                        (d as unknown as { name: string }).name ===
                        payload.name,
                    );
                    const itemStyle = transformedData[dataIndex]?.style;
                    return (
                      <circle
                        key={key}
                        cx={cx}
                        cy={cy}
                        r={4}
                        stroke={stroke}
                        fill={itemStyle?.fill || stroke} // Apply fill from conditional style, fallback to stroke
                        strokeWidth={1}
                      />
                    );
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie': {
        // Wrap in curly braces
        // For pie charts, conditional formatting typically applies to segments.
        // The data structure for pie charts in Recharts is an array of objects with value and name.
        // We need to adapt the transformation and conditional formatting for this.
        const pieData = data.labels.map((label, index) => {
          const value = data.datasets[0]?.data[index] || 0; // Assuming single dataset for pie
          // Create a data point object suitable for applyConditionalFormatting
          const dataPoint: Record<string, unknown> = {
            name: label,
            value: value,
          };
          const itemStyle = applyConditionalFormatting(
            dataPoint,
            conditionalFormattingRules,
          );
          return { name: label, value: value, style: itemStyle };
        });

        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={50}
                fill="#8884d8"
                label
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.style?.fill ||
                      data.datasets[0]?.backgroundColor?.[index] ||
                      '#8884d8'
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      }
      case 'geospatial-map': {
        return <GeospatialMapChart data={data} />;
      }
      case 'network-graph': {
        // Data transformation for Network Graph
        const nodes: NetworkGraphData['nodes'] = processedData.labels.map(
          (label, index) => ({
            id: `node-${index}`,
            name: label,
          }),
        );

        // Basic link creation: create links between consecutive nodes for demonstration
        const links: NetworkGraphData['links'] = [];
        for (let i = 0; i < nodes.length - 1; i++) {
          links.push({ source: i, target: i + 1 });
        }

        const networkGraphData: NetworkGraphData = { nodes, links };

        return <NetworkGraphChart data={networkGraphData} />;
      }
      case 'heatmap': {
        // Data transformation for Heatmap Chart
        // Assuming labels are x-axis, datasets are y-axis, and dataset data are values
        const xLabels = processedData.labels;
        const yLabels = processedData.datasets.map((dataset) => dataset.label);

        // Create a 2D array for heatmap data [y][x]
        const heatmapData: number[][] = yLabels.map((_, yIndex) =>
          xLabels.map((_, xIndex) => {
            const value = processedData.datasets[yIndex]?.data[xIndex];
            // Ensure value is a number, default to 0 or null if not
            return typeof value === 'number' ? value : 0; // Or null, depending on desired heatmap behavior for non-numbers
          }),
        );

        return (
          <ResponsiveContainer width="100%" height="100%">
            {/* ResponsiveContainer might not work directly with react-heatmap-grid,
                 the HeatmapChart component itself needs to handle sizing or be
                 placed in a container with defined dimensions.
                 Using a div with 100% size inside ResponsiveContainer for now. */}
            <div style={{ width: '100%', height: '100%' }}>
              <HeatmapChart
                xLabels={xLabels}
                yLabels={yLabels}
                data={heatmapData}
              />
            </div>
          </ResponsiveContainer>
        );
      }
      case 'funnel-chart': {
        // Data transformation for Funnel Chart
        // Assuming the first dataset contains the values for the funnel steps
        const funnelData: FunnelChartData[] = processedData.labels.map(
          (label, index) => ({
            name: label,
            value: processedData.datasets[0]?.data[index] || 0, // Use value from the first dataset
          }),
        );

        // Sort data in descending order for a typical funnel shape
        funnelData.sort((a, b) => b.value - a.value);

        return (
          <ResponsiveContainer width="100%" height="100%">
            {/* ResponsiveContainer might not work directly with custom SVG charts,
                the FunnelChart component itself needs to handle sizing or be
                placed in a container with defined dimensions.
                Using a div with 100% size inside ResponsiveContainer for now. */}
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <FunnelChart data={funnelData} />
            </div>
          </ResponsiveContainer>
        );
      }
      default:
        return (
          <div className="text-gray-500">
            Unsupported chart type: {chartType}
          </div>
        );
    }
  };

  return (
    <div className="border p-4 rounded-lg shadow-md h-full flex flex-col">
      {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
      <div className="flex-grow flex items-center justify-center">
        {renderChart()}
      </div>
      {/* Displaying raw data for now */}
      {/* <div className="mt-2 text-sm text-gray-600">
        Data: {JSON.stringify(data)}
      </div> */}
    </div>
  );
};

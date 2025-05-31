'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

let mermaidDiagramIdCounter = 0; // Ensures unique IDs for mermaid.render

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Unique ID for this instance, helps mermaid keep track if multiple diagrams
  const chartId = useRef(`mermaid-svg-${mermaidDiagramIdCounter++}`).current;

  useEffect(() => {
    const renderChart = async () => {
      if (!chart || chart.trim() === '') {
        setSvg(null);
        setError(null);
        return;
      }

      try {
        const currentTheme = document.documentElement.classList.contains('dark')
          ? 'dark'
          : 'default';
        mermaid.initialize({
          startOnLoad: false,
          theme: currentTheme,
          // securityLevel: 'loose', // Consider if complex diagrams with external links/scripts need this
        });

        const { svg: renderedSvg } = await mermaid.render(chartId, chart);
        setSvg(renderedSvg);
        setError(null);
      } catch (e) {
        console.error('Mermaid rendering error:', e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        setError(errorMessage);
        setSvg(null);
      }
    };

    renderChart();
  }, [chart, chartId]);

  if (error) {
    return (
      <div className="mermaid-error-container my-4 p-3 border border-red-500 rounded-md bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700">
        <p className="font-semibold">Mermaid Diagram Error:</p>
        <pre className="mt-1 text-sm whitespace-pre-wrap">{error}</pre>
        <p className="mt-2 font-semibold">Original Code:</p>
        <pre className="mt-1 text-sm whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  if (svg) {
    return (
      <div
        className="mermaid-diagram-container my-4 overflow-x-auto flex justify-center"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  return (
    <div className="my-4 p-3 text-muted-foreground text-center">
      Loading diagram...
    </div>
  );
};

export default MermaidDiagram;

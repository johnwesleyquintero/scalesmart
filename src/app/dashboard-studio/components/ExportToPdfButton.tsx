'use client';

import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';

interface ExportToPdfButtonProps {
  dashboardRef: React.RefObject<HTMLDivElement | null>;
  dashboardTitle: string;
}

const ExportToPdfButton: React.FC<ExportToPdfButtonProps> = ({
  dashboardRef,
  dashboardTitle,
}) => {
  const handleExport = () => {
    if (dashboardRef.current) {
      html2canvas(dashboardRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(
          `${dashboardTitle.replace(/\s+/g, '_').toLowerCase()}_export.pdf`,
        );
      });
    }
  };

  return <Button onClick={handleExport}>Export to PDF</Button>;
};

export default ExportToPdfButton;

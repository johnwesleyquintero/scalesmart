import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import React, { useRef } from 'react';

interface CertificateDisplayProps {
  userName: string;
  courseName: string;
}

const CertificateDisplay: React.FC<CertificateDisplayProps> = ({
  userName,
  courseName,
}) => {
  const certificateContainerRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    const element = certificateContainerRef.current;
    if (!element) {
      console.error('Certificate container not found');
      return;
    }

    // Ensure custom fonts are loaded before capturing, if any are used by 'calligraphy-font' etc.
    // This can help if fonts are not rendering correctly in the PDF.
    await document.fonts.ready;

    const canvas = await html2canvas(element, {
      scale: 2, // Increase resolution
      useCORS: true, // Enable CORS if any images were from external sources (good practice)
      backgroundColor: '#ffffff', // Explicitly set a white background for the canvas
      logging: process.env.NODE_ENV === 'development', // See html2canvas logs in dev mode
      scrollX: -window.scrollX, // Account for page scroll
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.scrollWidth, // Capture full element width
      windowHeight: document.documentElement.scrollHeight, // Capture full element height
    });
    const imgData = canvas.toDataURL('image/png', 1.0); // Use highest quality PNG

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;

    let finalImgWidth = pdfWidth - 20; // Add some margin (10mm on each side)
    let finalImgHeight = finalImgWidth / canvasAspectRatio;

    if (finalImgHeight > pdfHeight - 20) {
      // Check if it exceeds height with margin
      finalImgHeight = pdfHeight - 20; // Adjust height to fit with margin
      finalImgWidth = finalImgHeight * canvasAspectRatio;
    }

    const xOffset = (pdfWidth - finalImgWidth) / 2;
    const yOffset = (pdfHeight - finalImgHeight) / 2;

    pdf.addImage(
      imgData,
      'PNG',
      xOffset,
      yOffset,
      finalImgWidth,
      finalImgHeight,
    );
    pdf.save('certificate.pdf');
  };

  return (
    <div className="mt-8">
      {/* Using a creamier background and a deep red border for a classic look */}
      <div
        ref={certificateContainerRef}
        className="certificate-container bg-amber-50 p-10 border-4 border-red-800 rounded-lg shadow-2xl max-w-2xl mx-auto font-serif relative"
      >
        {/* Optional: Decorative corner elements or background pattern can be added here */}
        {/* Example: Gold corner accents */}
        {/* <div className="absolute top-2 left-2 w-12 h-12 border-t-2 border-l-2 border-yellow-600"></div> */}
        {/* <div className="absolute top-2 right-2 w-12 h-12 border-t-2 border-r-2 border-yellow-600"></div> */}
        {/* <div className="absolute bottom-2 left-2 w-12 h-12 border-b-2 border-l-2 border-yellow-600"></div> */}
        {/* <div className="absolute bottom-2 right-2 w-12 h-12 border-b-2 border-r-2 border-yellow-600"></div> */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            ScaleSmart Academy
          </h2>
          {/* Title in a deep red or dark gray */}
          <h1 className="text-4xl font-bold text-red-900 tracking-wider mb-2">
            CERTIFICATE OF COMPLETION
          </h1>
          <hr className="border-t-2 border-yellow-600 w-1/3 mx-auto my-4" />{' '}
          {/* Gold accent line */}
        </div>

        <p className="text-lg text-center text-gray-600 mb-4">
          This certificate is proudly presented to
        </p>

        {/* Recipient's name - ensure 'calligraphy-font' uses a formal script. Color can be dark gray or black. */}
        <h2 className="text-5xl font-bold text-center text-gray-800 mb-6 calligraphy-font">
          {userName || 'Recipient Name'}
        </h2>

        <p className="text-lg text-center text-gray-600 mb-4">
          For successfully demonstrating proficiency and completing all
          requirements of the course
        </p>

        {/* Course name in a clear, dark color */}
        <h3 className="text-3xl font-semibold text-center text-gray-700 mb-8">
          {courseName || 'Course Title'}
        </h3>

        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-300">
          <div className="text-left">
            <p className="text-sm text-gray-500">Date Issued</p>
            <p className="text-md text-gray-700 font-semibold">
              {new Date().toLocaleDateString()}
            </p>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Authorized By</p>
              <p className="text-md text-gray-700 font-semibold">
                John Wesley Quintero
              </p>{' '}
              {/* Replace with your actual name */}
              <p className="text-xs text-gray-600">
                Licensed Professional Teacher (LPT), Academy Owner
              </p>{' '}
              {/* Your title */}
            </div>
          </div>
          <div className="text-right">
            {/* Seal placeholder with a gold or red accent */}
            <div className="w-20 h-20 bg-yellow-500 border-2 border-yellow-700 rounded-full mx-auto flex items-center justify-center text-xs text-white italic shadow-md">
              Official Seal
            </div>
            {/* You could add a placeholder for a signature line above your name if desired */}
            {/* <div className="w-3/4 h-px bg-gray-400 mx-auto mt-8 mb-1"></div> */}
          </div>
        </div>
      </div>
      <div className="text-center mt-8">
        <button
          onClick={handleDownload}
          className="bg-red-800 hover:bg-red-900 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105"
          aria-label="Download Certificate as PDF"
        >
          Download Certificate
        </button>
      </div>
    </div>
  );
};

export default CertificateDisplay;

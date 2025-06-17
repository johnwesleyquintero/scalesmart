import React, { useState } from 'react';

export const ReportEditor = () => {
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');

  const handleSaveReport = () => {
    console.log('Saving Report:', { reportTitle, reportContent });
    alert('Report Saved (check console)');
  };

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Report Editor</h2>
      <div className="mb-4">
        <label
          htmlFor="reportTitle"
          className="block text-sm font-medium text-gray-700"
        >
          Report Title
        </label>
        <input
          type="text"
          id="reportTitle"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={reportTitle}
          onChange={(e) => setReportTitle(e.target.value)}
          placeholder="Enter report title"
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="reportContent"
          className="block text-sm font-medium text-gray-700"
        >
          Report Content
        </label>
        <textarea
          id="reportContent"
          rows={10}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={reportContent}
          onChange={(e) => setReportContent(e.target.value)}
          placeholder="Write your report content here..."
        ></textarea>
      </div>
      <button
        onClick={handleSaveReport}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Save Report
      </button>
    </div>
  );
};

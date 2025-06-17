import React, { useState } from 'react';

export const ReportEditor = () => {
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [selectedWidgetType, setSelectedWidgetType] = useState('Chart'); // Default selected widget type

  const handleSaveReport = () => {
    console.log('Saving Report:', { reportTitle, reportContent });
    alert('Report Saved (check console)');
  };

  const widgetTypes = ['Chart', 'Table', 'KPI', 'Text', 'Image', 'Filter'];

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
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">Draggable Widgets</h3>
        <div className="mb-2">
          <label
            htmlFor="widgetType"
            className="block text-sm font-medium text-gray-700"
          >
            Select Widget Type:
          </label>
          <select
            id="widgetType"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={selectedWidgetType}
            onChange={(e) => setSelectedWidgetType(e.target.value)}
          >
            {widgetTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div
          draggable="true"
          onDragStart={(e) => {
            e.dataTransfer.setData('widgetType', selectedWidgetType);
            console.log(`Drag started for ${selectedWidgetType} widget`);
          }}
          className="p-4 border border-dashed border-gray-400 rounded-md cursor-move bg-gray-100 text-center"
        >
          Drag me ({selectedWidgetType} Widget)
        </div>
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

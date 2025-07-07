'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { DashboardService } from '@/lib/dashboard-service'; // Assuming dashboard-service is in lib
import { Dashboard } from '@/types/indexeddb'; // Import Dashboard type from indexeddb
import { Button } from '@/components/ui/button';

const DashboardTemplatesPage = () => {
  const router = useRouter(); // Get router instance
  const [templates, setTemplates] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const fetchedTemplates = await DashboardService.getDashboardTemplates();
        setTemplates(fetchedTemplates);
      } catch (err) {
        setError('Failed to fetch templates.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleLoadTemplate = async (templateId: string) => {
    console.log(`Attempting to load template: ${templateId}`);
    const template = await DashboardService.loadDashboardTemplate(templateId);
    if (template) {
      console.log('Loaded template:', template);
      // Redirect to builder with template data as query parameters
      // Stringify complex objects like widgets and layout
      const queryParams = new URLSearchParams({
        widgets: JSON.stringify(template.widgets),
        layout: JSON.stringify(template.layout),
      }).toString();
      router.push(`/dashboard-studio?${queryParams}`);
    } else {
      console.error('Template not found.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard Templates</h1>

      {loading && <p>Loading templates...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && templates.length === 0 && (
        <p>No templates available.</p>
      )}

      {!loading && !error && templates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="border p-4 rounded shadow">
              <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
              {/* Placeholder for template preview */}
              <div className="mb-4 text-gray-600">
                Template preview goes here
              </div>
              <Button onClick={() => handleLoadTemplate(template.id)}>
                Load Template
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Placeholder for template saving, sharing, and collaboration UI */}
      <div className="mt-6 border-t pt-4">
        <h2 className="text-2xl font-bold mb-4">Template Actions</h2>
        <div className="flex space-x-4">
          <Button>Save Template</Button>
          <Button>Share Template</Button>
          <Button>Collaborate</Button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Note: Actual saving, sharing, and collaboration logic needs to be
          implemented.
        </p>
      </div>
    </div>
  );
};

export default DashboardTemplatesPage;

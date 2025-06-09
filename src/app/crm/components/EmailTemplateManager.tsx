import React, { useState, useEffect } from 'react';
import { EmailTemplate } from '../../crm/types';
import {
  createEmailTemplate,
  getEmailTemplates,
  updateEmailTemplate,
  deleteEmailTemplate,
} from '../utils/emailTemplateUtils';
import MDEditor from '@uiw/react-md-editor';

interface EmailTemplateManagerProps {
  onSelectTemplate?: (template: EmailTemplate) => void;
}

const EmailTemplateManager: React.FC<EmailTemplateManagerProps> = ({
  onSelectTemplate,
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [newTemplateSubject, setNewTemplateSubject] = useState<string>('');
  const [newTemplateBody, setNewTemplateBody] = useState<string>('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const loadedTemplates = await getEmailTemplates();
    setTemplates(loadedTemplates);
  };

  const handleCreate = async () => {
    if (newTemplateName && newTemplateSubject && newTemplateBody) {
      const newTemplate: EmailTemplate = {
        id: crypto.randomUUID(), // Generate a unique ID
        name: newTemplateName,
        subject: newTemplateSubject,
        body: newTemplateBody,
      };
      await createEmailTemplate(newTemplate);
      await loadTemplates();
      setNewTemplateName('');
      setNewTemplateSubject('');
      setNewTemplateBody('');
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setNewTemplateName(template.name);
    setNewTemplateSubject(template.subject);
    setNewTemplateBody(template.body);
  };

  const handleUpdate = async () => {
    if (editingTemplate) {
      const updatedTemplate: EmailTemplate = {
        ...editingTemplate,
        name: newTemplateName,
        subject: newTemplateSubject,
        body: newTemplateBody,
      };
      await updateEmailTemplate(updatedTemplate);
      await loadTemplates();
      setEditingTemplate(null);
      setNewTemplateName('');
      setNewTemplateSubject('');
      setNewTemplateBody('');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteEmailTemplate(id);
    await loadTemplates();
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setNewTemplateName('');
    setNewTemplateSubject('');
    setNewTemplateBody('');
  };

  return (
    <div className="p-4">
      {/*
        Note: For Quill, you would typically install it via npm/yarn:
        npm install react-quill quill
        or
        yarn add react-quill quill
      */}
      <h2 className="text-2xl font-bold mb-4">Email Template Manager</h2>

      <div className="mb-6 p-4 border rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-3">
          {editingTemplate ? 'Edit Template' : 'Create New Template'}
        </h3>
        <div className="mb-3">
          <label
            htmlFor="templateName"
            className="block text-sm font-medium text-gray-700"
          >
            Template Name
          </label>
          <input
            type="text"
            id="templateName"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="e.g., Welcome Email"
          />
        </div>
        <div className="mb-3">
          <label
            htmlFor="templateSubject"
            className="block text-sm font-medium text-gray-700"
          >
            Subject
          </label>
          <input
            type="text"
            id="templateSubject"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={newTemplateSubject}
            onChange={(e) => setNewTemplateSubject(e.target.value)}
            placeholder="e.g., Welcome to Our Service!"
          />
        </div>
        <div className="mb-3">
          <label
            htmlFor="templateBody"
            className="block text-sm font-medium text-gray-700"
          >
            Body
          </label>
          <MDEditor
            value={newTemplateBody}
            onChange={(value) => setNewTemplateBody(value || '')}
            style={{ height: '200px' }}
          />
        </div>
        <div className="mt-12 flex space-x-2">
          {editingTemplate ? (
            <>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Template
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Create Template
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3">Existing Templates</h3>
        {templates.length === 0 ? (
          <p>No email templates found. Create one above!</p>
        ) : (
          <ul className="space-y-3">
            {templates.map((template) => (
              <li
                key={template.id}
                className="p-4 border rounded-lg shadow-sm bg-white flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-lg">{template.name}</p>
                  <p className="text-gray-600 text-sm">
                    Subject: {template.subject}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {onSelectTemplate && (
                    <button
                      onClick={() => onSelectTemplate(template)}
                      className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                    >
                      Select
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(template)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EmailTemplateManager;

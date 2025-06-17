import React, { useState, useEffect } from 'react';
import { EmailTemplate } from '../../crm/types';
import {
  createEmailTemplate,
  getEmailTemplates,
  updateEmailTemplate,
  deleteEmailTemplate,
} from '../utils/emailTemplateUtils';
import MDEditor from '@uiw/react-md-editor';
import { cn } from '@/lib/utils'; // Import cn utility
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Import Card components
import { Label } from '@/components/ui/label'; // Import Label component
import { Input } from '@/components/ui/input'; // Import Input component
import { Button } from '@/components/ui/button'; // Import Button component
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'; // Import Table components

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
    <Card className="p-4">
      {' '}
      {/* Replaced div with Card */}
      <CardHeader>
        <CardTitle>Email Template Manager</CardTitle>{' '}
        {/* Replaced h2 with CardTitle */}
      </CardHeader>
      <Card className="mb-6 p-4">
        {' '}
        {/* Replaced div with Card */}
        <CardHeader>
          <CardTitle>
            {editingTemplate ? 'Edit Template' : 'Create New Template'}
          </CardTitle>{' '}
          {/* Replaced h3 with CardTitle */}
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <Label htmlFor="templateName">Template Name</Label>{' '}
            {/* Replaced label with Label component */}
            <Input
              type="text"
              id="templateName"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="e.g., Welcome Email"
            />
          </div>
          <div className="mb-3">
            <Label htmlFor="templateSubject">Subject</Label>{' '}
            {/* Replaced label with Label component */}
            <Input
              type="text"
              id="templateSubject"
              value={newTemplateSubject}
              onChange={(e) => setNewTemplateSubject(e.target.value)}
              placeholder="e.g., Welcome to Our Service!"
            />
          </div>
          <div className="mb-3">
            <Label htmlFor="templateBody">Body</Label>{' '}
            {/* Replaced label with Label component */}
            <MDEditor
              value={newTemplateBody}
              onChange={(value) => setNewTemplateBody(value || '')}
              style={{ height: '200px' }}
            />
          </div>
          <div className="mt-12 flex space-x-2">
            {editingTemplate ? (
              <>
                <Button onClick={handleUpdate}>
                  {' '}
                  {/* Replaced button with Button component */}
                  Update Template
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                  {' '}
                  {/* Replaced button with Button component and added variant */}
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={handleCreate}>
                {' '}
                {/* Replaced button with Button component */}
                Create Template
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-3">Existing Templates</h3>
        {templates.length === 0 ? (
          <p>No email templates found. Create one above!</p>
        ) : (
          <Table>
            {' '}
            {/* Replaced ul with Table */}
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  {' '}
                  {/* Replaced li with TableRow */}
                  <TableCell className="font-semibold">
                    {template.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {template.subject}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {onSelectTemplate && (
                        <Button
                          variant="secondary" // Added variant
                          size="sm"
                          onClick={() => onSelectTemplate(template)}
                        >
                          Select
                        </Button>
                      )}
                      <Button
                        variant="outline" // Added variant
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive" // Added variant
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  );
};

export default EmailTemplateManager;

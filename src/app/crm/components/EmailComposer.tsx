import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useCRMData } from '../../../hooks/use-crm-data';
import { EmailTemplate } from '../../crm/types';
import { cn } from '@/lib/utils'; // Import cn utility
import { Card, CardHeader, CardTitle } from '@/components/ui/card'; // Import Card components
import { Label } from '@/components/ui/label'; // Import Label component
import { Input } from '@/components/ui/input'; // Import Input component
import { Button } from '@/components/ui/button'; // Import Button component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Import Select components

interface EmailComposerProps {
  customerId: string;
  onEmailSent?: () => void;
  templates: EmailTemplate[]; // Add templates prop
}

const EmailComposer: React.FC<EmailComposerProps> = ({
  customerId,
  onEmailSent,
  templates, // Destructure templates from props
}) => {
  const { handleCreateCommunicationLogAction } = useCRMData();
  const [toEmail, setToEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');

  const handleSendEmail = useCallback(async () => {
    if (!customerId || !toEmail || !subject || !body) {
      toast.error('Please fill in all required fields (To, Subject, Body).');
      return;
    }

    try {
      // For now, "sending" an email means logging it as a communication.
      // A placeholder for actual backend email sending can be added here later.
      await handleCreateCommunicationLogAction({
        customerId,
        type: 'email',
        date: Date.now(),
        subject: subject,
        body: body,
        direction: 'outbound',
        notes: `Email sent to ${toEmail} with subject: "${subject}"`, // A summary note
      });

      toast.success('Email logged successfully!');
      setToEmail('');
      setSubject('');
      setBody('');
      onEmailSent?.(); // Notify parent component if email was sent
    } catch (error) {
      console.error('Error logging email communication:', error);
      toast.error('Failed to log email communication.');
    }
  }, [
    customerId,
    toEmail,
    subject,
    body,
    handleCreateCommunicationLogAction,
    onEmailSent,
  ]);

  const handleLoadTemplate = useCallback(
    (templateId: string) => {
      const selectedTemplate = templates.find(
        (t: EmailTemplate) => t.id === templateId,
      ); // Explicitly type t
      if (selectedTemplate) {
        setSubject(selectedTemplate.subject);
        setBody(selectedTemplate.body);
        toast.info(`Template "${selectedTemplate.name}" loaded.`);
      }
    },
    [templates],
  ); // Add templates to dependency array

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>Compose Email</CardTitle>
      </CardHeader>
      <div className="mb-3">
        <Label htmlFor="toEmail">To</Label>
        <Input
          type="email"
          id="toEmail"
          value={toEmail}
          onChange={(e) => setToEmail(e.target.value)}
          placeholder="recipient@example.com"
        />
      </div>
      <div className="mb-3">
        <Label htmlFor="subject">Subject</Label>
        <Input
          type="text"
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email Subject"
        />
      </div>
      <div className="mb-3">
        <Label htmlFor="emailBody">Body</Label>
        <textarea
          id="emailBody"
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:border-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 h-[200px]"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your email here..."
        />
      </div>
      <div className="mt-4 mb-6">
        <Label htmlFor="template-select">Load from Template</Label>
        <Select onValueChange={handleLoadTemplate}>
          <SelectTrigger id="template-select" className="w-full">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.length === 0 ? (
              <SelectItem
                value="no-templates"
                disabled
                label="No templates available"
              >
                No templates available
              </SelectItem>
            ) : (
              templates.map(
                (
                  template: EmailTemplate, // Explicitly type template
                ) => (
                  <SelectItem
                    key={template.id}
                    value={template.id}
                    label={template.name}
                  >
                    {template.name}
                  </SelectItem>
                ),
              )
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="mt-12 flex space-x-2">
        <Button onClick={handleSendEmail}>Send Email</Button>
      </div>
    </Card>
  );
};

export default EmailComposer;

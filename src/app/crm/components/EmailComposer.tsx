import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useCRMData } from '../../../hooks/use-crm-data';
import { EmailTemplate } from '../../crm/types';
import { cn } from '@/lib/utils'; // Import cn utility
import { Card, CardHeader, CardTitle } from '@/components/ui/card'; // Import Card components
import { Label } from '@/components/ui/label'; // Import Label component
import { Input } from '@/components/ui/input'; // Import Input component
import { Button } from '@/components/ui/button'; // Import Button component

interface EmailComposerProps {
  customerId: string;
  onEmailSent?: () => void;
}

const EmailComposer: React.FC<EmailComposerProps> = ({
  customerId,
  onEmailSent,
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

  const handleLoadTemplate = useCallback((template: EmailTemplate) => {
    setSubject(template.subject);
    setBody(template.body);
    toast.info(`Template "${template.name}" loaded.`);
  }, []);

  // Note: For Quill, you would typically install it via npm/yarn:
  // npm install react-quill quill
  // or
  // yarn add react-quill quill

  return (
    <Card className="p-4">
      {' '}
      {/* Replaced div with Card */}
      <CardHeader>
        {' '}
        {/* Replaced h2 with CardHeader and CardTitle */}
        <CardTitle>Compose Email</CardTitle>
      </CardHeader>
      <div className="mb-3">
        <Label htmlFor="toEmail">To</Label>{' '}
        {/* Replaced label with Label component */}
        <Input
          type="email"
          id="toEmail"
          value={toEmail}
          onChange={(e) => setToEmail(e.target.value)}
          placeholder="recipient@example.com"
        />
      </div>
      <div className="mb-3">
        <Label htmlFor="subject">Subject</Label>{' '}
        {/* Replaced label with Label component */}
        <Input
          type="text"
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email Subject"
        />
      </div>
      <div className="mb-3">
        <Label htmlFor="emailBody">Body</Label>{' '}
        {/* Replaced label with Label component */}
        <textarea
          id="emailBody"
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:border-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 h-[200px]" // Applied Tailwind classes and custom height
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your email here..."
        />
      </div>
      <div className="mt-12 flex space-x-2">
        <Button onClick={handleSendEmail}>
          {' '}
          {/* Replaced button with Button component */}
          Send Email
        </Button>
      </div>
      {/* Integration with EmailTemplateManager for selecting templates */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-3">Load from Templates</h3>
        {/* This is where EmailTemplateManager would be rendered, passing handleLoadTemplate as onSelectTemplate */}
        {/* <EmailTemplateManager onSelectTemplate={handleLoadTemplate} /> */}
        <p className="text-gray-600">
          <strong>Note:</strong> The Email Template Manager component will be
          integrated here to allow selecting and loading templates. For now, you
          can manually copy-paste template content.
        </p>
      </div>
    </Card>
  );
};

export default EmailComposer;

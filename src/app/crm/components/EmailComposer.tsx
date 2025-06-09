import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useCRMData } from '../../../hooks/use-crm-data';
import { EmailTemplate } from '../../crm/types';
import dynamic from 'next/dynamic';

// Dynamically import QuillEditor to avoid SSR issues
const QuillEditor = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css'; // Quill's CSS

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
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h2 className="text-2xl font-bold mb-4">Compose Email</h2>

      <div className="mb-3">
        <label
          htmlFor="toEmail"
          className="block text-sm font-medium text-gray-700"
        >
          To
        </label>
        <input
          type="email"
          id="toEmail"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          value={toEmail}
          onChange={(e) => setToEmail(e.target.value)}
          placeholder="recipient@example.com"
        />
      </div>

      <div className="mb-3">
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-gray-700"
        >
          Subject
        </label>
        <input
          type="text"
          id="subject"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email Subject"
        />
      </div>

      <div className="mb-3">
        <label
          htmlFor="emailBody"
          className="block text-sm font-medium text-gray-700"
        >
          Body
        </label>
        <QuillEditor
          value={body}
          onChange={setBody}
          theme="snow"
          className="bg-white"
          style={{ height: '200px' }}
        />
      </div>

      <div className="mt-12 flex space-x-2">
        <button
          onClick={handleSendEmail}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Send Email
        </button>
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
    </div>
  );
};

export default EmailComposer;

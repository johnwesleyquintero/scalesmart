import { EmailTemplate } from '../../crm/types';
import { createCrudService } from '../../../lib/indexeddb/crm-db';

const CRM_EMAIL_TEMPLATES_STORE_NAME = 'crmEmailTemplates';

// Create a CRUD service specifically for Email Templates
const emailTemplateService = createCrudService<EmailTemplate>(
  CRM_EMAIL_TEMPLATES_STORE_NAME,
);

/**
 * Creates a new email template in IndexedDB.
 * @param template - The email template object to create.
 * @returns A promise that resolves when the template is created.
 */
export const createEmailTemplate = emailTemplateService.create;

/**
 * Retrieves all email templates from IndexedDB.
 * @returns A promise that resolves with an array of EmailTemplate objects.
 */
export const getEmailTemplates = emailTemplateService.getAll;

/**
 * Updates an existing email template in IndexedDB.
 * @param template - The email template object with updated data.
 * @returns A promise that resolves when the template is updated.
 */
export const updateEmailTemplate = emailTemplateService.update;

/**
 * Deletes an email template from IndexedDB by its ID.
 * @param id - The ID of the email template to delete.
 * @returns A promise that resolves when the template is deleted.
 */
export const deleteEmailTemplate = emailTemplateService.delete;

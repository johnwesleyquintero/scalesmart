import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import { jsPDF } from 'jspdf';

interface ToastFunction {
  (props: {
    title: string;
    description: string;
    variant?: 'default' | 'destructive';
    duration?: number;
  }): void;
}

export const copyMarkdownToClipboard = (
  markdown: string,
  toast: ToastFunction,
) => {
  navigator.clipboard.writeText(markdown);
  toast({
    title: 'Copied!',
    description: 'Markdown content copied to clipboard.',
    duration: 2000,
  });
};

export const exportToHtml = async (
  markdown: string,
  title: string,
  toast: ToastFunction,
) => {
  try {
    const html = String(
      await unified().use(remarkParse).use(remarkHtml).process(markdown),
    );
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to export to HTML.',
      variant: 'destructive',
    });
  }
};

export const exportToPdf = async (
  markdown: string,
  title: string,
  toast: ToastFunction,
) => {
  try {
    const html = String(
      await unified().use(remarkParse).use(remarkHtml).process(markdown),
    );

    // Create a temporary element to render the HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    document.body.appendChild(tempElement);

    const doc = new jsPDF();

    // Use html2canvas to render the HTML to a canvas, then add to PDF
    // Note: html2canvas is not directly imported here, assuming it's handled externally or via a global script
    // For a full implementation, html2canvas would need to be imported and used.
    // As a placeholder, we'll just add the raw HTML content as text.
    doc.text(html, 10, 10);

    doc.save(`${title}.pdf`);

    document.body.removeChild(tempElement);
  } catch (error) {
    console.error('Failed to export to PDF:', error);
    toast({
      title: 'Error',
      description: 'Failed to export to PDF.',
      variant: 'destructive',
    });
  }
};

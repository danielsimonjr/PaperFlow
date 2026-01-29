/**
 * Open the default email client with the document as context.
 * Note: Browsers cannot programmatically attach files to mailto: links.
 * This opens a mailto: link with the document name in the subject.
 * Users must manually attach the file.
 */
export function openEmailWithDocument(
  fileName: string,
  documentUrl?: string
): void {
  const subject = encodeURIComponent(`Shared document: ${fileName}`);
  const bodyParts: string[] = [
    `I'd like to share the document "${fileName}" with you.`,
  ];

  if (documentUrl) {
    bodyParts.push('');
    bodyParts.push(`Document link: ${documentUrl}`);
  } else {
    bodyParts.push('');
    bodyParts.push('Please find the document attached to this email.');
  }

  const body = encodeURIComponent(bodyParts.join('\n'));
  const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;

  window.open(mailtoUrl, '_self');
}

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface ResponseReceivedOpts {
  formTitle:      string;
  creatorEmail:   string;
  respondentName?: string;
  formUrl:        string;
}

interface ResponseCopyOpts {
  formTitle:       string;
  respondentEmail: string;
  answers:         { label: string; value: string }[];
}

export async function sendResponseReceived(opts: ResponseReceivedOpts) {
  if (!resend) return;
  return resend.emails.send({
    from:    'FormForge <noreply@formforge.jdevs.codes>',
    to:      opts.creatorEmail,
    subject: `New response on "${opts.formTitle}"`,
    text:    `New response from ${opts.respondentName ?? 'Anonymous'} on "${opts.formTitle}". View responses: ${opts.formUrl}`,
  });
}

export async function sendResponseCopy(opts: ResponseCopyOpts) {
  if (!resend) return;
  const answerList = opts.answers.map(a => `${a.label}: ${a.value}`).join('\n');
  return resend.emails.send({
    from:    'FormForge <noreply@formforge.jdevs.codes>',
    to:      opts.respondentEmail,
    subject: `Your response to "${opts.formTitle}"`,
    text:    `Thank you for your response!\n\n${answerList}`,
  });
}

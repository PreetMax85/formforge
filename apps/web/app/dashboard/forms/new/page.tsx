import { redirect } from 'next/navigation';

/**
 * Form creation actually happens inline on /dashboard via the "+ New Form" button.
 * This route exists for direct-URL navigation — redirect to the real flow.
 */
export default function NewFormPage(): never {
  redirect('/dashboard');
}

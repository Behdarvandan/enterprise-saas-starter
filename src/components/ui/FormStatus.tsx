interface FormStatusProps {
  error?: string;
  success?: boolean;
  successMessage: string;
}

/** Renders a form's error or success message, matching this app's shared styling. */
export default function FormStatus({ error, success, successMessage }: FormStatusProps) {
  if (error) {
    return (
      <p className="rounded-lg bg-status-error/10 px-3 py-2 text-xs font-medium text-status-error">
        {error}
      </p>
    );
  }

  if (success) {
    return (
      <p className="rounded-lg bg-status-success/10 px-3 py-2 text-xs font-medium text-status-success">
        {successMessage}
      </p>
    );
  }

  return null;
}

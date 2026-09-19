interface FormStatusProps {
  error?: string;
  success?: boolean;
  successMessage: string;
}

/** Renders a form's error or success message, matching this app's shared styling. */
export default function FormStatus({ error, success, successMessage }: FormStatusProps) {
  if (error) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-medium text-status-error"
      >
        {error}
      </p>
    );
  }

  if (success) {
    return (
      <p
        role="status"
        className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400"
      >
        {successMessage}
      </p>
    );
  }

  return null;
}

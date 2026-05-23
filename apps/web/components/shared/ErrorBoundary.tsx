interface ErrorBoundaryProps {
  error: Error | string;
  retry?: () => void;
}

export default function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
      <p className="text-[#ef5350] text-sm mb-2">
        {typeof error === 'string' ? error : error.message}
      </p>
      {retry && (
        <button onClick={retry} className="text-[#569cd6] text-sm hover:underline">
          Retry
        </button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export default function ErrorState({
  title = "Something went wrong",
  message,
  retry
}: ErrorStateProps) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8">
      <div className="flex flex-col items-center justify-center text-center">
        <svg
          className="w-16 h-16 text-red-500 dark:text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-red-800 dark:text-red-200">
          {title}
        </h3>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 max-w-md">
          {message}
        </p>
        {retry && (
          <button
            onClick={retry}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

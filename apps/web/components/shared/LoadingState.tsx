interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Compiling shaders...' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-[#9ca3af] text-sm">{message}</p>
    </div>
  );
}

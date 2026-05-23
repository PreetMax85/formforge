interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
      <p className="text-[#d4d4d4] font-medium mb-1">{title}</p>
      {description && <p className="text-[#9ca3af] text-sm mb-3">{description}</p>}
      {action}
    </div>
  );
}

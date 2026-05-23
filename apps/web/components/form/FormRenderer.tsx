interface FormRendererProps {
  formConfig: unknown;
  theme: string;
  mode: 'preview' | 'live';
}

export default function FormRenderer({ formConfig, theme, mode }: FormRendererProps) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold text-[#d4d4d4] mb-2">FormRenderer</h2>
      <p className="text-[#9ca3af] text-sm">Mode: {mode} | Theme: {theme}</p>
    </div>
  );
}

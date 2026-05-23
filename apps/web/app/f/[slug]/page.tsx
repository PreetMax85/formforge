export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-[#d4d4d4] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Form: {slug}</h1>
        <p className="text-[#9ca3af]">FormRenderer goes here — scaffolded</p>
      </div>
    </div>
  );
}

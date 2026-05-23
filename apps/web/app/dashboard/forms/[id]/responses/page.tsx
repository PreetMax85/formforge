export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="bg-[#1e1e1e] text-[#d4d4d4] min-h-screen p-8">
      <h1 className="text-2xl font-bold">Responses</h1>
      <p className="text-[#9ca3af]">No assets found in this scene.</p>
    </div>
  );
}

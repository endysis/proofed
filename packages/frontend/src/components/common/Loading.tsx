export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-pastel-pink border-t-primary"></div>
      <p className="text-sm text-dusty-mauve mt-4">Loading...</p>
    </div>
  );
}

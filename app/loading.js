export default function Loading() {
  return (
    <div className="min-h-[35vh] flex items-center justify-center">
      <div className="w-full max-w-xl px-6">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-orange-100">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-orange-500" />
        </div>
      </div>
    </div>
  );
}

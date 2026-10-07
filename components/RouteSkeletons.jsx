import Skeleton from "@/components/Skeleton";

const Shell = ({ children, narrow = false }) => (
  <div className="min-h-screen bg-[#f8fafc]" aria-busy="true" aria-label="Loading page">
    <div className="border-b border-gray-100 bg-white px-3 py-2.5 md:px-5"><div className="mx-auto flex max-w-[1500px] items-center gap-3"><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="h-10 flex-1 rounded-full" /><Skeleton className="hidden h-9 w-24 rounded-full md:block" /></div></div>
    <main className={`mx-auto px-3 py-6 sm:px-6 md:py-10 ${narrow ? "max-w-3xl" : "max-w-6xl"}`}>{children}</main>
  </div>
);

export const EditorialPageSkeleton = () => (
  <Shell>
    <Skeleton className="h-3 w-24 rounded-full" /><Skeleton className="mt-4 h-10 w-3/4 max-w-xl rounded-xl" /><Skeleton className="mt-3 h-4 w-full max-w-2xl rounded-full" /><Skeleton className="mt-2 h-4 w-4/5 max-w-xl rounded-full" />
    <div className="mt-8 grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="rounded-2xl border border-gray-100 bg-white p-5"><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="mt-5 h-5 w-3/4 rounded-full" /><Skeleton className="mt-3 h-3.5 w-full rounded-full" /><Skeleton className="mt-2 h-3.5 w-4/5 rounded-full" /></div>)}</div>
    <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6"><Skeleton className="h-6 w-48 rounded-full" /><Skeleton className="mt-5 h-4 w-full rounded-full" /><Skeleton className="mt-3 h-4 w-11/12 rounded-full" /><Skeleton className="mt-3 h-4 w-4/5 rounded-full" /></div>
  </Shell>
);

export const CategoryPageSkeleton = () => (
  <Shell>
    <Skeleton className="h-8 w-48 rounded-xl" /><Skeleton className="mt-3 h-4 w-72 max-w-full rounded-full" />
    <div className="mt-7 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">{Array.from({ length: 12 }).map((_, item) => <div key={item} className="rounded-xl bg-white p-3"><Skeleton className="mx-auto h-14 w-14 rounded-full" /><Skeleton className="mx-auto mt-3 h-3 w-16 rounded-full" /></div>)}</div>
    <Skeleton className="mt-9 h-6 w-40 rounded-full" /><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{Array.from({ length: 10 }).map((_, item) => <div key={item}><Skeleton className="aspect-square w-full rounded-xl" /><Skeleton className="mt-2 h-3.5 w-4/5 rounded-full" /><Skeleton className="mt-2 h-3 w-2/5 rounded-full" /></div>)}</div>
  </Shell>
);

export const FormPageSkeleton = ({ payment = false }) => (
  <Shell narrow><Skeleton className="h-8 w-52 rounded-xl" /><Skeleton className="mt-3 h-4 w-80 max-w-full rounded-full" /><div className="mt-7 rounded-2xl border border-gray-100 bg-white p-5 sm:p-7">{Array.from({ length: payment ? 3 : 7 }).map((_, item) => <div key={item} className="mb-5 last:mb-0"><Skeleton className="h-3.5 w-28 rounded-full" /><Skeleton className={`mt-2 w-full rounded-xl ${payment ? "h-20" : "h-11"}`} /></div>)}{!payment && <Skeleton className="mt-6 h-11 w-40 rounded-full" />}</div></Shell>
);

export const AuthPageSkeleton = () => <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4"><div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md"><Skeleton className="mx-auto h-8 w-48 rounded-xl" /><Skeleton className="mt-7 h-11 w-full rounded-lg" /><Skeleton className="mt-4 h-11 w-full rounded-lg" /><Skeleton className="mt-6 h-10 w-full rounded-lg" /></div></div>;

export default function ForgotPasswordLoading() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center py-12 px-6 sm:px-8 text-neutral-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        <div className="w-10 h-10 rounded-xl bg-neutral-950 mx-auto animate-pulse"></div>
        <div className="h-7 bg-neutral-200 rounded w-48 mx-auto animate-pulse"></div>
        <div className="h-4 bg-neutral-100 rounded w-64 mx-auto animate-pulse"></div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 border border-neutral-200/80 rounded-2xl shadow-xs space-y-5 animate-pulse">
          <div className="space-y-2">
            <div className="h-4 bg-neutral-200 rounded w-20"></div>
            <div className="h-10 bg-neutral-100 rounded-lg w-full"></div>
          </div>
          <div className="h-10 bg-neutral-950 rounded-lg w-full mt-4"></div>
        </div>
      </div>
    </div>
  );
}

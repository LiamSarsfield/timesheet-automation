import TimesheetForm from "@/components/timesheet-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            NAS Timesheet Automation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill in your weekly timesheet, generate CSV/XLSX files, and send to your email for review.
          </p>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <TimesheetForm />
      </main>
    </div>
  );
}

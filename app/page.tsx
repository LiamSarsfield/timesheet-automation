import Image from "next/image";
import TimesheetForm from "@/components/timesheet-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-nas-green shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center gap-4">
          <Image
            src="/nas-crest.png"
            alt="National Ambulance Service crest"
            width={64}
            height={64}
            className="h-16 w-auto flex-shrink-0"
          />
          <div>
            <h1 className="text-2xl font-bold text-white">
              NAS Timesheet Automation
            </h1>
            <p className="text-sm text-white/70 mt-1">
              Fill in your weekly timesheet and download as CSV or Excel.
            </p>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <TimesheetForm />
      </main>
    </div>
  );
}

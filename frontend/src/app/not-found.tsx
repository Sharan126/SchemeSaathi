import Link from "next/link";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
        <FileQuestion className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          404 - Page Not Found / पृष्ठ नहीं मिला
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          The government scheme or portal page you requested does not exist or may have been relocated.
          <br />
          <span className="text-xs text-slate-500">
            ನಿಮ್ಮ ವಿನಂತಿಸಿದ ಪುಟ ಅಥವಾ ಯೋಜನೆ ಕಂಡುಬಂದಿಲ್ಲ.
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gov-blue hover:bg-blue-800 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>
        <Link
          href="/schemes"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Browse All Schemes</span>
        </Link>
      </div>
    </div>
  );
}

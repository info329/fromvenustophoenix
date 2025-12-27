export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-sm text-gray-600">
          <p className="mb-2 font-semibold text-[#0066cc]">
            A&R Focus Forecast
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Helping childcare services prepare for Assessment & Rating visits with confidence
          </p>
          <p className="text-xs bg-amber-50 border border-amber-200 rounded p-3 max-w-3xl mx-auto text-amber-900">
            <strong>Important:</strong> This tool provides probability-based forecasts only. It does not guarantee what an 
            Authorised Officer will focus on during an Assessment and Rating visit.
          </p>
          <p className="mt-4 text-xs text-gray-400">
            © {new Date().getFullYear()} A&R Focus Forecast. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

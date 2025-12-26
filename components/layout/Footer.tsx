export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-sm text-slate-500">
          <p className="mb-2">
            <strong>A&R Focus Forecast</strong> - Helping childcare services prepare with confidence
          </p>
          <p className="text-xs">
            This tool provides probability-based forecasts only. It does not guarantee what an 
            Authorised Officer will focus on during an Assessment and Rating visit.
          </p>
          <p className="mt-4 text-xs">
            © {new Date().getFullYear()} A&R Focus Forecast. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

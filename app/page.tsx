import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-6">
          A&R Focus Forecast
        </h1>
        <p className="text-xl text-slate-600 mb-4">
          Helping Australian childcare services prepare for Assessment & Rating visits
        </p>
        <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
          Get probability-based forecasts of likely audit focus areas based on your service profile 
          and questionnaire responses. Reduce A&R anxiety by knowing where assessors may focus their attention.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link href="/signup">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">Sign In</Button>
          </Link>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-left max-w-2xl mx-auto">
          <p className="text-sm text-amber-900">
            <strong>Important:</strong> This tool provides probability-based forecasts only. 
            It does not guarantee what an Authorised Officer will focus on during your 
            Assessment and Rating visit. Always refer to the National Quality Framework 
            and your regulatory authority for authoritative guidance.
          </p>
        </div>
      </div>
    </div>
  );
}

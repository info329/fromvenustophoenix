export const emailTemplates = {
  reportReady: (userName: string, serviceName: string, reportUrl: string) => ({
    subject: `Your A&R Focus Forecast Report is Ready - ${serviceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">Your Report is Ready</h1>
        <p>Hi ${userName},</p>
        <p>Your A&R Focus Forecast report for <strong>${serviceName}</strong> has been generated and is ready to view.</p>
        <p>
          <a href="${reportUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Your Report
          </a>
        </p>
        <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
          Remember: This report provides probability-based forecasts only. It does not guarantee what an Authorised Officer will focus on during your Assessment and Rating visit.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px;">
          A&R Focus Forecast - Helping childcare services prepare with confidence
        </p>
      </div>
    `,
    text: `Hi ${userName},\n\nYour A&R Focus Forecast report for ${serviceName} has been generated.\n\nView it here: ${reportUrl}\n\nRemember: This is a probability-based forecast only.`,
  }),

  welcomeEmail: (userName: string) => ({
    subject: 'Welcome to A&R Focus Forecast',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">Welcome to A&R Focus Forecast</h1>
        <p>Hi ${userName},</p>
        <p>Thank you for signing up! We're here to help you prepare for your Assessment and Rating visit with confidence.</p>
        <h2 style="color: #334155; font-size: 18px;">Getting Started:</h2>
        <ol>
          <li>Add your service details</li>
          <li>Complete the questionnaire</li>
          <li>Receive your personalised forecast report</li>
        </ol>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Go to Dashboard
          </a>
        </p>
      </div>
    `,
    text: `Hi ${userName},\n\nWelcome to A&R Focus Forecast!\n\nGet started:\n1. Add your service details\n2. Complete the questionnaire\n3. Receive your personalised forecast report\n\nVisit your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  }),
};

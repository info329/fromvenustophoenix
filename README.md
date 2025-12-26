# A&R Focus Forecast

> Helping Australian childcare services prepare for Assessment & Rating visits with probability-based forecasts

A Next.js 14 MVP that generates probability-based forecasts of likely audit focus areas for childcare services preparing for Assessment & Rating visits.

## Features

✅ **User Authentication** - Secure signup/login with Supabase Auth  
✅ **Service Management** - Add and manage multiple childcare services  
✅ **Multi-step Questionnaire** - Interactive wizard with conditional logic  
✅ **Scoring Engine** - Advanced algorithm with weights and rules  
✅ **Ranked Results** - View focus areas with explanations and confidence scores  
✅ **PDF Reports** - Download comprehensive forecast reports  
✅ **Admin Panel** - Manage questionnaires, questions, dimensions, weights, and rules  

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **PDF Generation**: @react-pdf/renderer
- **Email**: Nodemailer (SMTP)

## Quick Start

1. Clone and install:
```bash
git clone https://github.com/info329/fromvenustophoenix.git
cd fromvenustophoenix
npm install
```

2. Set up Supabase and add credentials to `.env.local`

3. Run database schema and seed:
```bash
npm run seed
```

4. Start development:
```bash
npm run dev
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions.

## Important Disclaimer

This tool provides **probability-based forecasts only**. It does not guarantee what an Authorised Officer will focus on during visits. Always refer to the National Quality Framework for authoritative guidance.

---

Built for Australian childcare educators

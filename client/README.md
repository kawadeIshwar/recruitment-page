# Recruiter Portal - Alabty

A modern, enterprise-grade ATS (Applicant Tracking System) recruiter portal built with React, Vite, and Tailwind CSS.

## Features

- **Modern UI/UX**: Clean, professional design inspired by top ATS platforms
- **Responsive Design**: Mobile-first approach with seamless desktop experience
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **Multi-Step Forms**: Intuitive onboarding flow with step-by-step validation
- **OTP Verification**: Secure email verification with resend functionality
- **GST/PAN Validation**: Integration-ready for FynamicsGST API
- **Forgot Password Flow**: Complete password recovery with OTP verification

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Routing**: React Router DOM
- **Font**: Inter (Google Fonts)

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── Header.jsx       # Sticky header with rotating taglines
│   ├── Footer.jsx       # Footer component
│   ├── Features.jsx     # Features section with animations
│   └── Toast.jsx        # Toast notification component
├── pages/
│   ├── HomePage.jsx     # Landing page
│   ├── LoginPage.jsx    # Login with forgot password flow
│   └── GetStartedPage.jsx # Multi-step registration form
├── App.jsx              # Main app component with routing
├── main.jsx             # Entry point
└── index.css            # Global styles and Tailwind imports
```

## Pages

### Home Page (`/`)
- Hero section with CTAs
- Features showcase
- Call-to-action section

### Login Page (`/login`)
- Email and password login
- Forgot password flow:
  1. Enter email/phone
  2. OTP verification
  3. Reset password

### Get Started (`/get-started`)
Multi-step registration:
1. **Personal Details**: First name, last name, designation
2. **Business Details**: Company name, phone, business type, website (optional)
3. **GST/PAN Verification**: Validate business credentials
4. **Email Verification**: OTP-based email verification

## Design System

- **Font**: Inter (Google Fonts)
- **Primary Color**: #007BFF
- **Text Colors**: 
  - Primary titles: 16px, #333333
  - Section labels: 12px, #333333
  - Skill tags: 12px, bold, #007BFF
  - Action links: 12px, #1E90FF

## API Integration Ready

The application is structured to easily integrate with:
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **OTP Services**: Textlocal / MSG91
- **GST/PAN Verification**: FynamicsGST API

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - Alabty


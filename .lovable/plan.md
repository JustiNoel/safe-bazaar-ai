

# Professional Polish Plan for SafeBazaar AI

After reviewing the full codebase, here are the high-impact additions that would elevate SafeBazaar AI from a functional product to a professional, investor-ready platform.

---

## 1. User Profile/Settings Page (Missing entirely)

There is no dedicated profile page. Users cannot view or edit their account details, change passwords, or manage preferences. This is a basic expectation of any professional app.

**What to build:**
- New `/profile` page with sections: Account Info, Security (change password), Notification Preferences, Subscription Status, and Referral Code display
- Link it from the avatar dropdown menu in Navigation
- Show subscription tier, days remaining, scan usage stats

---

## 2. Password Reset / Forgot Password Flow

The Auth page has no "Forgot Password" link. This is a critical gap for any production app.

**What to build:**
- Add "Forgot Password?" link on the login form
- Trigger Supabase `resetPasswordForEmail` flow
- Add a password reset confirmation page or modal

---

## 3. Loading States and Error Boundaries

The app lacks a global error boundary and several pages load without skeleton states, which looks unprofessional.

**What to build:**
- React Error Boundary wrapping the app with a friendly fallback UI
- Skeleton loaders on Admin, ScanHistory, and SellerDashboard pages during data fetch
- A proper 500-style error page

---

## 4. Email Verification Notice

Users sign up but there is no UI feedback about email verification. The app just redirects to `/scan` immediately, which can confuse users if email confirmation is required.

**What to build:**
- After signup, show a "Check your email to verify your account" message instead of auto-redirecting
- Add a resend verification email button

---

## 5. Onboarding Tour for New Users

First-time users land on the scan page with no guidance. A brief guided tour would improve retention.

**What to build:**
- A lightweight 3-step tooltip tour (using a simple state machine, no heavy library) that highlights: Scan input, Mode tabs (Product/Link/Image), and Results area
- Only shows once per user (tracked via localStorage)

---

## 6. Breadcrumbs and Page Titles

Pages like ScanHistory, SellerDashboard, and Admin have no consistent header pattern. Adding breadcrumbs and `document.title` updates would improve navigation and SEO.

**What to build:**
- Set `document.title` on each page via `useEffect`
- Add a reusable `PageHeader` component with title, description, and optional breadcrumb

---

## 7. Storage Bucket for Seller Product Images

Sellers currently have a `seller_product_image` text field but no actual file upload infrastructure. There is no storage bucket configured.

**What to build:**
- Create a `seller-uploads` storage bucket (public)
- Wire the SellerProfileForm image upload to actually store files in the bucket
- Display uploaded images in the Admin sellers tab

---

## 8. About Page

There is no About page. For a professional Kenyan-focused platform, an About page builds trust and explains the mission.

**What to build:**
- `/about` page with: Mission statement, team info, Kenyan market context, and press/partner logos placeholder
- Link from Footer and Navigation

---

## Technical Details

| Feature | Files to Create/Edit | Complexity |
|---------|---------------------|------------|
| Profile Page | New `src/pages/Profile.tsx`, edit Nav + App.tsx routes | Medium |
| Forgot Password | Edit `src/pages/Auth.tsx` | Low |
| Error Boundary | New `src/components/ErrorBoundary.tsx`, edit App.tsx | Low |
| Email Verification UX | Edit `src/pages/Auth.tsx`, AuthContext | Low |
| Onboarding Tour | New `src/components/OnboardingTour.tsx`, edit Scan.tsx | Medium |
| Page Headers + Titles | New `src/components/PageHeader.tsx`, edit all pages | Low |
| Storage Bucket | SQL migration, edit SellerProfileForm + AdminSellersTab | Medium |
| About Page | New `src/pages/About.tsx`, edit Footer + App.tsx | Low |

**Database changes:** One migration to create the `seller-uploads` storage bucket with RLS policies allowing authenticated users to upload to their own folder and public read access.


# Design Guidelines: Chakri - Professional Referral Network

## Design Approach
**Reference-Based:** Primary inspiration from LinkedIn with elements from modern professional platforms like Wellfound and Indeed. Focus on professional credibility, information density, and efficient task completion.

## Core Design Principles
1. **Professional Trust:** Clean, corporate aesthetic that builds credibility
2. **Information Hierarchy:** Dense data presentation without overwhelming users
3. **Action-Oriented:** Clear CTAs for referral requests and acceptance
4. **Status Transparency:** Visual indicators for referral states, timers, and points

## Typography System
- **Primary Font:** Inter or Source Sans Pro (professional, readable)
- **Secondary Font:** Same family, different weights
- **Hierarchy:**
  - Hero/Headers: 3xl to 5xl, font-semibold to font-bold
  - Section Titles: xl to 2xl, font-semibold
  - Body Text: base to lg, font-normal
  - Metadata/Labels: sm to base, font-medium
  - Captions: xs to sm, font-normal

## Layout System
**Spacing Units:** Consistent use of Tailwind units 2, 4, 6, 8, 12, and 16
- Component padding: p-4 to p-6
- Section spacing: py-8 to py-16
- Card spacing: p-6 to p-8
- Micro-spacing: gap-2 to gap-4

## Component Library

### Navigation
- **Header:** Fixed top navigation with logo left, search center, profile/notifications right
- **Sidebar:** Left-aligned navigation (Home, Referral Center, Connections, Profile)
- **Mobile:** Bottom tab bar with 4-5 core actions

### Authentication Pages
- **Layout:** Split-screen design - left side with brand messaging/illustration, right side with form
- **Forms:** Single-column, generous spacing (space-y-6), clear labels above inputs
- **Social Login:** Prominent Google/GitHub/Apple buttons with "or continue with email" divider

### Homepage/Feed
- **Three-Column Layout:** 
  - Left sidebar (240px): User quick stats, navigation
  - Center feed (600px): Referral requests, activity updates
  - Right sidebar (300px): Trending companies, Chakri points leaderboard
- **Cards:** Elevated (shadow-sm), rounded-lg, white background

### Profile Page
- **Header Section:** 
  - Cover image area (h-48 to h-64)
  - Profile photo (large, circular, -mt-16 overlap)
  - Name, headline, location in prominent typography
  - Edit/Connect CTA buttons
- **Tabbed Content:** 
  - About, Experience, Education, Skills, Certifications
  - Tab navigation with underline indicator
- **Content Sections:** 
  - Experience items with company logo, title, duration, description
  - Skills as pill badges (max 5, with remove option)
  - Endorsements counter beneath each skill

### Referral Request Card
- **Layout:** 
  - Company logo (left, 48x48px)
  - Request details (center): Position, company, posted time
  - Action button (right): "Accept Referral" primary button
- **Timer Display:** Countdown badge if accepted (orange/amber treatment)
- **Status Indicators:** Badges for "Active", "Accepted", "Expired", "Confirmed"

### Referral Center
- **Filter Bar:** Company filter, location filter, active/history toggle
- **List View:** Stacked cards with clear spacing (space-y-4)
- **Empty State:** Illustration with encouraging message to connect with more people

### Points System Display
- **Dashboard Widget:** 
  - Large point total (text-4xl, font-bold)
  - Recent earnings list (small cards, +500 with green indicator)
  - Progress toward next milestone
- **Badges/Achievements:** Icon-based rewards for milestones (1000, 5000, 10000 points)

### Connection Features
- **Connection Cards:** 
  - Grid layout (2-3 columns)
  - Profile photo, name, headline, company
  - "Connect" or "Message" button
- **Recommendations:** Star rating (1-5), text testimonial, recommender info

## Interaction Patterns

### Referral Workflow
1. **Request Creation:** Modal form with company search, position input, description textarea
2. **Request Display:** Card in feed with clear company branding
3. **Acceptance Flow:** 
   - Primary button → Confirmation modal → Timer starts
   - Progress indicator showing 6-hour countdown
4. **Confirmation:** Both parties approve via checkbox + submit

### Time-Based Elements
- **Countdown Timer:** Prominent display with color progression (green → amber → red)
- **Expiration Notification:** Toast notification when referral expires
- **Auto-refresh:** Live updates for timer without page reload

## Data Display Components

### Work History
- **Timeline Layout:** Vertical line with company logos as nodes
- **Each Entry:** Logo, title, company, duration (start-end), description bullet points

### Skills Section
- **Display:** Flex-wrapped pill badges with endorsement count
- **Edit Mode:** Pills with remove icon (x), add disabled if count = 5
- **Endorsements:** Small avatar stack showing who endorsed

### Education/Certifications
- **Card Layout:** Institution logo, degree/certificate, dates, description
- **Verification Badge:** Shield icon for verified certifications

## Images

### Hero Section (Landing Page)
- **Large Hero Image:** Professional networking illustration or diverse professionals collaborating
- **Placement:** Full-width background with gradient overlay for text readability
- **Content Over Image:** Centered heading + subheading + CTA buttons with backdrop-blur-sm background

### Profile Elements
- **Cover Photo:** User-uploaded banner image (16:5 ratio)
- **Profile Photo:** User-uploaded circular avatar (supports various sizes)
- **Company Logos:** Throughout interface for employer branding (64x64px standard)

### Illustrations
- **Empty States:** Custom illustrations for "No referrals yet", "Build your network"
- **Success States:** Celebratory graphics for referral confirmations, points earned

## Responsive Behavior
- **Desktop (lg+):** Three-column layouts, expanded sidebar
- **Tablet (md):** Two-column, collapsible sidebar
- **Mobile (base):** Single column, bottom navigation, hamburger menu for secondary actions

## Accessibility
- **Form Inputs:** Consistent border (border-2), clear focus states (ring-2), labels with for attributes
- **Interactive Elements:** Minimum touch target 44x44px
- **Status Messages:** ARIA live regions for timer updates and notifications
- **Keyboard Navigation:** Full support for tab navigation, escape to close modals

This design creates a professional, trustworthy platform that balances LinkedIn's familiar patterns with unique features specific to the referral ecosystem and points-based gamification.
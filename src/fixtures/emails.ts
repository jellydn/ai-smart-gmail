import type { Email } from "../types.ts";

/**
 * Synthetic corpus (~30 messages) for demos and golden eval.
 * Anchor "today" for last-month filters: 2026-07-13 → last month = June 2026.
 */
export const SYNTHETIC_EMAILS: Email[] = [
  // --- Invoices (June 2026 = last month relative to 2026-07-13) ---
  {
    id: "inv-june-acme-01",
    subject: "Invoice INV-2026-0601 from Acme Billing",
    from: "billing@acme-billing.example",
    date: new Date("2026-06-05T10:00:00Z"),
    body: `Hello,

Please find invoice INV-2026-0601 for June services.
Amount due: $1,240.00
Due date: 2026-06-20
Vendor: Acme Billing

Thank you,
Acme Billing Accounts`,
    summary: "June invoice INV-2026-0601 from Acme Billing for $1,240.00 due June 20.",
  },
  {
    id: "inv-june-orbit-02",
    subject: "Your Orbit Commerce invoice for June",
    from: "invoices@orbit-commerce.example",
    date: new Date("2026-06-18T14:30:00Z"),
    body: `Hi,

Orbit Commerce invoice INV-ORB-661 is ready.
Total: $89.50 for SaaS seat renewals in June 2026.

Pay at https://orbit.example/pay/INV-ORB-661

— Orbit Commerce Billing`,
    summary: "Orbit Commerce June invoice INV-ORB-661 totaling $89.50 for SaaS seats.",
  },
  {
    id: "inv-may-acme-old",
    subject: "Invoice INV-2026-0509 from Acme Billing (May)",
    from: "billing@acme-billing.example",
    date: new Date("2026-05-09T09:00:00Z"),
    body: `May invoice INV-2026-0509 from Acme Billing.
Amount due: $990.00
This is from May, not June.`,
    summary: "May invoice INV-2026-0509 from Acme Billing for $990.00 (prior month).",
  },
  {
    id: "inv-april-noise",
    subject: "Overdue notice: April invoice",
    from: "collections@vendor.example",
    date: new Date("2026-04-22T11:00:00Z"),
    body: `Reminder that April invoice INV-APR-11 for $45.00 is still open.`,
    summary: "Overdue April invoice INV-APR-11 for $45.00.",
  },

  // --- Interview invitations ---
  {
    id: "interview-brightpath-01",
    subject: "Interview invitation — Senior Engineer at BrightPath Talent",
    from: "recruiter@brightpath-talent.example",
    date: new Date("2026-07-08T16:00:00Z"),
    body: `Hi,

We would like to invite you to an interview for the Senior Engineer role at BrightPath Talent.

When: Thursday, July 16, 2026 at 2:00 PM PT
Format: Video call (Zoom link to follow)
Interviewers: Priya Chen (Hiring Manager), Sam Ortiz (Staff Engineer)

Please reply to confirm.

Best,
BrightPath Talent Recruiting`,
    summary:
      "Interview invitation for Senior Engineer at BrightPath Talent on Thursday, July 16, 2026 at 2:00 PM PT.",
  },
  {
    id: "interview-northwind-02",
    subject: "Onsite interview schedule — Northwind Recruiting",
    from: "hello@northwind-recruiting.example",
    date: new Date("2026-07-10T18:20:00Z"),
    body: `Hello,

Northwind Recruiting has scheduled your onsite interview for the Product Manager position.

Date: Monday, July 20, 2026
Location: 500 Market St, SF
Please bring ID.

— Northwind Recruiting`,
    summary: "Northwind Recruiting onsite interview for Product Manager on Monday, July 20, 2026.",
  },
  {
    id: "interview-followup",
    subject: "Thanks for applying — next steps",
    from: "noreply@jobs.example",
    date: new Date("2026-07-01T08:00:00Z"),
    body: `We received your application. No interview is scheduled yet; we will email if selected.`,
    summary: "Application acknowledgment; no interview scheduled yet.",
  },

  // --- Partnership proposals ---
  {
    id: "partner-helio-01",
    subject: "Partnership proposal: Helio Partners × your product",
    from: "bd@helio-partners.example",
    date: new Date("2026-07-05T12:00:00Z"),
    body: `Dear team,

Helio Partners proposes a co-marketing partnership to jointly launch a summer webinar series.

Scope:
- 3 co-branded webinars in Q3
- Shared lead list (opt-in)
- Revenue share: 15% on referred closed-won deals

We believe this partnership proposal aligns with your growth goals.

Regards,
Alex Rivera
Helio Partners Business Development`,
    summary:
      "Helio Partners partnership proposal for co-marketing webinars with 15% revenue share on referred deals.",
  },
  {
    id: "partner-summit-02",
    subject: "Strategic collaboration idea from Summit Labs",
    from: "partnerships@summit-labs.example",
    date: new Date("2026-06-28T15:45:00Z"),
    body: `Hi,

Summit Labs would like to explore a strategic partnership / integration partnership proposal:
embedding our analytics SDK in your dashboard for mutual customers.

Happy to send a one-pager.

— Summit Labs Partnerships`,
    summary:
      "Summit Labs strategic partnership proposal to embed analytics SDK for mutual customers.",
  },
  {
    id: "partner-noise-sales",
    subject: "Quick intro from a vendor",
    from: "sales@random-saas.example",
    date: new Date("2026-07-02T10:00:00Z"),
    body: `Just bumping our cold outreach. Not a formal partnership proposal—just a product demo offer.`,
    summary: "Cold sales outreach for a product demo, not a partnership proposal.",
  },

  // --- Noise / everyday mail ---
  {
    id: "noise-newsletter-01",
    subject: "This week in design systems",
    from: "newsletter@designweekly.example",
    date: new Date("2026-07-11T07:00:00Z"),
    body: `Top links: component tokens, a11y audits, and a Figma plugin roundup.`,
    summary: "Design systems newsletter with weekly links.",
  },
  {
    id: "noise-shipping-02",
    subject: "Your package has shipped",
    from: "ship-notify@store.example",
    date: new Date("2026-07-09T19:30:00Z"),
    body: `Order #8821 shipped via UPS. Tracking: 1Z999AA10123456784.`,
    summary: "Shipping notification for order #8821 with UPS tracking.",
  },
  {
    id: "noise-receipt-03",
    subject: "Receipt for your payment to CloudHost",
    from: "receipts@cloudhost.example",
    date: new Date("2026-07-03T22:10:00Z"),
    body: `You paid $24.00 to CloudHost. This is a receipt, not an invoice for last month's consulting.`,
    summary: "Payment receipt $24.00 to CloudHost.",
  },
  {
    id: "noise-calendar-04",
    subject: "Accepted: Team standup",
    from: "calendar-notification@corp.example",
    date: new Date("2026-07-07T13:00:00Z"),
    body: `Alex accepted Team standup on weekdays 9:30 AM.`,
    summary: "Calendar acceptance for recurring team standup.",
  },
  {
    id: "noise-github-05",
    subject: "[repo] Dependabot PR opened",
    from: "notifications@github.example",
    date: new Date("2026-07-12T05:15:00Z"),
    body: `Dependabot opened a PR to bump lodash from 4.17.20 to 4.17.21.`,
    summary: "GitHub Dependabot PR notification for lodash bump.",
  },
  {
    id: "noise-hr-06",
    subject: "Open enrollment reminder",
    from: "hr@corp.example",
    date: new Date("2026-06-15T17:00:00Z"),
    body: `Benefits open enrollment ends June 30. No action related to invoices or interviews.`,
    summary: "HR open enrollment reminder ending June 30.",
  },
  {
    id: "noise-travel-07",
    subject: "Your itinerary for SEA",
    from: "trips@airline.example",
    date: new Date("2026-06-02T06:40:00Z"),
    body: `Flight to Seattle on June 12. Confirmation ABC123.`,
    summary: "Airline itinerary to Seattle with confirmation ABC123.",
  },
  {
    id: "noise-social-08",
    subject: "You have 3 new notifications",
    from: "noreply@social.example",
    date: new Date("2026-07-13T01:00:00Z"),
    body: `Someone liked your post about weekend hiking.`,
    summary: "Social network notification digest.",
  },
  {
    id: "noise-security-09",
    subject: "New login to your account",
    from: "security@services.example",
    date: new Date("2026-07-06T03:22:00Z"),
    body: `A new login was detected from Chrome on macOS. If this was you, ignore this email.`,
    summary: "Security alert for new browser login.",
  },
  {
    id: "noise-learning-10",
    subject: "Course reminder: TypeScript advanced types",
    from: "learn@courses.example",
    date: new Date("2026-06-25T12:00:00Z"),
    body: `Your course continues this week with conditional types and mapped types.`,
    summary: "Online course reminder about TypeScript advanced types.",
  },
  {
    id: "noise-donate-11",
    subject: "Thank you for your donation",
    from: "gifts@charity.example",
    date: new Date("2026-05-30T20:00:00Z"),
    body: `We received your $50 donation. Tax receipt attached (not a vendor invoice).`,
    summary: "Charity donation thank-you for $50.",
  },
  {
    id: "noise-meetup-12",
    subject: "RSVP confirmed: Local JS meetup",
    from: "rsvp@meetup.example",
    date: new Date("2026-07-04T09:00:00Z"),
    body: `You're going to Local JS meetup on July 22. This is not a job interview invitation.`,
    summary: "Meetup RSVP confirmation for Local JS meetup.",
  },
  {
    id: "noise-bank-13",
    subject: "Your monthly statement is ready",
    from: "statements@bank.example",
    date: new Date("2026-07-01T06:00:00Z"),
    body: `June statement is available in online banking. Ending balance $4,102.33.`,
    summary: "Bank monthly statement ready for June.",
  },
  {
    id: "noise-promo-14",
    subject: "Flash sale: 30% off headphones",
    from: "deals@shop.example",
    date: new Date("2026-07-11T15:00:00Z"),
    body: `Limited time offer on wireless headphones. Use code EARS30.`,
    summary: "Retail flash sale promotion for headphones.",
  },
  {
    id: "noise-support-15",
    subject: "Re: Ticket #4412 — password reset",
    from: "support@app.example",
    date: new Date("2026-06-19T21:00:00Z"),
    body: `We reset your password as requested. Ticket #4412 is resolved.`,
    summary: "Support ticket #4412 password reset resolution.",
  },
  {
    id: "noise-family-16",
    subject: "Dinner this Sunday?",
    from: "sam.family@example.com",
    date: new Date("2026-07-10T01:10:00Z"),
    body: `Want to do dinner Sunday at 6? No work topics.`,
    summary: "Personal dinner invitation from family for Sunday.",
  },
  {
    id: "noise-legal-17",
    subject: "Updated terms of service",
    from: "legal@services.example",
    date: new Date("2026-06-01T08:00:00Z"),
    body: `We updated our terms effective July 1. Please review when convenient.`,
    summary: "Terms of service update notice effective July 1.",
  },
  {
    id: "noise-photos-18",
    subject: "Photos shared with you",
    from: "share@photos.example",
    date: new Date("2026-07-08T20:00:00Z"),
    body: `Jamie shared an album: Beach weekend. 42 photos.`,
    summary: "Photo album share notification for Beach weekend.",
  },
  {
    id: "noise-webinar-19",
    subject: "Reminder: industry webinar tomorrow",
    from: "events@conf.example",
    date: new Date("2026-07-12T14:00:00Z"),
    body: `Join our industry webinar tomorrow at 11 AM. Not a partnership proposal.`,
    summary: "Industry webinar reminder for tomorrow at 11 AM.",
  },
  {
    id: "noise-parking-20",
    subject: "Parking receipt",
    from: "noreply@parking.example",
    date: new Date("2026-06-08T23:50:00Z"),
    body: `Garage receipt $18.00 on June 8. Not a consulting invoice.`,
    summary: "Parking garage receipt for $18.00.",
  },
];

/** Deep-clone fixture emails so callers can mutate dates safely. */
export function loadSyntheticEmails(): Email[] {
  return SYNTHETIC_EMAILS.map((e) => ({
    ...e,
    date: new Date(e.date.getTime()),
  }));
}

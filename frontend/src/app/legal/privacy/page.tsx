import type { Metadata } from 'next';
import { LegalPage } from '../_components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy — SkinTrackr',
  description:
    'How SkinTrackr collects, uses, and protects your personal data under GDPR.',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" lastUpdated="2026-05-20">
      <p>
        This Privacy Policy describes how SkinTrackr UG (i.G.) (&quot;SkinTrackr&quot;,
        &quot;we&quot;, &quot;us&quot;) collects, uses, and shares personal data when you use
        skintrackr.io and the related services (the &quot;Service&quot;). We are the data
        controller within the meaning of the EU General Data Protection Regulation (GDPR).
      </p>

      <h2>1. Who we are</h2>
      <p>
        SkinTrackr UG (i.G.) is a company being incorporated in Germany. You can reach us at{' '}
        <a href="mailto:arthur@skintrackr.io">arthur@skintrackr.io</a> for any privacy-related
        request.
      </p>

      <h2>2. What data we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> email address and Clerk user ID created when you sign
          up. We never see or store your password — authentication is handled by Clerk.
        </li>
        <li>
          <strong>Profile preferences:</strong> display name, preferred currency, theme, and
          notification settings.
        </li>
        <li>
          <strong>Portfolio data:</strong> the skins, prices, quantities, and notes you
          voluntarily enter into your portfolio and watchlists.
        </li>
        <li>
          <strong>Subscription data:</strong> tier (Free, Lite, Pro), billing cycle, and
          subscription status. Payment details (card numbers, billing address) are processed
          and stored by Stripe — we only receive a customer ID and a status flag.
        </li>
        <li>
          <strong>Steam account link (optional):</strong> if you connect your Steam account,
          we store your public Steam ID. We do not access your Steam inventory, friends list,
          or private profile data.
        </li>
        <li>
          <strong>Technical data:</strong> IP address, user agent, request timestamps, and
          basic request metadata used for rate limiting, abuse prevention, and debugging.
        </li>
        <li>
          <strong>Communications:</strong> emails you send us and our replies.
        </li>
      </ul>

      <h2>3. Why we process your data (legal basis)</h2>
      <ul>
        <li>
          <strong>Service operation (Art. 6(1)(b) GDPR — contract performance):</strong>
          account management, authentication, portfolio storage, price calculations,
          subscription billing, and alert delivery.
        </li>
        <li>
          <strong>Legitimate interest (Art. 6(1)(f) GDPR):</strong> security monitoring, rate
          limiting, fraud prevention, debugging, and improving the Service. Our interest is in
          running a secure, reliable product; this is balanced against your interest in
          minimal data processing.
        </li>
        <li>
          <strong>Legal obligation (Art. 6(1)(c) GDPR):</strong> tax records, invoice
          retention, and responding to lawful authority requests.
        </li>
        <li>
          <strong>Consent (Art. 6(1)(a) GDPR):</strong> optional analytics cookies and
          marketing emails, where applicable. You can withdraw consent at any time.
        </li>
      </ul>

      <h2>4. Third-party processors</h2>
      <p>
        We rely on the following processors to operate the Service. Each is bound by a Data
        Processing Agreement under Art. 28 GDPR.
      </p>
      <ul>
        <li>
          <strong>Clerk</strong> (Clerk.com, Inc., USA) — authentication, identity, session
          management. Standard Contractual Clauses apply for international transfers.
        </li>
        <li>
          <strong>Stripe</strong> (Stripe Payments Europe, Ltd., Ireland) — subscription
          billing and payment processing.
        </li>
        <li>
          <strong>Steam / Valve</strong> (Valve Corporation, USA) — only invoked if you
          explicitly connect your Steam account via OpenID. Only public profile data is read.
        </li>
        <li>
          <strong>Resend</strong> (or an equivalent transactional email provider) — delivering
          account emails and price alerts.
        </li>
        <li>
          <strong>Vercel</strong> (Vercel, Inc., USA) — hosting the frontend and serverless
          functions. Region: Frankfurt (fra1) where possible.
        </li>
        <li>
          <strong>Supabase</strong> (Supabase, Inc.) — managed PostgreSQL database hosting in
          the EU.
        </li>
        <li>
          <strong>Inngest</strong> (Inngest, Inc., USA) — background job orchestration for
          price refreshes and alert dispatch.
        </li>
        <li>
          <strong>PostHog</strong> — product analytics (only loaded after you accept analytics
          cookies).
        </li>
        <li>
          <strong>Sentry</strong> — error monitoring and crash reporting (IP addresses are
          truncated; PII scrubbing is enabled).
        </li>
        <li>
          <strong>Skinport, CSFloat</strong> and similar marketplace APIs — outbound requests
          only. We send no personal data; we only fetch public price information.
        </li>
      </ul>

      <h2>5. Cookies</h2>
      <p>
        By default we set only essential cookies needed for authentication and security (e.g.
        Clerk session cookies, CSRF tokens). Optional analytics cookies (PostHog) are only
        loaded after you give consent through our cookie banner. You can withdraw consent at
        any time via the &quot;Cookies&quot; link in the footer.
      </p>

      <h2>6. How long we keep your data</h2>
      <ul>
        <li>
          <strong>Account data:</strong> for as long as your subscription or free account is
          active, plus 90 days after cancellation to handle reactivations and refunds.
        </li>
        <li>
          <strong>Billing records:</strong> 10 years, as required by German tax law (§ 147
          AO).
        </li>
        <li>
          <strong>Server logs:</strong> 30 days, then deleted or anonymised.
        </li>
        <li>
          <strong>Support emails:</strong> up to 2 years from the last interaction.
        </li>
      </ul>

      <h2>7. Your rights</h2>
      <p>Under GDPR, you have the right to:</p>
      <ul>
        <li>access the personal data we hold about you (Art. 15);</li>
        <li>have inaccurate data corrected (Art. 16);</li>
        <li>request deletion of your data (Art. 17 — &quot;right to be forgotten&quot;);</li>
        <li>restrict processing (Art. 18);</li>
        <li>receive your data in a portable format (Art. 20);</li>
        <li>object to processing based on legitimate interest (Art. 21);</li>
        <li>withdraw consent at any time, without affecting prior lawful processing.</li>
      </ul>
      <p>
        To exercise any of these rights, email{' '}
        <a href="mailto:arthur@skintrackr.io">arthur@skintrackr.io</a>. We will respond
        within one month.
      </p>
      <p>
        You also have the right to lodge a complaint with a supervisory authority. In
        Germany, that is the Federal Commissioner for Data Protection and Freedom of
        Information (BfDI). You may also contact your local state Data Protection Authority
        or the authority in the EU country where you live or work.
      </p>

      <h2>8. International transfers</h2>
      <p>
        Where data is transferred outside the EU/EEA (mainly to US-based processors such as
        Clerk, Stripe, Vercel, Sentry, PostHog), we rely on Standard Contractual Clauses
        approved by the European Commission and on the EU-US Data Privacy Framework where
        applicable.
      </p>

      <h2>9. Security</h2>
      <p>
        We use TLS encryption for all traffic, hash and salt all credentials via Clerk,
        restrict database access via least-privilege roles, and monitor for anomalies. No
        system is perfectly secure; we encourage you to use a strong unique password and
        enable multi-factor authentication on your Clerk account.
      </p>

      <h2>10. Children</h2>
      <p>
        The Service is not intended for users under 16. We do not knowingly collect data from
        anyone under 16. If you believe a child has provided us with personal data, please
        contact us and we will delete it.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes will be
        announced by email at least 30 days before they take effect. The &quot;Last
        updated&quot; date at the top of this page indicates the most recent revision.
      </p>

      <h2>12. Contact</h2>
      <p>
        SkinTrackr UG (i.G.)
        <br />
        Email: <a href="mailto:arthur@skintrackr.io">arthur@skintrackr.io</a>
      </p>
    </LegalPage>
  );
}

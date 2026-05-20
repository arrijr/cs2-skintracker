import type { Metadata } from 'next';
import { LegalPage } from '../_components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service — SkinTrackr',
  description: 'The terms that govern your use of SkinTrackr.',
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Service" lastUpdated="2026-05-20">
      <p>
        These Terms of Service (the &quot;Terms&quot;) form a contract between you and
        SkinTrackr UG (i.G.) (&quot;SkinTrackr&quot;, &quot;we&quot;, &quot;us&quot;)
        governing your use of skintrackr.io and the related services (the
        &quot;Service&quot;). By creating an account or otherwise using the Service, you
        agree to these Terms.
      </p>

      <h2>1. Eligibility and accounts</h2>
      <p>
        You must be at least 16 years old to use the Service. Authentication is provided
        through Clerk; you are responsible for keeping your credentials secure and for all
        activity that occurs under your account. Notify us promptly at{' '}
        <a href="mailto:arthur@skintrackr.io">arthur@skintrackr.io</a> if you suspect any
        unauthorised access.
      </p>

      <h2>2. What the Service is — and is not</h2>
      <p>
        SkinTrackr aggregates publicly available Counter-Strike 2 skin pricing data from
        third-party marketplaces and lets you track a personal portfolio, build watchlists,
        and receive price alerts. We make a reasonable effort to keep data accurate but we
        cannot guarantee its completeness, timeliness, or correctness.
      </p>
      <p>
        <strong>The Service is not financial advice.</strong> Prices, trends, volatility
        estimates, rarity heuristics, and any other analytics are informational only.
        Decisions to buy, sell, or hold any item are entirely your own. Price alerts are
        delivered on a best-effort basis and are not guaranteed to arrive on time or at all.
      </p>

      <h2>3. Subscriptions and billing</h2>
      <ul>
        <li>
          <strong>Plans:</strong> we offer a Free tier, a Lite tier (€6.99/month or
          €67/year), and a Pro tier (€9.99/month or €96/year). Annual plans include
          approximately a 20% discount versus monthly billing.
        </li>
        <li>
          <strong>Auto-renewal:</strong> paid subscriptions automatically renew at the end
          of each billing period unless you cancel before renewal.
        </li>
        <li>
          <strong>Cancellation:</strong> you can cancel at any time from your billing
          settings. Cancellation takes effect at the end of the current billing period —
          you keep access until then.
        </li>
        <li>
          <strong>Refunds:</strong> see our <a href="/legal/refund">Refund Policy</a> for
          the 14-day money-back window. Outside that window, we do not pro-rate or refund
          partial periods.
        </li>
        <li>
          <strong>Price changes:</strong> we may change subscription prices with at least
          30 days&apos; notice by email; changes take effect at your next renewal.
        </li>
        <li>
          <strong>Taxes:</strong> prices are shown excluding VAT where applicable. VAT is
          calculated and collected by Stripe according to your billing country.
        </li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          scrape, crawl, or otherwise bulk-extract data from the Service except via the
          published API within the rate limits of your plan;
        </li>
        <li>use bots, headless browsers, or scripts to inflate usage or evade limits;</li>
        <li>
          attempt to reverse engineer, decompile, or probe the Service for vulnerabilities
          except via a coordinated disclosure to{' '}
          <a href="mailto:arthur@skintrackr.io">arthur@skintrackr.io</a>;
        </li>
        <li>
          resell, sublicense, or redistribute SkinTrackr data, paid features, or API
          access without our written permission;
        </li>
        <li>
          upload content that is unlawful, infringing, defamatory, or that contains
          malware;
        </li>
        <li>
          impersonate another person or misrepresent your affiliation with anyone.
        </li>
      </ul>
      <p>
        Fair-use rate limits apply to every plan. We may throttle, suspend, or terminate
        accounts that materially exceed those limits or that abuse the Service.
      </p>

      <h2>5. Intellectual property</h2>
      <p>
        SkinTrackr, its source code, design, branding, dashboards, and aggregated analytics
        are owned by SkinTrackr UG (i.G.) and protected by intellectual property law. We
        grant you a limited, non-exclusive, non-transferable, revocable licence to use the
        Service for its intended purpose.
      </p>
      <p>
        You retain ownership of the portfolio entries, notes, and other content you upload
        (&quot;User Content&quot;). You grant us a worldwide, royalty-free licence to host,
        store, and process User Content solely as needed to operate the Service for you.
      </p>

      <h2>6. Third-party content and disclaimers</h2>
      <p>
        Price data is sourced from marketplaces such as the Steam Community Market,
        Skinport, and CSFloat. SkinTrackr is an independent product and is{' '}
        <strong>not affiliated with, endorsed by, or sponsored by Valve Corporation</strong>,
        the operators of Counter-Strike 2, or any third-party marketplace. All trademarks,
        item names, and imagery referencing Counter-Strike 2 belong to their respective
        owners.
      </p>
      <p>
        The Service is provided &quot;as is&quot; and &quot;as available&quot;. To the
        maximum extent permitted by law, we disclaim all implied warranties of
        merchantability, fitness for a particular purpose, and non-infringement.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, SkinTrackr&apos;s total aggregate liability
        for any claim arising out of or relating to the Service is capped at the amount you
        paid to SkinTrackr in the twelve (12) months preceding the event giving rise to the
        claim, or €100 if you have not paid us anything in that period.
      </p>
      <p>
        We are not liable for indirect, incidental, consequential, special, or punitive
        damages, or for lost profits, lost data, or trading losses, even if we have been
        advised of the possibility. Nothing in these Terms limits liability that cannot be
        excluded under mandatory German or EU law, including liability for intent or gross
        negligence and under the Product Liability Act (ProdHaftG).
      </p>

      <h2>8. Termination</h2>
      <p>
        You may delete your account at any time from your settings. We may suspend or
        terminate your access with reasonable notice for material breach of these Terms or
        immediately if your use of the Service poses a security, legal, or operational
        risk. On termination, your access ends; portions of these Terms that by their
        nature should survive (IP, disclaimers, liability cap, governing law) will
        continue to apply.
      </p>

      <h2>9. Changes to the Terms</h2>
      <p>
        We may update these Terms from time to time. We will notify you of material changes
        by email at least 30 days before they take effect. Continued use of the Service
        after the effective date constitutes acceptance of the updated Terms. If you do not
        accept the changes, you may cancel your subscription and stop using the Service
        before the effective date.
      </p>

      <h2>10. Governing law and venue</h2>
      <p>
        These Terms are governed by the laws of the Federal Republic of Germany, excluding
        its conflict-of-laws rules and the UN Convention on Contracts for the International
        Sale of Goods. The exclusive place of jurisdiction for disputes with merchants is
        the registered seat of SkinTrackr UG (i.G.). Consumers retain the protection of
        mandatory law in their country of residence.
      </p>
      <p>
        The European Commission provides an Online Dispute Resolution platform at{' '}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr
        </a>
        . We are not obliged to participate in dispute-resolution proceedings before a
        consumer arbitration board.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms? Email{' '}
        <a href="mailto:arthur@skintrackr.io">arthur@skintrackr.io</a>.
      </p>
    </LegalPage>
  );
}

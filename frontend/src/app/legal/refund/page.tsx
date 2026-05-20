import type { Metadata } from 'next';
import { LegalPage } from '../_components/LegalPage';

export const metadata: Metadata = {
  title: 'Refund Policy — SkinTrackr',
  description: 'Our 14-day money-back guarantee and how to request a refund.',
};

export default function RefundPolicyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Refund Policy" lastUpdated="2026-05-20">
      <p>
        We want you to be happy with SkinTrackr. This Refund Policy explains when and how
        you can get your money back. It supplements the{' '}
        <a href="/legal/terms">Terms of Service</a> and forms part of your contract with
        SkinTrackr UG (i.G.).
      </p>

      <h2>1. The 14-day money-back guarantee</h2>
      <p>
        If you are not satisfied with your <strong>first</strong> SkinTrackr subscription,
        you may request a full refund within <strong>14 days of the initial charge</strong>
        — no questions asked. This applies to both monthly and annual plans on Lite and
        Pro tiers.
      </p>
      <p>
        The 14-day window is independent from your statutory right of withdrawal under
        German consumer law (§ 355 BGB) and the EU Consumer Rights Directive: where that
        right applies, you keep it in full and it runs alongside this policy. By starting
        to use the Service during the withdrawal period you do not waive your statutory
        rights.
      </p>

      <h2>2. What is not refundable</h2>
      <ul>
        <li>
          <strong>Renewals.</strong> Auto-renewal charges (the second month, the second
          year, and so on) are not refundable. Cancel before renewal to avoid the next
          charge.
        </li>
        <li>
          <strong>Partial periods.</strong> We do not pro-rate refunds for unused time
          within a billing period. When you cancel, you keep access until the end of the
          period you already paid for.
        </li>
        <li>
          <strong>Abuse.</strong> Refunds may be refused for accounts that violated the
          Terms of Service, exceeded fair-use limits, or that show signs of refund abuse
          (e.g. repeatedly subscribing and refunding).
        </li>
      </ul>

      <h2>3. Cancelling your subscription</h2>
      <p>
        You can cancel at any time from your billing settings on the Service. Cancellation
        takes effect at the end of the current billing period — you keep all paid features
        until that date and you will not be charged again. No action is required from us
        to process a cancellation.
      </p>

      <h2>4. How to request a refund</h2>
      <p>To request a refund under the 14-day guarantee, email us with:</p>
      <ul>
        <li>
          the email address on your SkinTrackr account, and
        </li>
        <li>
          your Stripe subscription ID or the date of the charge (you can find this on the
          receipt Stripe emailed you).
        </li>
      </ul>
      <p>
        Send the request to <a href="mailto:arthur@skintrackr.io">arthur@skintrackr.io</a>{' '}
        with the subject line &quot;Refund request&quot;. You do not need to give a reason
        — though feedback helps us improve.
      </p>

      <h2>5. Processing time</h2>
      <p>
        Approved refunds are issued through Stripe back to the original payment method
        within <strong>5–10 business days</strong>. Depending on your bank or card
        issuer, the credit may take a few additional days to appear on your statement. We
        will email you when the refund has been initiated.
      </p>

      <h2>6. Currency and fees</h2>
      <p>
        Refunds are issued in the same currency you were charged in. Any currency
        conversion losses, foreign-exchange fees, or card-issuer fees are not reimbursable
        by SkinTrackr and remain between you and your payment provider.
      </p>

      <h2>7. Disputes</h2>
      <p>
        If you believe a charge is incorrect or unauthorised, please contact us first at{' '}
        <a href="mailto:arthur@skintrackr.io">arthur@skintrackr.io</a> — we&apos;ll
        usually resolve it within one business day. Initiating a chargeback before
        contacting us may trigger an automatic account suspension while the dispute is
        investigated.
      </p>

      <h2>8. Contact</h2>
      <p>
        Questions about this policy? Email{' '}
        <a href="mailto:arthur@skintrackr.io">arthur@skintrackr.io</a>.
      </p>
    </LegalPage>
  );
}

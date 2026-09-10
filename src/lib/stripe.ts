import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/**
 * Lazily-initialized, server-only Stripe client. Import this only in Server
 * Components, Server Actions, and Route Handlers — never in Client Components.
 */
export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeClient;
}

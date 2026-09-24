import createClient from "openapi-fetch";
import type { paths } from "@/core/api/schema";

interface PasargadClientOptions {
  jwt?: string;
  tenantId?: string;
}

/**
 * Typed pasargad-core API client. Auth/tenant headers are injected via
 * request middleware only when the corresponding option is provided, so a
 * signed-out or tenant-less caller still gets a valid client.
 */
export function createPasargadClient(options: PasargadClientOptions = {}) {
  const client = createClient<paths>({
    baseUrl: process.env.PASARGAD_API_URL ?? "http://localhost:8000",
  });

  client.use({
    onRequest({ request }) {
      if (options.jwt) {
        request.headers.set("Authorization", `Bearer ${options.jwt}`);
      }
      if (options.tenantId) {
        request.headers.set("X-Tenant-ID", options.tenantId);
      }
      return request;
    },
  });

  return client;
}

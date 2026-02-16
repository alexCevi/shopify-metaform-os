import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

// Bootstrap: allow deploy without SHOPIFY_APP_URL so the host (e.g. DigitalOcean) can assign
// a default URL. Once the app is live, set SHOPIFY_APP_URL to that URL and redeploy.
const appUrl =
  process.env.SHOPIFY_APP_URL?.trim() ||
  (process.env.NODE_ENV === "production"
    ? "YOUR_APP_URL"
    : "");

if (process.env.NODE_ENV === "production" && !process.env.SHOPIFY_APP_URL?.trim()) {
  console.warn(
    "[MetaForm] SHOPIFY_APP_URL is not set. Using bootstrap placeholder so the app can deploy. After the app is live, set SHOPIFY_APP_URL in your host's env vars to the real app URL (e.g. from DigitalOcean → your app → Live App / Domains), then set the same URL as App URL in the Shopify Partner Dashboard, and redeploy."
  );
}

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;

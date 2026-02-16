import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>MetaForm</h1>
        <p className={styles.text}>
          Config-as-code for Shopify metafield and metaobject definitions.
          Push, pull, and promote definitions across stores via GitHub.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Push definitions to GitHub</strong>. Snapshot your store's
            metafield and metaobject definitions and commit them to a branch.
          </li>
          <li>
            <strong>Sync data from source</strong>. Preview changes and
            apply definitions from a configured source environment to your store with a diff preview.
          </li>
          <li>
            <strong>Promote via Pull Requests</strong>. Move definitions between
            branches and stores using GitHub's native PR workflow.
          </li>
        </ul>
      </div>
    </div>
  );
}

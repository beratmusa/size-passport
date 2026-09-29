import { redirect, Form, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  let shop = url.searchParams.get("shop");

  if (!shop) {
    const cookieHeader = request.headers.get("Cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/billing_shop=([^;]+)/);
      if (match) {
        shop = match[1];
      }
    }
  }

  const isEmbedded = url.searchParams.get("embedded") === "1";

  if (isEmbedded && shop) {
    // Zaten iframe içindeyiz, uygulamanın asıl rotasına yönlendir.
    url.searchParams.set("shop", shop);
    throw redirect(`/app?${url.searchParams.toString()}`);
  } else if (shop) {
    // İframe dışındayız (Ödeme onayından veya dışarıdan gelindi). Admin paneline yönlendirerek re-embed yap.
    const shopHandle = shop.replace(".myshopify.com", "");
    const appHandle = process.env.SHOPIFY_APP_HANDLE || "size-passport";
    throw redirect(`https://admin.shopify.com/store/${shopHandle}/apps/${appHandle}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>A short heading about [your app]</h1>
        <p className={styles.text}>
          A tagline about [your app] that describes your value proposition.
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
            <strong>Product feature</strong>. Some detail about your feature and
            its benefit to your customer.
          </li>
          <li>
            <strong>Product feature</strong>. Some detail about your feature and
            its benefit to your customer.
          </li>
          <li>
            <strong>Product feature</strong>. Some detail about your feature and
            its benefit to your customer.
          </li>
        </ul>
      </div>
    </div>
  );
}

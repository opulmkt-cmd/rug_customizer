type ShopifyGraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export async function shopifyStorefront<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const store = requireEnv('SHOPIFY_STORE_DOMAIN');
  const version = requireEnv('SHOPIFY_STOREFRONT_API_VERSION');
  const token = requireEnv('SHOPIFY_STOREFRONT_ACCESS_TOKEN');

  const res = await fetch(`https://${store}/api/${version}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await res.json()) as ShopifyGraphQLResponse<T>;

  if (!res.ok || json.errors?.length) {
    throw new Error(
      json.errors?.map((e) => e.message).join(', ') ||
        `Storefront API failed with ${res.status}`
    );
  }

  if (!json.data) throw new Error('Missing Shopify Storefront data');
  return json.data;
}

export async function shopifyAdmin<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const store = requireEnv('SHOPIFY_STORE_DOMAIN');
  const version = requireEnv('SHOPIFY_ADMIN_API_VERSION');
  const token = requireEnv('SHOPIFY_ADMIN_ACCESS_TOKEN');

  const res = await fetch(`https://${store}/admin/api/${version}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await res.json()) as ShopifyGraphQLResponse<T>;

  if (!res.ok || json.errors?.length) {
    throw new Error(
      json.errors?.map((e) => e.message).join(', ') ||
        `Admin API failed with ${res.status}`
    );
  }

  if (!json.data) throw new Error('Missing Shopify Admin data');
  return json.data;
}

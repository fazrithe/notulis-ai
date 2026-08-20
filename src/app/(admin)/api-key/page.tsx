import { listApiKeys } from "@/lib/db/store";
import { maskApiKey } from "@/lib/utils";
import { ApiKeyBoard } from "@/components/api-key/api-key-board";

export default async function ApiKeyPage() {
  const apiKeys = (await listApiKeys()).map((k) => ({ ...k, apiKey: maskApiKey(k.apiKey) }));
  return <ApiKeyBoard apiKeys={apiKeys} />;
}

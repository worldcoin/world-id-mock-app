import type { ApprovalRequestMetadata } from "@/types/metadata";
import type { WalletConnectRequest } from "./init-walletconnect";

export async function fetchApprovalRequestMetadata(
  request: WalletConnectRequest,
): Promise<Partial<ApprovalRequestMetadata>> {
  const [{ action_id, app_name, signal_description }] = request.params;
  const meta: Partial<ApprovalRequestMetadata> = {
    action_id,
    project_name: app_name,
    description: signal_description,
  };

  try {
    const req = await fetch(
      "https://gist.githubusercontent.com/paolodamico/82109c72601d80ba3bf04ba6da1469a5/raw/worldid-dev-metadata.json",
      {
        redirect: "follow",
        // current gist does not support passing credentials https://stackoverflow.com/questions/8074665/cross-origin-resource-sharing-with-credentials
        //  credentials: "include"
      },
    );
    if (!req.ok)
      throw new TypeError(
        `Failed to fetch metadata service: ${req.statusText}`,
      );
    const content = (await req.json()) as Record<string, unknown>;
    if (!(action_id in content)) {
      console.info(`"${action_id}" not found as a verified action.`);
      return meta;
    }
    Object.assign(meta, content[action_id]);
    meta.validated = true;
  } catch (err) {
    console.error(err);
  }
  return meta;
}

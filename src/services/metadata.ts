import type { MetadataRequest, MetadataResponse } from "@/types";

const DEV_PORTAL_PRECHECK_URL =
  "https://developer.worldcoin.org/api/v1/precheck/";

async function precheckAction(
  request: MetadataRequest,
): Promise<MetadataResponse | null> {
  const url = new URL(request.app_id, DEV_PORTAL_PRECHECK_URL);
  const body = {
    action: request.action,
    nullifier_hash: request.nullifier_hash,
    external_nullifier: request.external_nullifier,
  };

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok && response.status === 404) {
      console.warn("Action is not registered in the Developer Portal");
      return null;
    } else if (!response.ok) {
      throw new Error(
        `Unable to fetch metadata, ${response.status}: ${response.statusText}`,
      );
    }

    return (await response.json()) as MetadataResponse;
  } catch (error) {
    console.error(`Error fetching metadata, ${error}`);
  }
  return null;
}

export async function fetchMetadata(
  request: MetadataRequest,
): Promise<Partial<MetadataResponse>> {
  let metadata: Partial<MetadataResponse> = {
    id: request.app_id,
    action: {
      description: request.action_description,
    },
  };

  const response = await precheckAction(request);
  if (response) {
    metadata = {
      ...metadata,
      ...response,
    };
  }
  return metadata;
}

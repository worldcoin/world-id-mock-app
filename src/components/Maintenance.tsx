import { SERVICE_STATUS_URL } from "@/lib/constants";
import type { ServiceStatusResponse } from "@/types";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

export default function Maintenance() {
  const [visible, setVisible] = useState(false);

  const checkStatus = async () => {
    try {
      const response = await fetch(SERVICE_STATUS_URL, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const { services } = (await response.json()) as ServiceStatusResponse;
      const sdkStagingNetwork = services.find(
        (service) => service.name === "SDK Staging Network",
      );

      if (sdkStagingNetwork?.status !== "ok") {
        setVisible(true);
      }
    } catch (error) {
      console.error("Unable to check the staging service status.");
      setVisible(true);
    }
  };

  // On initial load, check the status of the staging services
  useEffect(() => {
    void checkStatus();
  }, []);

  return (
    <a
      href="https://status.worldcoin.org"
      className={clsx("absolute inset-4", { hidden: !visible })}
    >
      <div className="mt-10 flex items-center rounded-24 border border-gray-200 bg-gray-0 p-4 xs:mt-20">
        <Icon
          name="warning"
          className="h-5 w-5 text-gray-0"
          bgClassName="bg-warning-700 h-8 w-8 rounded-full shrink-0"
        />
        <div className="ml-4 flex flex-col">
          <h3 className="font-rubik text-s2">Under maintenance</h3>
          <p className="mt-1 text-b3">
            Some features of the App are under maintenance. Functionality will
            be back to normal soon.
          </p>
        </div>
      </div>
    </a>
  );
}

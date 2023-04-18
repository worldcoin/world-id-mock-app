import Button from "@/common/Button/Button";
import { Icon } from "@/common/Icon";
import Typography from "@/common/Typography/Typography";
import { useIdentityStorage } from "@/common/hooks/use-identity-storage";
import { inclusionProof } from "@/lib/sequencer-service";
import { Phase } from "@/types/common";
import type { Identity as IdentityType } from "@/types/identity";
import spinnerSvg from "@static/spinner.svg";
import { utils } from "@worldcoin/id";
import { Strategy, ZkIdentity } from "@zk-kit/identity";
import cn from "classnames";
import { useModal } from "connectkit";
import React from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { encodeIdentityCommitment } from "../Identity/Identity";
import { Cards } from "./Cards/Cards";
import { Signature } from "./Signature/Signature";

const Initial = React.memo(function Initial(props: {
  phase: Phase;
  setPhase: React.Dispatch<React.SetStateAction<Phase>>;
  className?: string;
  identity: IdentityType;
  setIdentity: React.Dispatch<React.SetStateAction<IdentityType>>;
}) {
  const { storeIdentity } = useIdentityStorage();
  const { setOpen: setConnectModalOpen } = useModal();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect({
    onSuccess: () => {
      props.setPhase(Phase.Initial);
    },
  });
  const { signMessage } = useSignMessage({
    message: "Signature request to generate seed for World ID identity.",
    onSuccess: (signature) => {
      const identitySeed = utils.keccak256(signature);
      return updateIdentity(new ZkIdentity(Strategy.MESSAGE, identitySeed));
    },
    onError: (error) => {
      console.error("Error while connecting to identity wallet:", error);
    },
  });

  const updateIdentity = React.useCallback(
    async (newIdentity: ZkIdentity) => {
      const commitment = newIdentity.genIdentityCommitment();
      const trapdoor = newIdentity.getTrapdoor();
      const nullifier = newIdentity.getNullifier();

      const encodedCommitment = encodeIdentityCommitment(commitment);

      const id = encodedCommitment.slice(0, 10);
      let verified = false;
      let proof: IdentityType["inclusionProof"] = null;

      try {
        proof = await inclusionProof(encodedCommitment);
        verified = true;
      } catch (err) {
        console.warn(err);
      }

      const extendedIdentity: IdentityType = {
        ...props.identity,
        commitment,
        trapdoor,
        nullifier,
        id,
        verified,
        inclusionProof: proof,
      };

      props.setIdentity(extendedIdentity);
      storeIdentity({ ZkIdentity: newIdentity, id });
      props.setPhase(Phase.Identity);
    },
    [props, storeIdentity],
  );

  React.useEffect(() => {
    if (!isConnected) return;

    signMessage();
  }, [isConnected, signMessage]);

  const connectWallet = React.useCallback(() => {
    if (!isConnected) setConnectModalOpen(true);
  }, [isConnected, setConnectModalOpen]);

  const createIdentity = () => {
    const identity = new ZkIdentity(Strategy.RANDOM);
    updateIdentity(identity)
      .then(() => console.log("identity updated"))
      .catch((err) => console.log(err));
  };

  const goBack = React.useCallback(() => {
    if (!isConnected) {
      return console.error("Provider was not created");
    }
    disconnect();
  }, [disconnect, isConnected]);

  return (
    <div
      className={cn(
        "grid content-between gap-y-14 px-2 pb-6 xs:pb-0",
        props.className,
      )}
    >
      <div className={cn("grid")}>
        <Typography
          className="z-10 text-center text-gray-900 dark:text-ffffff"
          variant="h2"
        >
          {props.phase === Phase.Initial && "World ID simulator"}
          {props.phase === Phase.Signature && "Confirm the signature request"}
        </Typography>

        {props.phase === Phase.Initial && <Cards />}
        {props.phase === Phase.Signature && <Signature />}
      </div>

      <div className="grid justify-items-center gap-y-4">
        <Button
          variant="primary"
          fullWidth
          onClick={props.phase === Phase.Initial ? connectWallet : () => null}
          type="button"
          isDisabled={props.phase === Phase.Signature}
        >
          {props.phase === Phase.Initial && "Connect Wallet"}
          {props.phase === Phase.Signature && (
            <Icon
              data={spinnerSvg}
              className="pointer-events-none mx-auto h-6 w-6 animate-spin justify-self-center text-ffffff"
            />
          )}
        </Button>

        <Button
          variant="secondary"
          fullWidth
        >
          Verify with Phone Number
        </Button>

        <Button
          className="h-10"
          fullWidth
          onClick={
            {
              [`${Phase.Initial}`]: createIdentity,
              [`${Phase.Signature}`]: goBack,
            }[props.phase]
          }
        >
          {props.phase === Phase.Initial && "Create temporary identity"}
          {props.phase === Phase.Signature && "Cancel"}
        </Button>
      </div>
    </div>
  );
});

export default Initial;

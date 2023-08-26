import Button from "@/components/Button";
import useIdentity from "@/hooks/useIdentity";
import { cn } from "@/lib/utils";
import { validateWorldIDQRCode } from "@/lib/validation";
import { useModalStore } from "@/stores/modalStore";
import { memo, useEffect, useMemo, useState } from "react";
import { Dialog } from "../Dialog";
import { Input } from "../Input";

export const QRInput = memo(function QRInput(props: {
  open: boolean;
  onClose: () => void;
  performVerification: (uri: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  useIdentity();
  const { open } = useModalStore();

  const isTextInvalidQRInput = (uri: string) => {
    if (!uri) return false;
    return !validateWorldIDQRCode(uri);
  };

  const isInvalid = useMemo(() => {
    return isTextInvalidQRInput(value);
  }, [value]);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const data = event.target.value;
    if (data || data === "") setValue(data);
  };

  const handleSubmit = async (
    event:
      | React.MouseEvent<HTMLAnchorElement | HTMLButtonElement, MouseEvent>
      | undefined,
  ) => {
    if (event) event.preventDefault();
    await props.performVerification(value);
  };

  // Close input once modal opens
  useEffect(() => {
    if (open) {
      props.onClose();
    }
  }, [open, props]);

  // Clear input once dialog is closed
  useEffect(() => {
    if (!props.open) {
      setValue("");
    }
  }, [props.open]);

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      closeIcon="direction-left"
    >
      <div className="mt-24 py-3 text-center font-sora text-h2">
        Enter or paste
        <br />
        QR code
      </div>

      <div className="mt-4 text-center text-b1 text-gray-500">
        Tap the IDKit QR code to copy it to your clipboard, then paste it below.
      </div>

      <Input
        className="mt-8"
        placeholder="QR code"
        invalid={isInvalid}
        value={value}
        onChange={(e) => void handleChange(e)}
        renderButton={({ isEmpty, isFocused, isInvalid }) => (
          <>
            <button
              className={cn("h-10 rounded-10 px-3 text-12 font-medium", {
                "bg-white": !isInvalid && !isFocused,
                "bg-gray-100": !isInvalid && isFocused,
                "text-gray-500": !isInvalid,
                "bg-error-700 text-white": isInvalid,
              })}
              onClick={() => {
                if (isEmpty) {
                  navigator.clipboard.readText().then(
                    (text) => {
                      setValue(text);
                    },
                    (error) => {
                      console.error(error);
                    },
                  );
                } else {
                  setValue("");
                }
              }}
            >
              {isEmpty && "PASTE"}
              {!isEmpty && "CLEAR"}
            </button>
          </>
        )}
      />

      {isInvalid && (
        <div className="mt-2 text-b3 text-error-700">
          The QR code is not valid
        </div>
      )}

      <Button
        type="submit"
        className="mt-8 h-14 w-full bg-gray-900 text-white disabled:bg-gray-100 disabled:text-gray-300"
        isDisabled={isInvalid || !value}
        onClick={(e) => void handleSubmit(e)}
      >
        Submit
      </Button>
    </Dialog>
  );
});

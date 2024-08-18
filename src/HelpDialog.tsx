import { PropsWithChildren, useRef } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";

export type HelpDialogProps = {
  onDismiss: () => void,
  open: boolean,
}

export default function HelpDialog(props: PropsWithChildren<HelpDialogProps>) {
  const ref = useRef<HTMLElement>(null);

  const handleDismiss = () => {
    props.onDismiss();
  };

  return (
    <Dialog onClose={handleDismiss} open={props.open}>
      <DialogTitle>How to Play</DialogTitle>
      <DialogContent ref={ref}>
        {props.children}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDismiss}>
          Dismiss
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useState } from "react";
import { IconButton } from "@mui/material";

type MousePosition = {
  mouseX: number;
  mouseY: number;
};

export type GameMenuProps = {
  items: { title: string, action: () => void }[]
};

export default function GameMenuProps(
  props: GameMenuProps
) {
  const [contextMenu, setContextMenu] = useState<MousePosition | null>(null);
  const handleContextMenu: React.MouseEventHandler<HTMLSpanElement> = (event) => {
    setContextMenu(
      contextMenu === null
        ? {
          mouseX: event.clientX + 2,
          mouseY: event.clientY - 6,
        }
        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
        // Other native context menus might behave different.
        // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
        null,
    );
  };
  const handleClose = () => {
    setContextMenu(null);
  };

  return <>
    <IconButton onClick={handleContextMenu}><MoreHorizIcon /></IconButton>
    <Menu
      open={contextMenu !== null}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
    >
      {props.items.map(item => (<MenuItem key={item.title} onClick={() => { item.action(); handleClose() }}>
        <ListItemText>{item.title}</ListItemText>
      </MenuItem>))}
    </Menu>
  </>
}
import { TerminalCommandCenterScene } from "./TerminalCommandCenterScene";
import type { TerminalCommandCenterVariantId } from "./types";

export const TERMINAL_COMMAND_CENTER_COMPOSITION_ID = "TerminalCommandCenterFamilyReview";
export type TerminalCommandCenterPreviewProps = { sceneKey: TerminalCommandCenterVariantId };

export const TerminalCommandCenterPreview = ({ sceneKey }: TerminalCommandCenterPreviewProps) => (
  <TerminalCommandCenterScene sceneKey={sceneKey} />
);

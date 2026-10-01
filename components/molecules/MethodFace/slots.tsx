import { Landmark, Wallet } from "../../atoms/Icons";
import { NetworkMark } from "./NetworkMark";
import {
  AppTile,
  BlankRing,
  CardAside,
  CardNumber,
  Coin,
  EmvChip,
  Medallion,
  Memo,
  PayLine,
  Seal,
  SignatureLine,
} from "./ornaments";
import type { FaceKind, FaceSlots, FaceText } from "./types";

/**
 * What each kind prints in each slot. Only content lives here — positions,
 * sizes and type scale are FaceLayout's, the same for every kind. Every
 * element is a component with its own styles (see ornaments.tsx).
 */
export function slotsFor(kind: FaceKind, text: FaceText): FaceSlots {
  const { size, title, untitled, typeLabel, network, last4, currency } = text;
  const base = { title, muted: untitled, meta: typeLabel, corner: typeLabel };

  switch (kind) {
    case "card": {
      // "Debit card" → "Debit": the card itself only says which kind it is.
      const kindWord = typeLabel.replace(/ card$/i, "");
      return {
        ...base,
        meta: kindWord,
        corner: kindWord,
        emblem: <EmvChip size={size} />,
        aside: network || last4 ? <CardAside network={network} last4={last4} /> : undefined,
        detail: <CardNumber last4={last4} />,
        mark: network ? <NetworkMark network={network} size="md" /> : undefined,
      };
    }

    case "check":
      return {
        ...base,
        emblem: (
          <Seal size={size}>
            <Landmark size={size === "full" ? 20 : 18} />
          </Seal>
        ),
        aside: network ? <Memo size="compact" value={network} /> : undefined,
        detail: <PayLine />,
        footer: <Memo size="full" value={network ?? ""} />,
        mark: <SignatureLine />,
      };

    case "wallet": {
      const provider = network && network !== title ? network : undefined;
      const letter = (network || (untitled ? "" : title) || "•").charAt(0).toUpperCase();
      return {
        ...base,
        meta: provider ?? typeLabel,
        emblem: <AppTile size={size} letter={letter} />,
        footer: provider,
      };
    }

    case "crypto":
      return { ...base, emblem: <Coin size={size} /> };

    case "cash":
      return {
        ...base,
        emblem: <Medallion size={size} />,
        aside: currency,
        mark: currency,
      };

    case "ticket":
      return {
        ...base,
        emblem: (
          <Seal size={size}>
            <Wallet size={size === "full" ? 20 : 18} />
          </Seal>
        ),
      };

    case "blank":
      return {
        title: "New payment method",
        muted: false,
        meta: "Choose a type",
        footer: "Choose a type",
        emblem: <BlankRing size={size} />,
      };
  }
}

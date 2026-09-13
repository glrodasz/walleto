import { useEffect, useState } from "react";
import { gravatarUrl } from "../../helpers/gravatar";

interface Props {
  name: string;
  email?: string | null;
  size?: number;
}

/**
 * The person's Gravatar when they have one, falling back to their initial.
 * `gravatarUrl` asks Gravatar for a 404 instead of its default placeholder
 * for addresses with no avatar set, so the fallback is driven by the <img>
 * actually failing to load rather than guessed up front.
 */
export function Avatar({ name, email, size = 32 }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [email]);

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const src = email ? gravatarUrl(email, size * 2) : null;
  const showImage = Boolean(src) && !imageFailed;

  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- Gravatar is a remote host; no `next/image` remotePatterns configured yet.
        <img
          src={src ?? undefined}
          alt=""
          width={size}
          height={size}
          onError={() => setImageFailed(true)}
        />
      ) : (
        initial
      )}
      <style jsx>{`
        .avatar {
          flex-shrink: 0;
          border-radius: 50%;
          background: var(--accent);
          color: var(--on-accent);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          overflow: hidden;
        }

        .avatar :global(img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>
    </span>
  );
}

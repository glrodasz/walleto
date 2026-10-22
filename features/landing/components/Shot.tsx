import Image from "next/image";
import type { Language } from "../../../types";
import { LANDING_SHOTS, shotSrc } from "../data/shots";
import type { ShotId } from "../data/shots";

interface Props {
  id: ShotId;
  language: Language;
  alt: string;
  /** Hint for the browser's pick among the generated widths. */
  sizes: string;
  priority?: boolean;
  className?: string;
}

/**
 * A screenshot of the real app (Storybook's demo data), framed like a
 * window of glass.
 */
export function Shot({ id, language, alt, sizes, priority, className }: Props) {
  const { width, height } = LANDING_SHOTS[id];
  return (
    <figure className={`shot${className ? ` ${className}` : ""}`}>
      <Image
        src={shotSrc(id, language)}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
      />
      <style jsx>{`
        .shot {
          margin: 0;
          border-radius: var(--r-lg);
          overflow: hidden;
          border: 1px solid var(--glass-rim);
          box-shadow: var(--shadow-lg);
          background: var(--bg-0);
          line-height: 0;
        }

        .shot :global(img) {
          width: 100%;
          height: auto;
          display: block;
        }
      `}</style>
    </figure>
  );
}

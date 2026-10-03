import type { ReactNode } from "react";

/**
 * The fixed 320×200 box an intro scene is laid out on, so every piece can
 * be placed in px. Decorative: the slide's text says what the scene shows,
 * so the whole drawing is hidden from assistive tech.
 */
export function SceneCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="canvas" aria-hidden="true">
      {children}
      <style jsx>{`
        .canvas {
          position: relative;
          flex-shrink: 0;
          width: 320px;
          height: 200px;
        }

        /* Narrow phones: shrink the drawing rather than reflow it. */
        @media (max-width: 380px) {
          .canvas {
            transform: scale(0.86);
          }
        }
      `}</style>
    </div>
  );
}

import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathTextProps {
  math: string;
  display?: boolean;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({
  math,
  display = false,
  className = "",
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: display,
        throwOnError: false,
      });
    } catch {
      return math;
    }
  }, [math, display]);

  return (
    <span
      className={`inline-math ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

interface WordmarkProps {
  size?: number;
  className?: string;
}

export function Wordmark({ size = 16, className = "" }: WordmarkProps) {
  return (
    <span className={`wordmark ${className}`} style={{ fontSize: size }}>
      <span className="sens-target">
        sens
        <span className="vf-corner tl" />
        <span className="vf-corner tr" />
        <span className="vf-corner bl" />
        <span className="vf-corner br" />
      </span>
      able heat
    </span>
  );
}

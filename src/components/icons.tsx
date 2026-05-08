export {
  Search,
  Sun,
  Moon,
  Plus,
  Minus,
  Locate,
  Layers,
  Info,
  Clock,
  Filter,
  MapPin,
  X,
  Menu,
} from "lucide-react";

// Sharp custom icons for hard-edged aesthetic
interface IconProps {
  size?: number;
  style?: React.CSSProperties;
}

export function ChevronDown({ size = 16, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      style={style}
    >
      <path d="M4 6L8 10L12 6" />
    </svg>
  );
}

export function ChevronRight({ size = 16, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      style={style}
    >
      <path d="M6 4L10 8L6 12" />
    </svg>
  );
}

export function ArrowRight({ size = 16, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      style={style}
    >
      <path d="M3 8H13" />
      <path d="M9 4L13 8L9 12" />
    </svg>
  );
}

// Íconos de un solo trazo en línea (sin biblioteca). Todos son decorativos.
import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export const CheckCircleIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="m8 12.5 3 3 5-6" /></Icon>
)
export const CrossCircleIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></Icon>
)
export const InfoIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Icon>
)
export const WarningIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 10v4M12 17h.01" /></Icon>
)
export const LinkIcon = (p: IconProps) => (
  <Icon {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Icon>
)
export const PlusIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
)
export const TrashIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Icon>
)
export const CloseIcon = (p: IconProps) => (
  <Icon {...p}><path d="m6 6 12 12M18 6 6 18" /></Icon>
)
export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></Icon>
)

// ---- Íconos del panel "Mi red de entregas" ----
export const NetworkIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="3" width="6" height="6" rx="1.5" /><rect x="15" y="15" width="6" height="6" rx="1.5" /><path d="M9 6h4a2 2 0 0 1 2 2v7" /><circle cx="6" cy="18" r="3" /></Icon>
)
export const PinIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.4" /></Icon>
)
export const BoxIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3Z" /><path d="m3.5 7.5 8.5 4.5 8.5-4.5M12 12v9" /></Icon>
)
export const TargetIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></Icon>
)
export const RouteIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="6" cy="5.5" r="2.5" /><circle cx="18" cy="18.5" r="2.5" /><path d="M8.5 5.5H15a3.5 3.5 0 0 1 0 7H9a3.5 3.5 0 0 0 0 7h6.5" /></Icon>
)
export const SwapIcon = (p: IconProps) => (
  <Icon {...p}><path d="M8 20V5M4.5 8.5 8 5l3.5 3.5M16 4v15M12.5 15.5 16 19l3.5-3.5" /></Icon>
)
export const HelpIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M12 17h.01" /></Icon>
)
export const SearchIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></Icon>
)
export const MinusIcon = (p: IconProps) => (
  <Icon {...p}><path d="M5 12h14" /></Icon>
)
export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>
)
export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>
)
export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
)
export const RecenterIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7.5" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" /></Icon>
)
export const ImageIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.6" /><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" /></Icon>
)

"use client";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconSearch(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function IconBarcode(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <path d="M4 5v14M7 5v14M10 5v14M12 5v14M15 5v14M18 5v14M20 5v14" />
    </svg>
  );
}

export function IconTrash(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...stroke} {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    </svg>
  );
}

export function IconClose(props) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" {...stroke} {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...stroke} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconMinus(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...stroke} {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconGrid(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconChevronDown(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...stroke} {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconUser(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// Category Icons
export function IconAll(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconElectronics(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function IconMobile(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
    </svg>
  );
}

export function IconComputers(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M2 20h20M12 16v4" />
    </svg>
  );
}

export function IconAccessories(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5zM18 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-5z" />
      <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
    </svg>
  );
}

export function IconHomeAppliances(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function IconClothing(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </svg>
  );
}

export function IconFootwear(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <path d="M4 16v3a1 1 0 0 1 1 1h14a1 1 0 0 1 1-1v-2l-3-6H9l-5 5zM9 11v-3a3 3 0 0 1 3-3h1" />
    </svg>
  );
}

export function IconBeauty(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function IconToys(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <path d="M6 12h4M8 10v4M15 11h.01M18 13h.01" strokeWidth="2.5" />
    </svg>
  );
}

export function IconOthers(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <circle cx="12" cy="12" r="1" strokeWidth="3" />
      <circle cx="19" cy="12" r="1" strokeWidth="3" />
      <circle cx="5" cy="12" r="1" strokeWidth="3" />
    </svg>
  );
}

// Payment Icons
export function IconCash(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

export function IconCard(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

export function IconUPI(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} {...props}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export function IconBank(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} {...props}>
      <path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" />
    </svg>
  );
}

export function IconCredit(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} {...props}>
      <rect x="1" y="4" width="22" height="16" rx="3" />
      <line x1="1" y1="9" x2="23" y2="9" />
      <line x1="5" y1="15" x2="9" y2="15" />
    </svg>
  );
}

export function IconWallet(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...stroke} {...props}>
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path d="M16 14h4v-4h-4a2 2 0 0 0 0 4z" />
      <path d="M4 7V5a2 2 0 0 1 2-2h13" />
    </svg>
  );
}

export function IconMoney(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...stroke} {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

// Action Icons
export function IconHold(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...stroke} {...props}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

export function IconSave(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...stroke} {...props}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

export function IconPrint(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...stroke} {...props}>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

export function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...stroke} {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

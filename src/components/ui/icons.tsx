type P = { className?: string };
const s = (className?: string) => className ?? "size-[17px]";
const common = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export const IconDashboard = ({ className }: P) => (
  <svg className={s(className)} {...common}><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
);
export const IconRoadmap = ({ className }: P) => (
  <svg className={s(className)} {...common}><circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><path d="M6 16V9a4 4 0 0 1 4-4h4M18 8v3a4 4 0 0 1-4 4h-1" /></svg>
);
export const IconTrophy = ({ className }: P) => (
  <svg className={s(className)} {...common}><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></svg>
);
export const IconUser = ({ className }: P) => (
  <svg className={s(className)} {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);
export const IconUsers = ({ className }: P) => (
  <svg className={s(className)} {...common}><circle cx="9" cy="8" r="3.5" /><path d="M3 20a6 6 0 0 1 12 0M17 5a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" /></svg>
);
export const IconQuestions = ({ className }: P) => (
  <svg className={s(className)} {...common}><path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h5" /></svg>
);
export const IconTests = ({ className }: P) => (
  <svg className={s(className)} {...common}><path d="M9 11l3 3 8-8" /><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" /></svg>
);
export const IconList = ({ className }: P) => (
  <svg className={s(className)} {...common}><path d="M4 6h16M4 12h16M4 18h10" /></svg>
);
export const IconReports = ({ className }: P) => (
  <svg className={s(className)} {...common}><path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-8" /></svg>
);
export const IconBatches = ({ className }: P) => (
  <svg className={s(className)} {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
);
export const IconLogout = ({ className }: P) => (
  <svg className={s(className)} {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
);
export const IconSearch = ({ className }: P) => (
  <svg className={s(className)} {...common}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
);
export const IconFlame = ({ className }: P) => (
  <svg className={s(className)} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c1 3-1 4-1 6a3 3 0 0 0 5 2c1 2 2 3 2 6a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 2 3 2 0-3-2-4-3-7z" /></svg>
);
export const IconLock = ({ className }: P) => (
  <svg className={s(className)} {...common}><rect x="4.5" y="11" width="15" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
export const IconCheck = ({ className }: P) => (
  <svg className={s(className)} {...common}><path d="M20 6 9 17l-5-5" /></svg>
);
export const IconArrowRight = ({ className }: P) => (
  <svg className={s(className)} {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

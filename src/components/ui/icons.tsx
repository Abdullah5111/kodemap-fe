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
export const IconEye = ({ className }: P) => (
  <svg className={s(className)} {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IconEyeOff = ({ className }: P) => (
  <svg className={s(className)} {...common}><path d="M10.7 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.3 4.2M6.6 6.6A17.6 17.6 0 0 0 2 12s3.5 7 10 7a10.6 10.6 0 0 0 4.2-.9M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" /></svg>
);
export const IconFlame = ({ className }: P) => (
  <svg className={s(className)} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" /></svg>
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

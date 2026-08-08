export const OFFICIAL_BRANCHES = [
  {
    code: "TP14",
    name: "Tùng Phát 1",
    address: "14 Tam Bình, Hiệp Bình, TP.HCM",
    phone: "0909 259 160",
  },
  {
    code: "TP81",
    name: "Tùng Phát 2",
    address: "81B Tam Bình, Hiệp Bình, TP.HCM",
    phone: "0909 259 160",
  },
] as const;

export type OfficialBranchCode = (typeof OFFICIAL_BRANCHES)[number]["code"];

export function officialBranch(code: string) {
  return OFFICIAL_BRANCHES.find((branch) => branch.code === code) ?? null;
}

// Shared TS types

export interface Posting {
  id: string;
  source: string;
  externalId: string;
  title: string;
  company: string | null;
  url: string | null;
  applicationUrl: string | null;
  rawLocation: string | null;
  region: string | null;
  remoteType: string;
  isRemote: boolean;
  skills: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  salaryRaw: string | null;
  workWeekScore: number | null;
  workWeekLabel: string | null;
  experienceLevel: string | null;
  postedDate: string;
  scrapedAt: string;
  categorySlug: string;
  jobType: string;
  contentHash: string;
}

export interface PostingsResponse {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  data: Posting[];
}

export interface TickerItem {
  skill: string;
  pctChangeWow: number;
  mentionCount: number;
  direction: "up" | "down";
}

export interface TickerResponse {
  items: TickerItem[];
  weekStart: string | null;
  generatedAt: string;
}

export interface SkillTrendItem {
  skill: string;
  mentionCount: number;
  pctChangeWow: number;
  direction: "up" | "down";
}

export interface SkillTrendsResponse {
  weekStart: string | null;
  rising: SkillTrendItem[];
  falling: SkillTrendItem[];
  total: number;
}

export interface SalaryCell {
  region: string;
  roleFamily: string;
  medianSalaryMin: number | null;
  medianSalaryMax: number | null;
  sampleSize: number;
}

export interface SalaryHeatmapResponse {
  weekStart: string | null;
  regions: string[];
  roleFamilies: string[];
  cells: SalaryCell[];
}

export interface CategoryCount {
  slug: string;
  count: number;
}

export interface RemoteBreakdown {
  type: string;
  count: number;
}

export interface StatsResponse {
  totalPostings: number;
  recentPostings: number;
  regionsCovered: string[];
  categories: CategoryCount[];
  remoteBreakdown: RemoteBreakdown[];
  lastIngestion: {
    startedAt: string;
    finishedAt: string | null;
    fetched: number;
    inserted: number;
    skipped: number;
    error: string | null;
  } | null;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
}

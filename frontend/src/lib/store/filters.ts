"use client";

import { create } from "zustand";

export interface FilterState {
  region: string;
  roleFamily: string;
  remoteType: string;
  skill: string;
  category: string;
  jobType: string;
  page: number;
  pageSize: number;
  setRegion: (r: string) => void;
  setRoleFamily: (r: string) => void;
  setRemoteType: (r: string) => void;
  setSkill: (s: string) => void;
  setCategory: (c: string) => void;
  setJobType: (j: string) => void;
  setPage: (p: number) => void;
  resetPage: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  region: "all",
  roleFamily: "all",
  remoteType: "all",
  skill: "all",
  category: "all",
  jobType: "all",
  page: 1,
  pageSize: 15,
  setRegion: (region) => set({ region, page: 1 }),
  setRoleFamily: (roleFamily) => set({ roleFamily, page: 1 }),
  setRemoteType: (remoteType) => set({ remoteType, page: 1 }),
  setSkill: (skill) => set({ skill, page: 1 }),
  setCategory: (category) => set({ category, page: 1 }),
  setJobType: (jobType) => set({ jobType, page: 1 }),
  setPage: (page) => set({ page }),
  resetPage: () => set({ page: 1 }),
}));

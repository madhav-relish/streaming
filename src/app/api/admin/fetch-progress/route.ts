import { NextResponse } from "next/server";

// Global variable to track fetch progress
export interface FetchProgress {
  status: "idle" | "running" | "completed" | "error";
  startTime: number | null;
  endTime: number | null;
  totalItems: number;
  processedItems: number;
  currentPage: number;
  totalPages: number;
  error: string | null;
  lastUpdated: number;
  services?: string[] | string;
}

// Initialize with default values
export const fetchProgress: FetchProgress = {
  status: "idle",
  startTime: null,
  endTime: null,
  totalItems: 0,
  processedItems: 0,
  currentPage: 0,
  totalPages: 0,
  error: null,
  lastUpdated: Date.now(),
  services: "all",
};

export async function GET() {
  return NextResponse.json(fetchProgress);
}

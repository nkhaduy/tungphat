import { resolve } from "node:path";
import { ANCUONG_PARSER_VERSION, ANCUONG_SOURCE_ROOT } from "./types";

export const paths = {
  root: resolve("data/imports/ancuong"),
  raw: resolve("data/imports/ancuong/raw"),
  normalized: resolve("data/imports/ancuong/normalized"),
  reports: resolve("data/imports/ancuong/reports"),
  state: resolve("data/imports/ancuong/state"),
  media: resolve("data/imports/ancuong/media"),
  export: resolve("data/imports/ancuong/export")
} as const;

export const crawlerConfig = {
  sourceRoot: ANCUONG_SOURCE_ROOT,
  parserVersion: ANCUONG_PARSER_VERSION,
  userAgent: "TungPhat-AnCuong-Catalogue-Crawler/1.0 (+https://mdftungphat.com)",
  timeoutMs: 25_000,
  maxRetries: 3,
  minDelayMs: 300,
  maxDelayMs: 1_000,
  defaultConcurrency: 3,
  allowedHosts: new Set(["ancuong.com", "www.ancuong.com", "acshopping.ancuong.com", "catalogue.ancuong.com", "view.publitas.com"]),
  blockedPathParts: [
    "/tin-tuc/",
    "/kien-thuc/",
    "/du-an",
    "/tuyen-dung",
    "/lien-he",
    "/search",
    "/showroom",
    "/chinh-sach",
    "/thong-tin-nguoi-dung"
  ]
} as const;

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardScreen } from "../src/admin/screens/DashboardScreen";
import { SettingsScreen } from "../src/admin/screens/SettingsScreen";

const { dashboard, settings } = vi.hoisted(() => ({
  dashboard: vi.fn().mockResolvedValue({ counts: { products: 4, articles: 3, projects: 2, pages: 1 }, published: 7 }),
  settings: vi.fn().mockResolvedValue({ data: {}, version: 1 }),
}));

vi.mock("../src/admin/api", () => ({
  api: {
    dashboard,
    settings,
    saveSettings: vi.fn().mockResolvedValue({}),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Baogia-matched operational screens", () => {
  it("shows dashboard metrics with Vietnamese collection labels", async () => {
    render(<DashboardScreen />);
    await waitFor(() => expect(screen.getByText("Sản phẩm")).toBeInTheDocument());
    expect(screen.getByText("Bài viết")).toBeInTheDocument();
    expect(screen.getByText("Dự án")).toBeInTheDocument();
    expect(screen.getByText("Trang")).toBeInTheDocument();
    expect(screen.getByText("Nội dung đang xuất bản")).toBeInTheDocument();
    expect(screen.queryByText("products")).not.toBeInTheDocument();
  });

  it("keeps business and SEO settings inside one navigation screen", async () => {
    render(<SettingsScreen setting="business-settings" />);
    await waitFor(() => expect(settings).toHaveBeenCalledWith("business-settings"));
    expect(screen.getByRole("heading", { name: "Cài đặt" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Thông tin doanh nghiệp" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "SEO mặc định" }));
    await waitFor(() => expect(settings).toHaveBeenCalledWith("seo-defaults"));
  });
});

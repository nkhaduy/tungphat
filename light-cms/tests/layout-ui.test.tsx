// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Layout } from "../src/admin/components/Layout";
import { DataScreen } from "../src/admin/screens/DataScreen";

vi.mock("../src/admin/api", () => ({
  api: {
    users: vi.fn().mockResolvedValue([{ id: "baogia-user", baogia_username: "admin", display_name: "Quản trị Tùng Phát", role: "super-admin", status: "active" }]),
    audit: vi.fn().mockResolvedValue([]),
  },
}));

afterEach(cleanup);

const user = { id: "baogia-user", email: "sso@example.invalid", name: "Quản trị Tùng Phát", role: "super-admin" as const };

describe("Baogia-matched CMS layout", () => {
  it("renders the exact CMS navigation and a Vietnamese role label", () => {
    render(<Layout user={user} route="dashboard" onRoute={() => undefined} onLogout={() => undefined}><p>Nội dung</p></Layout>);
    const buttonNames = screen.getAllByRole("button").map((button) => button.textContent?.trim());
    expect(buttonNames).toEqual(expect.arrayContaining(["Tổng quan", "Sản phẩm", "Bài viết", "Dự án", "Trang", "Media", "Cài đặt", "Người dùng", "Phiên bản", "Nhật ký"]));
    expect(screen.getAllByText("Quản trị viên").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "Tùng Phát" })).toHaveAttribute("src", "/logo-horizontal.png");
  });

  it("keeps Baogia identities read-only and links to Baogia account management", async () => {
    render(<DataScreen kind="users" />);
    await waitFor(() => expect(screen.getByText("Quản trị Tùng Phát")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Quản lý tài khoản trong Báo Giá" })).toHaveAttribute("href", "https://baogia.mdftungphat.com/admin/nhan-vien");
    expect(screen.queryByRole("button", { name: /thêm|sửa|xóa/iu })).not.toBeInTheDocument();
  });
});

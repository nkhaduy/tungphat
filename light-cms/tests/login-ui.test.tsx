// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginScreen } from "../src/admin/screens/LoginScreen";
import { ssoLoginUrl } from "../src/admin/api";

afterEach(cleanup);

describe("Baogia SSO login UI", () => {
  it("matches the Baogia login shell without an email or password form", () => {
    render(<LoginScreen onLogin={() => undefined} error="" busy={false} />);
    expect(screen.getByRole("img", { name: "Tùng Phát" })).toHaveAttribute("src", "/logo-horizontal.png");
    expect(screen.getByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng nhập bằng tài khoản Báo Giá" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Mật khẩu")).not.toBeInTheDocument();
  });

  it("invokes the identity login flow from the button", () => {
    const onLogin = vi.fn();
    render(<LoginScreen onLogin={onLogin} error="" busy={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập bằng tài khoản Báo Giá" }));
    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it("shows a generic Vietnamese denial without disclosing whether the D1 user exists", () => {
    render(<LoginScreen onLogin={() => undefined} error="Tài khoản chưa được cấp quyền quản trị hoặc đã bị vô hiệu hóa." busy={false} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Tài khoản chưa được cấp quyền quản trị hoặc đã bị vô hiệu hóa.");
    expect(screen.getByRole("alert")).not.toHaveTextContent("admin@example.com");
  });

  it("starts authentication at the same-origin SSO endpoint", () => {
    expect(ssoLoginUrl()).toBe("/api/auth/sso/start");
  });
});

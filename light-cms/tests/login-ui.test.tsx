// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginScreen } from "../src/admin/screens/LoginScreen";
import { accessLoginUrl } from "../src/admin/api";

afterEach(cleanup);

describe("Cloudflare Access login UI", () => {
  it("shows one Access login action and no email or password form", () => {
    render(<LoginScreen onLogin={() => undefined} error="" busy={false} />);
    expect(screen.getByRole("button", { name: "Đăng nhập quản trị" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Mật khẩu")).not.toBeInTheDocument();
  });

  it("invokes the identity login flow from the button", () => {
    const onLogin = vi.fn();
    render(<LoginScreen onLogin={onLogin} error="" busy={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập quản trị" }));
    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it("shows a generic Vietnamese denial without disclosing whether the D1 user exists", () => {
    render(<LoginScreen onLogin={() => undefined} error="Tài khoản chưa được cấp quyền quản trị hoặc đã bị vô hiệu hóa." busy={false} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Tài khoản chưa được cấp quyền quản trị hoặc đã bị vô hiệu hóa.");
    expect(screen.getByRole("alert")).not.toHaveTextContent("admin@example.com");
  });

  it("uses the protected staging root to start Access authentication", () => {
    expect(accessLoginUrl()).toBe("/");
  });
});

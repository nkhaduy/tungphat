import { describe, expect, it } from "vitest";
import { getLightCmsUiCopy } from "../src/admin/environment";

describe("Light CMS environment copy", () => {
  it("removes staging and Decap claims from the production admin", () => {
    const copy = getLightCmsUiCopy("production");
    expect(copy.environmentLabel).toBe("Production");
    expect(copy.brandSubtitle).toBe("Light CMS");
    expect(copy.headerSubtitle).toBe("Production · quản trị nội dung trực tiếp");
    expect(copy.loginNote).toBe("Môi trường production · đăng nhập bằng tài khoản Báo Giá");
    expect(copy.dashboardLoading).toContain("production");
    expect(copy.dashboardTitle).toBe("Nguyên tắc production");
    expect(copy.dashboardLead).not.toContain("Decap");
    expect(copy.contentEmpty).not.toContain("staging");
    expect(copy.dataLoading).toContain("production");
  });

  it("keeps explicit staging safety copy for staging builds", () => {
    const copy = getLightCmsUiCopy("staging");
    expect(copy.environmentLabel).toBe("staging");
    expect(copy.headerSubtitle).toContain("không ảnh hưởng production");
    expect(copy.dashboardTitle).toBe("Nguyên tắc staging");
  });
});

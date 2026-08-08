export type LightCmsEnvironment = "staging" | "production";

export function normalizeLightCmsEnvironment(value: unknown): LightCmsEnvironment {
  return value === "production" ? "production" : "staging";
}

export function getLightCmsUiCopy(environment: LightCmsEnvironment) {
  if (environment === "production") {
    return {
      environmentLabel: "Production",
      brandSubtitle: "Light CMS",
      headerSubtitle: "Production · quản trị nội dung trực tiếp",
      loginNote: "Môi trường production · đăng nhập bằng tài khoản Báo Giá",
      dashboardLoading: "Light CMS đang đọc số liệu thật từ production.",
      dashboardTitle: "Nguyên tắc production",
      dashboardLead: "Light CMS đang phục vụ production.",
      dashboardLeadDescription: "Mọi thao tác quản trị được xác thực, phân quyền và ghi nhật ký trên server.",
      contentEmpty: "Chưa có nội dung trong collection này.",
      dataLoading: "Đang đọc dữ liệu production.",
    } as const;
  }

  return {
    environmentLabel: "staging",
    brandSubtitle: "Light CMS staging",
    headerSubtitle: "Staging · không ảnh hưởng production",
    loginNote: "Môi trường staging · production vẫn dùng Decap",
    dashboardLoading: "Light CMS đang đọc số liệu thật từ staging.",
    dashboardTitle: "Nguyên tắc staging",
    dashboardLead: "Production vẫn là Decap.",
    dashboardLeadDescription: "Không có provider, DNS hoặc billing production nào được thay đổi.",
    contentEmpty: "Migration staging sẽ đưa dữ liệu Decap đã xác minh vào đây.",
    dataLoading: "Đang đọc dữ liệu staging.",
  } as const;
}

export const lightCmsEnvironment = normalizeLightCmsEnvironment(import.meta.env.VITE_LIGHT_CMS_ENV);
export const lightCmsUiCopy = getLightCmsUiCopy(lightCmsEnvironment);

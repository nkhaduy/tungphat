const BA_THANH_HOST = "bathanh.com.vn";

export function isAllowedBaThanhUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === BA_THANH_HOST;
  } catch {
    return false;
  }
}

export function assertAllowedBaThanhUrl(value: string) {
  if (!isAllowedBaThanhUrl(value)) {
    throw new Error(`URL nguồn không được phép: ${value}`);
  }
  return new URL(value);
}

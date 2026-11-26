import imageIndex from "@/data/product-image-index.json";
import productIntros from "@/data/product-intros.json";
import publication from "@/content/categories/product-publication.json";

export type ProductDiscoveryCard = {
  id: string;
  title: string;
  href: string;
  image: string;
  alt: string;
  description: string;
  group?: "core" | "surface" | "accessory";
  children?: readonly [string, string][];
};

// This small registry is safe to import in navigation and the client-side finder.
// Long editorial content and provenance stay out of the browser bundle.
const materialCards: readonly ProductDiscoveryCard[] = [
  { id: "mdf", title: "Ván MDF", href: "/van-mdf/", image: "/sanpham-media/van-mdf.webp", alt: "Các tấm MDF mộc xếp chồng, nhìn rõ bề mặt mịn và cạnh sợi gỗ", description: "Ván sợi gỗ cho tủ, bàn, vách và chi tiết nội thất. Có thể chọn bề mặt phủ theo thiết kế.", group: "core" },
  { id: "hdf", title: "Ván HDF", href: "/van-hdf/", image: "", alt: "", description: "Ván sợi gỗ mật độ cao, khác với MDF. Chọn đúng dòng ván theo hạng mục và yêu cầu kỹ thuật.", group: "core" },
  { id: "mdf-moisture-resistant", title: "MDF chống ẩm", href: "/mdf-chong-am/", image: "/sanpham-media/mdf-chong-am.webp", alt: "MDF chống ẩm có lõi xanh và mặt phủ trắng, chụp gần phần cạnh tấm", description: "Ván MDF dùng cho điều kiện ẩm hơn nội thất khô. Chống ẩm không đồng nghĩa với chống nước.", group: "core" },
  { id: "okal", title: "Ván Okal", href: "/van-okal/", image: "", alt: "", description: "Ván dăm gỗ ép thành tấm, dùng làm ván cho nhiều chi tiết nội thất. Cần chọn thêm bề mặt hoàn thiện.", group: "core" },
  { id: "mfc", title: "Ván MFC", href: "/van-mfc/", image: "", alt: "", description: "Ván dăm đã phủ Melamine, thường dùng cho thùng tủ, bàn và kệ. Phân biệt với MDF phủ Melamine.", group: "core" },
  { id: "plywood", title: "Ván Plywood", href: "/van-plywood/", image: "", alt: "", description: "Ván ép từ nhiều lớp gỗ mỏng, dễ nhận qua cạnh tấm. Chọn theo lớp mặt, loại ván và mục đích sử dụng.", group: "core" },
  { id: "melamine-plywood", title: "Plywood phủ Melamine", href: "/plywood-phu-melamine/", image: "", alt: "", description: "Ván plywood kết hợp bề mặt Melamine trang trí. Cần kiểm tra cả cấu trúc ván và mã mặt phủ.", group: "core" },
  { id: "rubberwood", title: "Gỗ ghép cao su", href: "/go-ghep-cao-su/", image: "", alt: "", description: "Tấm ghép từ các thanh gỗ cao su cho mặt bàn, kệ và chi tiết nội thất cần vân gỗ thật.", group: "core" },
  { id: "acacia", title: "Gỗ ghép tràm", href: "/go-ghep-tram/", image: "", alt: "", description: "Gỗ tràm ghép thành tấm, có màu và vân tự nhiên. Chọn theo mặt sử dụng, mối ghép và cách hoàn thiện.", group: "core" },
  { id: "pvc-board", title: "Ván nhựa PVC", href: "/van-nhua-pvc/", image: "", alt: "", description: "Vật liệu dạng tấm có nền nhựa PVC, khác với màng PVC trang trí. Chọn theo kết cấu và cách liên kết.", group: "core" },
  { id: "melamine", title: "Melamine", href: "/melamine/", image: "", alt: "", description: "Bề mặt trang trí với nhiều màu và vân. Mã Melamine cần đi cùng loại ván khi đặt hàng.", group: "surface" },
  { id: "laminate", title: "Laminate", href: "/laminate/", image: "", alt: "", description: "Tấm bề mặt trang trí nhiều lớp, dán lên ván nền. Chọn theo hạng mục, mã màu và cách xử lý cạnh.", group: "surface" },
  { id: "acrylic", title: "Acrylic", href: "/acrylic/", image: "", alt: "", description: "Bề mặt Acrylic cho cánh tủ và nội thất cần hiệu ứng bóng. Ván nền và chỉ cạnh cần chọn đồng bộ.", group: "surface" },
  { id: "veneer", title: "Tấm Veneer", href: "/tam-veneer/", image: "", alt: "", description: "Lớp gỗ mỏng dùng phủ lên nền ván, giữ vẻ tự nhiên của vân gỗ. Cần chọn cả nền và lớp hoàn thiện.", group: "surface" },
  { id: "pvc-film", title: "PVC Film / PET", href: "/pvc-film-pet/", image: "", alt: "", description: "Hai dòng màng trang trí khác nhau, dùng trên nền phù hợp. Hỏi rõ loại màng, mã màu và cách gia công.", group: "surface" },
  { id: "edge-banding", title: "Chỉ nẹp nhựa", href: "/chi-nep-nhua/", image: "", alt: "", description: "Vật tư hoàn thiện cạnh ván, cần khớp màu, độ dày và khổ cạnh. Chọn cùng bề mặt và yêu cầu dán cạnh.", group: "accessory" },
];

const hiddenMaterialSlugs = new Set<string>(publication.hiddenSlugs);
export const allMaterialCards: readonly ProductDiscoveryCard[] = materialCards.filter((card) => !hiddenMaterialSlugs.has(card.href.slice(1, -1))).map((card) => {
  const slug = card.href.replace(/^\//u, "").replace(/\/$/u, "");
  const media = imageIndex[slug as keyof typeof imageIndex];
  return { ...card, image: media?.image || card.image, alt: media?.alt || card.alt };
});

// The order and labels below are the public product taxonomy. Secondary material
// guides remain in allMaterialCards so their established URLs continue to work.
const mainGroups: readonly [string, string, string][] = [
  ["mdf", "Ván MDF – HDF", "Ván sợi có bề mặt phẳng, dùng làm tủ, bàn, kệ và nhiều chi tiết nội thất."],
  ["mdf-moisture-resistant", "MDF chống ẩm (LMR – MMR – HMR)", "Ván MDF dành cho những vị trí có độ ẩm cao hơn phòng khô, thường được dùng làm tủ và nội thất."],
  ["okal", "Ván Okal – MFC (Ván dăm)", "Ván dăm dùng làm tủ, bàn và kệ. MFC là ván dăm đã phủ Melamine với nhiều màu và vân."],
  ["plywood", "Ván ép – Plywood", "Ván ép gồm nhiều lớp gỗ mỏng liên kết thành tấm, dùng làm nội thất hoặc nền phủ bề mặt."],
  ["rubberwood", "Gỗ ghép cao su", "Tấm ghép từ các thanh gỗ cao su, có vân gỗ và đường ghép tự nhiên."],
  ["melamine", "Melamine", "Bề mặt trang trí có màu và vân, được ép lên ván nền phù hợp cho nội thất."],
  ["laminate", "Laminate", "Tấm bề mặt trang trí nhiều lớp, dán lên nền ván theo yêu cầu thiết kế."],
  ["veneer", "Ván phủ Veneer", "Ván nền phủ lớp gỗ lạng mỏng, giữ hình dáng vân gỗ tự nhiên trên bề mặt."],
  ["pvc-board", "Ván nhựa", "Vật liệu dạng tấm có nền nhựa, chọn theo kết cấu và mục đích sử dụng."],
  ["edge-banding", "Chỉ dán cạnh", "Dải chỉ hoàn thiện cạnh ván, chọn đồng bộ với mặt tấm và phương pháp gia công."],
];
export const homeProductCards: readonly ProductDiscoveryCard[] = mainGroups.flatMap(([id, title, description]) => {
  const card = allMaterialCards.find((item) => item.id === id);
  const slug = card?.href.replace(/^\//u, "").replace(/\/$/u, "");
  const intro = slug && productIntros[slug as keyof typeof productIntros];
  return card ? [{ ...card, title, description: intro || description }] : [];
});

export const coreMaterialCards = homeProductCards.filter((card) => card.group === "core");
export const surfaceCatalogueCards = homeProductCards.filter((card) => card.group === "surface");
export const accessoryCards = homeProductCards.filter((card) => card.group === "accessory");

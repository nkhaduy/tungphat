export type ProductDiscoveryCard = {
  id: string;
  title: string;
  href: string;
  image: string;
  alt: string;
  description: string;
  children?: readonly [string, string][];
};

// Keep the public discovery layer limited to routes and media already approved in the site.
export const coreMaterialCards: readonly ProductDiscoveryCard[] = [
  {
    id: "mdf",
    title: "Ván MDF",
    href: "/van-mdf/",
    image: "/wood/mdfmfc.webp",
    alt: "Các tấm ván MDF và ván phủ bề mặt được dựng đứng để nhìn rõ cốt tấm",
    description: "Cốt ván phổ biến cho nội thất dạng tấm; xem độ dày, bề mặt và quy cách cần gửi.",
  },
  {
    id: "mdf-moisture-resistant",
    title: "MDF chống ẩm",
    href: "/mdf-chong-am/",
    image: "/wood/vanchongam.webp",
    alt: "Các tấm MDF chống ẩm có phần lõi xanh được dựng đứng",
    description: "Dành cho môi trường ẩm hơn phòng khô; vẫn cần chốt đúng hạng mục và điều kiện dùng.",
  },
  {
    id: "mfc",
    title: "MFC",
    href: "/van-go-cong-nghiep/",
    image: "/wood/mdfmfc.webp",
    alt: "Tấm ván công nghiệp có cốt và bề mặt trang trí để tham khảo nhóm MFC",
    description: "Xem nhóm ván công nghiệp và cách phân biệt cốt ván với bề mặt phủ trước khi hỏi hàng.",
  },
  {
    id: "plywood",
    title: "Plywood",
    href: "/van-go-cong-nghiep/",
    image: "/wood/plywood.webp",
    alt: "Cạnh tấm plywood cho thấy cấu trúc nhiều lớp veneer",
    description: "Nhận diện qua cấu trúc nhiều lớp; mở hướng dẫn để đối chiếu nhu cầu và quy cách.",
  },
  {
    id: "joined-wood",
    title: "Gỗ ghép",
    href: "/go-ghep/",
    image: "/images/wood-panels.webp",
    alt: "Các tấm gỗ ghép có mối ghép và vân gỗ được trưng bày",
    description: "Bắt đầu từ nhóm gỗ ghép, sau đó chọn cao su hoặc tràm theo hạng mục.",
    children: [
      ["Gỗ ghép cao su", "/go-ghep-cao-su/"],
      ["Gỗ ghép tràm", "/go-ghep-tram/"],
    ],
  },
];

export const surfaceCatalogueCards: readonly ProductDiscoveryCard[] = [
  {
    id: "melamine",
    title: "Melamine",
    href: "/catalogue/an-cuong/melamine/",
    image: "/wood/melamine.webp",
    alt: "Các tấm bề mặt Melamine với màu và vân gỗ khác nhau",
    description: "Tra cứu màu và vân trong catalogue, rồi gửi mã cùng loại cốt ván cần dùng.",
  },
  {
    id: "laminate",
    title: "Laminate",
    href: "/catalogue/an-cuong/laminate/",
    image: "/wood/laminate.webp",
    alt: "Các tấm bề mặt Laminate được dựng đứng để xem mẫu",
    description: "Mở bảng mã Laminate và đối chiếu nền dán, kích thước, cạnh hoàn thiện.",
  },
  {
    id: "acrylic",
    title: "Acrylic",
    href: "/catalogue/an-cuong/acrylic/",
    image: "/wood/arcrylic.webp",
    alt: "Các tấm Acrylic có bề mặt bóng phản chiếu ánh sáng",
    description: "Tra cứu bề mặt bóng và mã màu; nên duyệt mẫu theo điều kiện ánh sáng thực tế.",
  },
  {
    id: "veneer",
    title: "Veneer",
    href: "/catalogue/an-cuong/veneer/",
    image: "/wood/veneer.webp",
    alt: "Các tấm bề mặt Veneer có vân gỗ tự nhiên",
    description: "Xem nhóm veneer theo mã và vân, sau đó chốt cốt nền cùng quy cách hoàn thiện.",
  },
];

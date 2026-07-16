export type Lang = "vi" | "en";

export type TranslationKey = keyof typeof vi;

export const vi = {
  /* ── Site identity ── */
  siteName: "Tùng Phát",
  siteTagline: "Vật liệu gỗ & Gia công CNC",
  siteDescription:
    "Phân phối vật liệu gỗ và gia công CNC theo kích thước, bản vẽ cho xưởng nội thất, thợ mộc, kiến trúc sư và doanh nghiệp.",

  /* ── Header ── */
  navHome: "Trang chủ",
  navProducts: "Sản phẩm",
  navCatalogues: "Catalogue",
  navCNC: "Gia công CNC",
  navLibrary: "Thư viện",
  navContact: "Liên hệ",
  navAllProducts: "Tất cả sản phẩm",
  mobileOpenMenu: "Mở menu",
  mobileCloseMenu: "Đóng menu",
  mobileOpenProducts: "Mở danh mục sản phẩm",
  mobileCloseProducts: "Đóng danh mục sản phẩm",
  ctaGetQuote: "Nhận báo giá",
  phoneLabel: "0909 259 160",
  callLabel: "Gọi 0909 259 160",

  /* ── Hero ── */
  heroCompany: "Công ty TNHH TMDV Gỗ Tùng Phát",
  heroTitle1: "TÙNG PHÁT –",
  heroTitle2: "Vật liệu gỗ",
  heroTitle3: "và giải pháp",
  heroTitle4: "gia công CNC",
  heroDescription:
    "Cung cấp MDF, MFC, plywood, laminate và các vật liệu gỗ liên quan; đồng thời nhận gia công CNC theo kích thước hoặc file kỹ thuật cho xưởng nội thất, thợ mộc, đơn vị thiết kế và doanh nghiệp.",
  heroCtaExplore: "Khám phá catalogue",
  heroCtaQuote: "Liên hệ báo giá",

  /* ── Partners ── */
  partnersTitle: "THƯƠNG HIỆU VẬT LIỆU",
  partnersDescription:
    "Tham khảo các dòng vật liệu đang được giới thiệu tại Tùng Phát và trao đổi theo mã, bề mặt hoặc nhu cầu sử dụng.",

  /* ── Product categories ── */
  categoryEyebrow: "Danh mục vật liệu",
  categoryTitle: "Tìm đúng tấm ván cho đúng hạng mục",
  categoryCtaCheck: "Kiểm tra hàng & nhận báo giá",
  categoryCtaRequest: "Yêu cầu báo giá",

  categories: [
    ["Ván MDF – MFC", "Nhiều độ dày, phù hợp nội thất dân dụng và sản xuất hàng loạt."],
    ["Ván chống ẩm", "Lõi xanh cho khu vực có độ ẩm cao và hạng mục bếp."],
    ["Plywood", "Kết cấu nhiều lớp, chịu lực tốt và ổn định khi gia công."],
    ["Melamine", "Bề mặt hoàn thiện đa dạng màu trơn, vân gỗ và vân đá."],
    ["Laminate", "Bề mặt bền, chống trầy xước cho khu vực sử dụng thường xuyên."],
    ["Acrylic", "Bề mặt bóng sâu, màu sắc hiện đại cho tủ và hệ kệ."],
    ["Veneer", "Vân gỗ tự nhiên cho các hạng mục cần cảm giác vật liệu thật."],
    ["Tấm trang trí", "Giải pháp bề mặt tạo điểm nhấn cho tường, quầy và showroom."]
  ],

  /* ── CNC section ── */
  cncEyebrow: "Năng lực tại xưởng",
  cncTitle: "Gia công CNC theo bản vẽ",
  cncDescription:
    "Nhận gia công chi tiết từ file kỹ thuật hoặc bản phác thảo, xác nhận quy cách trước khi chạy máy.",
  cncItems: [
    "Cắt ván theo kích thước",
    "Khoan liên kết",
    "Soi rãnh",
    "Cắt hoa văn",
    "Gia công chi tiết theo file",
    "Kiểm tra trước bàn giao"
  ],
  cncCta: "Liên hệ báo giá dựa trên bản vẽ",
  cncOverlay: "Gia công theo kích thước & bản vẽ",

  /* ── Process ── */
  processEyebrow: "Quy trình đặt hàng",
  processTitle: "Từ mã vật liệu đến thành phẩm, rõ từng bước",
  processDescription:
    "Một đầu mối xác nhận thông tin xuyên suốt để hạn chế sai quy cách trước khi sản xuất.",
  processSteps: [
    ["01", "Chọn vật liệu hoặc gửi mã"],
    ["02", "Gửi kích thước / file gia công"],
    ["03", "Xác nhận quy cách và báo giá"],
    ["04", "Cắt CNC, kiểm tra thành phẩm"],
    ["05", "Thống nhất phương thức nhận hàng"]
  ],
  processScope:
    "Phạm vi dịch vụ trên website: cung cấp vật liệu và gia công CNC. Không bao gồm thiết kế, thi công hoặc lắp đặt nội thất.",

  /* ── Why us ── */
  whyUsEyebrow: "Lý do hợp tác",
  whyUsTitle: "Vì sao chọn Tùng Phát?",
  whyUsItems: [
    "Tư vấn theo mã vật liệu",
    "Đa dạng mã màu & bề mặt",
    "Gia công CNC theo quy cách",
    "Hỗ trợ xưởng, thợ & đơn vị thiết kế"
  ],

  /* ── Workshop media ── */
  workshopEyebrow: "Vật liệu và ứng dụng",
  workshopTitle: "Hình ảnh bề mặt, ứng dụng và gia công CNC",
  workshopDescription:
    "Hình ảnh minh họa giúp tham khảo bề mặt, không gian ứng dụng và hạng mục gia công trước khi trao đổi quy cách.",
  workshopGalleryLabels: [
    "Không gian ứng dụng bề mặt gỗ",
    "Ứng dụng vân gỗ trong nội thất",
    "Minh họa không gian sử dụng vật liệu gỗ",
    "Bề mặt gỗ trong thiết kế nội thất",
    "Máy CNC gia công tấm ván",
    "Các tấm vật liệu và bề mặt gỗ"
  ],
  workshopProcessEyebrow: "Tham khảo quy trình",
  workshopProcessTitle: "Trao đổi và gia công theo quy cách đã xác nhận",
  workshopProcessDescription:
    "Thông tin vật liệu, kích thước và file kỹ thuật cần được kiểm tra trước khi chạy máy. Video minh họa một phần hoạt động gia công CNC.",
  workshopSteps: [
    "Triển khai và kiểm tra file gia công",
    "Cắt CNC theo kích thước đã xác nhận",
    "Kiểm tra chi tiết theo yêu cầu đã thống nhất"
  ],

  /* ── Contact CTA ── */
  contactEyebrow: "LIÊN HỆ TÙNG PHÁT",
  contactTitle: "Bạn đang tìm đối tác cung cấp vật liệu hoặc gia công CNC?",
  contactDescription:
    "Trao đổi trực tiếp với Tùng Phát để được tư vấn mã vật liệu, quy cách và phương án gia công phù hợp với nhu cầu thực tế.",
  contactCta: "Liên hệ hợp tác",

  /* ── Footer ── */
  footerDescription:
    "Vật liệu gỗ và giải pháp gia công CNC cho xưởng, thợ mộc, kiến trúc sư và khách hàng doanh nghiệp.",
  footerMaterials: "Vật liệu",
  footerServices: "Dịch vụ",
  footerContact: "Liên hệ",
  footerCNC: "Gia công CNC",
  footerCatalogue: "Catalogue",
  footerLibrary: "Thư viện xưởng",
  footerProcess: "Quy trình đặt hàng",
  footerLegal: "Pháp lý",
  footerPrivacy: "Chính sách bảo mật",
  footerTerms: "Điều khoản sử dụng",
  footerCopyright: "© 2026 Công ty TNHH TMDV Gỗ Tùng Phát",
  footerBranchesEyebrow: "HỆ THỐNG CHI NHÁNH",
  footerBranchesTitle: "Tìm Tùng Phát gần bạn",
  footerBranch1Name: "Tùng Phát 1",
  footerBranch2Name: "Tùng Phát 2",

  /* ── Floating CTAs ── */
  floatingQuote: "Nhận báo giá",

  /* ── Breadcrumb ── */
  breadcrumbHome: "Trang chủ",
  breadcrumbProducts: "Sản phẩm",

  /* ── Catalogue pages ── */
  catalogueTitle: "Catalogue",
  catalogueDescription: "Thông tin catalogue của",
  cataloguePlaceholder: "Catalogue đang được cập nhật. Vui lòng liên hệ để nhận file catalogue mới nhất.",
  catalogueRequestCta: "Yêu cầu catalogue",
  catalogueThumbnails: {
    melamine: "Bộ sưu tập Melamine",
    laminate: "Bộ sưu tập Laminate",
    acrylic: "Bộ sưu tập Acrylic",
    veneer: "Bộ sưu tập Veneer",
    plywood: "Bộ sưu tập Plywood",
    mdf: "Bộ sưu tập MDF – MFC"
  },

  /* ── Legal pages ── */
  legalLastUpdated: "Cập nhật lần cuối",

  /* ── Privacy policy ── */
  privacyTitle: "Chính sách bảo mật",
  privacySubtitle:
    "Tùng Phát cam kết bảo vệ thông tin khách hàng trong quá trình tư vấn, báo giá và cung cấp dịch vụ.",
  privacySections: [
    {
      id: "muc-dich",
      title: "01. Mục đích thu thập thông tin",
      content: [
        "Tùng Phát thu thập thông tin từ khách hàng và đối tác nhằm phục vụ hoạt động tư vấn vật liệu gỗ, gia công CNC và các dịch vụ liên quan. Việc thu thập dữ liệu giúp chúng tôi hiểu rõ nhu cầu, từ đó cung cấp giải pháp chính xác và kịp thời.",
        "Thông tin được cung cấp khi bạn chủ động gửi form báo giá/liên hệ, liên hệ qua Zalo, điện thoại hoặc trao đổi đơn hàng vật liệu và gia công CNC. Website không có chức năng tải file trực tiếp."
      ]
    },
    {
      id: "pham-vi",
      title: "02. Phạm vi sử dụng thông tin",
      content: [
        "Thông tin khách hàng cung cấp được sử dụng để kiểm tra mã vật liệu, lập báo giá, xác nhận quy cách, xử lý file gia công CNC và trao đổi về đơn hàng.",
        "Chúng tôi không sử dụng thông tin khách hàng vào bất kỳ mục đích nào ngoài phạm vi đã nêu, trừ khi có sự đồng ý riêng từ khách hàng hoặc theo yêu cầu của cơ quan nhà nước có thẩm quyền.",
        "Tùng Phát không bán, trao đổi hoặc cho thuê thông tin cá nhân của khách hàng cho bất kỳ bên thứ ba nào."
      ]
    },
    {
      id: "thoi-gian",
      title: "03. Thời gian lưu trữ thông tin",
      content: [
        "Yêu cầu báo giá hoặc liên hệ chưa phát sinh giao dịch được lưu tối đa 24 tháng kể từ lần cập nhật cuối. Dữ liệu liên quan giao dịch có thể được lưu lâu hơn khi pháp luật hoặc nghĩa vụ đối soát yêu cầu.",
        "Khi thông tin không còn cần thiết cho các mục đích đã nêu, Tùng Phát sẽ xóa hoặc ẩn danh dữ liệu một cách an toàn."
      ]
    },
    {
      id: "don-vi",
      title: "04. Đơn vị tiếp nhận và quản lý thông tin",
      content: [
        "Đơn vị chịu trách nhiệm tiếp nhận và quản lý thông tin khách hàng:",
        "Công ty TNHH Thương mại Dịch vụ Gỗ Tùng Phát",
        "Địa chỉ: 14 Tam Bình và 81B Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh",
        "Điện thoại: 0909 259 160",
        "Zalo: 0909 259 160",
        "Mọi thắc mắc liên quan đến việc thu thập và xử lý dữ liệu, quý khách vui lòng liên hệ qua các kênh trên."
      ]
    },
    {
      id: "cam-ket",
      title: "05. Cam kết bảo mật thông tin",
      content: [
        "Tùng Phát áp dụng các biện pháp phù hợp để hạn chế truy cập, thay đổi hoặc tiết lộ trái phép đối với thông tin khách hàng trong phạm vi hệ thống do doanh nghiệp quản lý.",
        "File thiết kế và bản vẽ CNC do khách hàng cung cấp chỉ được sử dụng cho mục đích báo giá và gia công. Chúng tôi không chia sẻ file của khách hàng với bên thứ ba khi chưa có sự đồng ý.",
        "Trong trường hợp phát sinh sự cố về bảo mật, Tùng Phát sẽ thông báo kịp thời đến khách hàng và thực hiện các biện pháp khắc phục phù hợp."
      ]
    },
    {
      id: "quyen",
      title: "06. Quyền của khách hàng",
      content: [
        "Khách hàng có quyền yêu cầu Tùng Phát cung cấp thông tin về dữ liệu cá nhân đang được lưu trữ.",
        "Khách hàng có quyền yêu cầu chỉnh sửa, bổ sung hoặc xóa thông tin cá nhân khi phát hiện sai sót hoặc không còn nhu cầu sử dụng dịch vụ.",
        "Khách hàng có quyền từ chối nhận thông tin tiếp thị bất kỳ lúc nào bằng cách liên hệ trực tiếp với chúng tôi.",
        "Mọi yêu cầu liên quan đến dữ liệu cá nhân sẽ được Tùng Phát xử lý trong thời gian sớm nhất sau khi nhận được yêu cầu hợp lệ."
      ]
    },
    {
      id: "lien-he",
      title: "07. Liên hệ",
      content: [
        "Mọi câu hỏi hoặc yêu cầu liên quan đến Chính sách bảo mật, vui lòng liên hệ Tùng Phát qua các kênh:",
        "Điện thoại: 0909 259 160",
        "Zalo: 0909 259 160",
        "Chúng tôi sẽ phản hồi trong thời gian sớm nhất."
      ]
    }
  ],
  /* ── Legal CTA ── */
  legalCTAHeading: "Bạn cần tư vấn thêm?",
  legalCTAText:
    "Liên hệ Tùng Phát để được hỗ trợ về catalogue, mã vật liệu và gia công CNC.",
  legalCTAQuote: "Nhận báo giá",
  legalCTAZalo: "Liên hệ Zalo",
  /* ── Legal TOC ── */
  legalTOC: "Mục lục",

  /* ── Terms of use ── */
  termsTitle: "Điều khoản sử dụng",
  termsIntro:
    "Khi truy cập và sử dụng website Tùng Phát, bạn đồng ý tuân thủ các điều khoản dưới đây. Vui lòng đọc kỹ trước khi sử dụng dịch vụ của chúng tôi.",
  termsSections: [
    {
      id: "chap-nhan",
      title: "1. Chấp nhận điều khoản",
      content: [
        "Bằng việc truy cập website www.mdftungphat.com, bạn xác nhận đã đọc, hiểu và đồng ý với các điều khoản sử dụng này.",
        "Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng website."
      ]
    },
    {
      id: "so-huu-tri-tue",
      title: "2. Quyền sở hữu trí tuệ",
      content: [
        "Toàn bộ nội dung trên website bao gồm văn bản, hình ảnh, logo, biểu tượng, video và thiết kế giao diện thuộc quyền sở hữu của Tùng Phát hoặc được sử dụng với sự cho phép của chủ sở hữu.",
        "Nghiêm cấm sao chép, phân phối, chỉnh sửa hoặc sử dụng nội dung website vào mục đích thương mại khi chưa có văn bản đồng ý từ Tùng Phát."
      ]
    },
    {
      id: "su-dung",
      title: "3. Phạm vi sử dụng",
      content: [
        "Website cung cấp thông tin về sản phẩm, dịch vụ và năng lực gia công của Tùng Phát. Thông tin trên website mang tính tham khảo và có thể thay đổi.",
        "Bạn không được sử dụng website vào các mục đích bất hợp pháp, lừa đảo, gây rối hoặc xâm phạm quyền lợi của Tùng Phát và bên thứ ba.",
        "Mọi giao dịch mua bán và gia công được xác nhận qua trao đổi trực tiếp, không chỉ dựa trên thông tin hiển thị trên website."
      ]
    },
    {
      id: "bao-gia",
      title: "4. Báo giá và đơn hàng",
      content: [
        "Báo giá trao đổi qua điện thoại hoặc Zalo có thể thay đổi tùy theo quy cách thực tế, số lượng và thời điểm đặt hàng.",
        "Đơn hàng chỉ được xác nhận sau khi hai bên thống nhất quy cách, giá cả và thời gian giao hàng qua văn bản hoặc tin nhắn xác nhận."
      ]
    },
    {
      id: "file",
      title: "5. File thiết kế và gia công CNC",
      content: [
        "Khi gửi file thiết kế (DXF, DWG, PDF, AI/CDR), bạn đảm bảo mình có quyền sử dụng các file đó và không vi phạm bản quyền của bên thứ ba.",
        "File bạn chủ động gửi được sử dụng để kiểm tra yêu cầu, báo giá và gia công; việc sử dụng cho mục đích khác cần có sự đồng ý của bạn."
      ]
    },
    {
      id: "mien-tru",
      title: "6. Giới hạn trách nhiệm",
      content: [
        "Tùng Phát không chịu trách nhiệm về các thiệt hại gián tiếp, ngẫu nhiên hoặc do hậu quả phát sinh từ việc sử dụng hoặc không thể sử dụng website.",
        "Chúng tôi nỗ lực đảm bảo thông tin trên website chính xác, nhưng không đảm bảo tuyệt đối về tính đầy đủ và cập nhật của mọi nội dung.",
        "Tùng Phát có quyền tạm ngừng hoặc thay đổi website mà không cần thông báo trước."
      ]
    },
    {
      id: "lien-ket",
      title: "7. Liên kết bên ngoài",
      content: [
        "Website có thể chứa liên kết đến các trang web của bên thứ ba (Zalo, mạng xã hội). Tùng Phát không kiểm soát và không chịu trách nhiệm về nội dung hoặc chính sách của các trang web đó."
      ]
    },
    {
      id: "thay-doi-dk",
      title: "8. Thay đổi điều khoản",
      content: [
        "Tùng Phát có thể cập nhật Điều khoản sử dụng này theo thời gian. Phiên bản mới sẽ có hiệu lực ngay khi được đăng tải trên website.",
        "Việc bạn tiếp tục sử dụng website sau khi điều khoản được cập nhật đồng nghĩa với việc bạn chấp nhận các thay đổi đó."
      ]
    },
    {
      id: "lien-he-dk",
      title: "9. Liên hệ",
      content: [
        "Mọi thắc mắc về Điều khoản sử dụng, vui lòng liên hệ:",
        "Công ty TNHH TM Dịch vụ Gỗ Tùng Phát",
        "Điện thoại: 0909 259 160",
        "Zalo: 0909 259 160"
      ]
    }
  ]
};

export const en: typeof vi = {
  siteName: "Tùng Phát",
  siteTagline: "Wood Materials & CNC Machining",
  siteDescription:
    "Distributing wood materials and CNC machining to specification for furniture workshops, carpenters, architects, and business clients.",

  navHome: "Home",
  navProducts: "Products",
  navCatalogues: "Catalogues",
  navCNC: "CNC Machining",
  navLibrary: "Library",
  navContact: "Contact",
  navAllProducts: "All Products",
  mobileOpenMenu: "Open menu",
  mobileCloseMenu: "Close menu",
  mobileOpenProducts: "Open product menu",
  mobileCloseProducts: "Close product menu",
  ctaGetQuote: "Get a Quote",
  phoneLabel: "0909 259 160",
  callLabel: "Call 0909 259 160",

  heroCompany: "Tùng Phát Wood Trading & Service Co., Ltd.",
  heroTitle1: "Engineered",
  heroTitle2: "wood",
  heroTitle3: "& CNC",
  heroTitle4: "solutions",
  heroDescription:
    "Supplying materials from trusted brands, combined with CNC machining to specification, serving furniture workshops, carpenters, architects, and business clients.",
  heroCtaExplore: "Explore catalogue",
  heroCtaQuote: "Contact for a quote",

  partnersTitle: "MATERIAL BRANDS",
  partnersDescription:
    "Browse material lines presented by Tùng Phát and ask about specific codes, surfaces, or applications.",

  categoryEyebrow: "Material Categories",
  categoryTitle: "Find the right panel for the right application",
  categoryCtaCheck: "Check stock & get a quote",
  categoryCtaRequest: "Request a quote",

  categories: [
    ["MDF – MFC Panels", "Multiple thicknesses, ideal for residential furniture and mass production."],
    ["Moisture-Resistant Panels", "Green-core boards for high-humidity areas and kitchen applications."],
    ["Plywood", "Multi-layer construction, high load-bearing capacity and machining stability."],
    ["Melamine", "Finished surfaces in a wide range of solid colors, woodgrains, and stone textures."],
    ["Laminate", "Durable, scratch-resistant surfaces for high-traffic areas."],
    ["Acrylic", "Deep gloss, modern colors for cabinetry and shelving systems."],
    ["Veneer", "Natural wood grain for projects requiring an authentic material feel."],
    ["Decorative Panels", "Surface solutions for accent walls, counters, and showrooms."]
  ],

  cncEyebrow: "Workshop Capability",
  cncTitle: "CNC Machining to Specification",
  cncDescription:
    "Precision machining from technical files or sketches, with specs confirmed before production.",
  cncItems: [
    "Cut-to-size panels",
    "Drilling and joinery",
    "Grooving",
    "Pattern cutting",
    "Detail machining from files",
    "Pre-delivery inspection"
  ],
  cncCta: "Request a drawing-based quote",
  cncOverlay: "Machining to size & drawing",

  processEyebrow: "Ordering Process",
  processTitle: "From material code to finished product, every step clear",
  processDescription:
    "A single point of contact confirms information end-to-end to minimize specification errors before production.",
  processSteps: [
    ["01", "Select material or send code"],
    ["02", "Send dimensions / machining file"],
    ["03", "Confirm specs and quote"],
    ["04", "CNC cutting, final inspection"],
    ["05", "Agree on the pickup method"]
  ],
  processScope:
    "Scope shown on this website: material supply and CNC machining. Interior design, construction, and installation are not included.",

  whyUsEyebrow: "Why Partner with Us",
  whyUsTitle: "Why choose Tùng Phát?",
  whyUsItems: [
    "Advice by material code",
    "Wide range of colors & surfaces",
    "CNC machining to confirmed specs",
    "Support for workshops, carpenters & designers"
  ],

  workshopEyebrow: "Materials and Applications",
  workshopTitle: "Surface, application, and CNC machining images",
  workshopDescription:
    "Illustrative images for reviewing surfaces, interior applications, and machining scopes before confirming specifications.",
  workshopGalleryLabels: [
    "Interior application using wood surfaces",
    "Woodgrain application in an interior",
    "Illustrative space using wood materials",
    "Wood surface in interior design",
    "CNC machine processing a panel",
    "Wood material panels and surfaces"
  ],
  workshopProcessEyebrow: "Process Reference",
  workshopProcessTitle: "Machining to confirmed specifications",
  workshopProcessDescription:
    "Material, dimensions, and technical files should be reviewed before machining. The video illustrates part of a CNC process.",
  workshopSteps: [
    "Review and verify machining files",
    "CNC cutting to confirmed dimensions",
    "Checking details against agreed requirements"
  ],

  contactEyebrow: "CONTACT TUNG PHAT",
  contactTitle: "Looking for a reliable material supply or CNC machining partner?",
  contactDescription:
    "Speak directly with Tùng Phát for advice on material codes, specifications, and machining options that fit your real project needs.",
  contactCta: "Discuss a partnership",

  footerDescription:
    "Wood materials and CNC machining solutions for workshops, carpenters, architects, and business clients.",
  footerMaterials: "Materials",
  footerServices: "Services",
  footerContact: "Contact",
  footerCNC: "CNC Machining",
  footerCatalogue: "Catalogue",
  footerLibrary: "Workshop Library",
  footerProcess: "Ordering Process",
  footerLegal: "Legal",
  footerPrivacy: "Privacy Policy",
  footerTerms: "Terms of Use",
  footerCopyright: "© 2026 Tùng Phát Wood Trading & Service Co., Ltd.",
  footerBranchesEyebrow: "BRANCH LOCATIONS",
  footerBranchesTitle: "Find Tùng Phát near you",
  footerBranch1Name: "Tùng Phát 1",
  footerBranch2Name: "Tùng Phát 2",

  floatingQuote: "Get a Quote",

  breadcrumbHome: "Home",
  breadcrumbProducts: "Products",

  catalogueTitle: "Catalogue",
  catalogueDescription: "Official product catalogue from",
  cataloguePlaceholder:
    "Catalogue is being updated. Please contact us to receive the latest catalogue file.",
  catalogueRequestCta: "Request catalogue",
  catalogueThumbnails: {
    melamine: "Melamine Collection",
    laminate: "Laminate Collection",
    acrylic: "Acrylic Collection",
    veneer: "Veneer Collection",
    plywood: "Plywood Collection",
    mdf: "MDF – MFC Collection"
  },

  legalLastUpdated: "Last updated",

  privacyTitle: "Privacy Policy",
  privacySubtitle:
    "Tùng Phát is committed to protecting customer information throughout consultation, quotation, and service delivery.",
  privacySections: [
    {
      id: "muc-dich",
      title: "01. Purpose of Information Collection",
      content: [
        "Tùng Phát collects information from customers and partners to support wood material consultation, CNC machining services, and related operations. Data collection helps us understand your needs and provide accurate, timely solutions.",
        "Information is provided when you submit a quote/contact form, contact us by Zalo or phone, or discuss material and CNC orders. The website has no direct file-upload feature."
      ]
    },
    {
      id: "pham-vi",
      title: "02. Scope of Information Use",
      content: [
        "Customer-provided information is used to check material codes, prepare quotes, confirm specifications, process CNC files, and discuss orders.",
        "We do not use customer information for any purpose beyond the stated scope unless with the customer's explicit consent or as required by competent government authorities.",
        "Tùng Phát does not sell, trade, or rent customer personal information to any third parties."
      ]
    },
    {
      id: "thoi-gian",
      title: "03. Information Retention Period",
      content: [
        "Quote or contact requests that do not become transactions are retained for up to 24 months after the last update. Transaction-related records may be retained longer when required for legal or reconciliation obligations.",
        "When information is no longer needed for the stated purposes, Tùng Phát will securely delete or anonymize the data."
      ]
    },
    {
      id: "don-vi",
      title: "04. Information Management Unit",
      content: [
        "The unit responsible for receiving and managing customer information:",
        "Tùng Phát Wood Trading & Service Co., Ltd.",
        "Address: 14 Tam Binh and 81B Tam Binh, Hiep Binh Ward, Ho Chi Minh City",
        "Phone: 0909 259 160",
        "Zalo: 0909 259 160",
        "For any inquiries regarding data collection and processing, please contact us through the channels above."
      ]
    },
    {
      id: "cam-ket",
      title: "05. Information Security Commitment",
      content: [
        "Tùng Phát applies appropriate measures to limit unauthorized access, alteration, or disclosure of customer information within systems managed by the business.",
        "Design files and CNC drawings provided by customers are used solely for quotation and machining purposes. We do not share customer files with third parties without consent.",
        "In the event of a security incident, Tùng Phát will promptly notify customers and implement appropriate remedial measures."
      ]
    },
    {
      id: "quyen",
      title: "06. Customer Rights",
      content: [
        "Customers have the right to request Tùng Phát to provide information about stored personal data.",
        "Customers have the right to request correction, supplementation, or deletion of personal information upon discovering errors or when services are no longer needed.",
        "Customers may opt out of marketing communications at any time by contacting us directly.",
        "All requests regarding personal data will be processed by Tùng Phát as soon as possible upon receiving a valid request."
      ]
    },
    {
      id: "lien-he",
      title: "07. Contact",
      content: [
        "For any questions or requests regarding this Privacy Policy, please contact Tùng Phát through the following channels:",
        "Phone: 0909 259 160",
        "Zalo: 0909 259 160",
        "We will respond as soon as possible."
      ]
    }
  ],
  /* ── Legal CTA ── */
  legalCTAHeading: "Need further assistance?",
  legalCTAText:
    "Contact Tùng Phát for support with catalogues, material codes, and CNC machining.",
  legalCTAQuote: "Get a Quote",
  legalCTAZalo: "Contact via Zalo",
  /* ── Legal TOC ── */
  legalTOC: "Table of Contents",

  termsTitle: "Terms of Use",
  termsIntro:
    "By accessing and using the Tùng Phát website, you agree to comply with the terms below. Please read carefully before using our services.",
  termsSections: [
    {
      id: "chap-nhan",
      title: "1. Acceptance of Terms",
      content: [
        "By accessing www.mdftungphat.com, you confirm that you have read, understood, and agree to these terms of use.",
        "If you do not agree with any term, please discontinue use of the website."
      ]
    },
    {
      id: "so-huu-tri-tue",
      title: "2. Intellectual Property",
      content: [
        "All content on this website including text, images, logos, icons, videos, and interface design is the property of Tùng Phát or used with the owner's permission.",
        "Reproduction, distribution, modification, or commercial use of website content without written consent from Tùng Phát is prohibited."
      ]
    },
    {
      id: "su-dung",
      title: "3. Scope of Use",
      content: [
        "The website provides information about Tùng Phát's products, services, and machining capabilities. Information is for reference and subject to change.",
        "You may not use the website for any illegal, fraudulent, disruptive purposes, or in any way that infringes upon the rights of Tùng Phát or third parties.",
        "All purchase and machining transactions are confirmed through direct communication, not solely based on information displayed on the website."
      ]
    },
    {
      id: "bao-gia",
      title: "4. Quotes & Orders",
      content: [
        "Quotes discussed by phone or Zalo may change depending on actual specifications, quantities, and order timing.",
        "Orders are only confirmed after both parties agree on specifications, pricing, and delivery timeline via written or message confirmation."
      ]
    },
    {
      id: "file",
      title: "5. Design Files & CNC Machining",
      content: [
        "By submitting design files (DXF, DWG, PDF, AI/CDR), you warrant that you have the right to use such files and that they do not infringe third-party copyright.",
        "Tùng Phát commits to using your files solely for quotation and machining purposes and will not share them with third parties without your consent."
      ]
    },
    {
      id: "mien-tru",
      title: "6. Limitation of Liability",
      content: [
        "Tùng Phát shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use the website.",
        "We strive to ensure the accuracy of website information but do not guarantee absolute completeness or currency of all content.",
        "Tùng Phát reserves the right to suspend or modify the website without prior notice."
      ]
    },
    {
      id: "lien-ket",
      title: "7. External Links",
      content: [
        "The website may contain links to third-party websites (Zalo, social networks). Tùng Phát does not control and is not responsible for the content or policies of those sites."
      ]
    },
    {
      id: "thay-doi-dk",
      title: "8. Changes to Terms",
      content: [
        "Tùng Phát may update these Terms of Use from time to time. The latest version takes effect immediately upon posting on the website.",
        "Your continued use of the website after terms are updated constitutes your acceptance of those changes."
      ]
    },
    {
      id: "lien-he-dk",
      title: "9. Contact",
      content: [
        "For any questions regarding these Terms of Use, please contact:",
        "Tùng Phát Wood Trading & Service Co., Ltd.",
        "Phone: 0909 259 160",
        "Zalo: 0909 259 160"
      ]
    }
  ]
};

export const translations: Record<Lang, typeof vi> = { vi, en };

export function t<K extends TranslationKey>(lang: Lang, key: K): (typeof vi)[K] {
  return translations[lang][key];
}

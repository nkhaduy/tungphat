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
  heroCompany: "Công ty TNHH TM Dịch vụ Gỗ Tùng Phát",
  heroTitle1: "Vật liệu",
  heroTitle2: "gỗ ghép",
  heroTitle3: "và giải pháp",
  heroTitle4: "gia công CNC",
  heroDescription:
    "Phân phối vật liệu từ các thương hiệu uy tín, kết hợp gia công CNC theo kích thước và bản vẽ, phục vụ xưởng nội thất, thợ mộc, kiến trúc sư và khách hàng doanh nghiệp.",
  heroCtaExplore: "Khám phá catalogue",
  heroCtaQuote: "Gửi file nhận báo giá CNC",

  /* ── Partners ── */
  partnersTitle: "ĐỐI TÁC & THƯƠNG HIỆU PHÂN PHỐI",
  partnersDescription:
    "Tùng Phát cung cấp các dòng vật liệu gỗ từ những thương hiệu uy tín trên thị trường.",

  /* ── Product categories ── */
  categoryEyebrow: "Danh mục vật liệu",
  categoryTitle: "Tìm đúng tấm ván cho đúng hạng mục",
  categoryDescription:
    "Chọn theo lõi ván, bề mặt hoặc ứng dụng. Gửi mã để chúng tôi kiểm tra tình trạng hàng và quy cách.",
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
  cncCta: "Tải file CNC lên để nhận báo giá",
  cncFormats: "Định dạng tiếp nhận: DXF · DWG · PDF · AI/CDR · Hình ảnh / bản phác thảo",
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
    ["05", "Nhận hàng hoặc giao hàng"]
  ],
  processScope:
    "Phạm vi dịch vụ: cung cấp vật liệu và gia công tại xưởng. Chưa bao gồm vận chuyển, lắp ráp hoặc lắp đặt tại công trình trừ khi được xác nhận riêng.",

  /* ── Why us ── */
  whyUsEyebrow: "Lý do hợp tác",
  whyUsTitle: "Vì sao chọn Tùng Phát?",
  whyUsItems: [
    "Vật liệu rõ nguồn gốc",
    "Đa dạng mã màu & bề mặt",
    "Gia công CNC chính xác",
    "Hỗ trợ xưởng, thợ & đơn vị thiết kế"
  ],

  /* ── Customer reviews ── */
  reviewEyebrow: "Đánh giá khách hàng",
  reviewTitle: "Khách hàng nói gì về Tùng Phát",
  reviewSubtitle:
    "Những phản hồi từ xưởng nội thất, thợ mộc, kiến trúc sư và khách hàng đã đặt vật liệu/gia công.",
  reviewSummaryTitle: "Được khách hàng tin chọn",
  reviewRating: "4.9",
  reviewSummaryText: "48+ phản hồi từ khách hàng, xưởng nội thất và đơn vị thiết kế",
  reviewFilterAll: "Tất cả",
  reviewPrevious: "Xem đánh giá trước",
  reviewNext: "Xem đánh giá tiếp theo",
  reviewFiveStars: "5 sao",
  reviewReadMore: "Xem thêm",
  reviewCarouselLabel: "Danh sách đánh giá khách hàng",
  reviews: [
    {
      name: "Nguyễn Minh Khang",
      initials: "MK",
      source: "Google Maps",
      role: "Khách hàng cá nhân",
      time: "2 tuần trước",
      content:
        "Nhà mình làm lại tủ bếp nên cần tìm đúng mã ván gần giống bản thiết kế. Tùng Phát tư vấn kỹ, báo giá rõ từng hạng mục và giao đúng loại vật liệu đã chốt."
    },
    {
      name: "Chị Vy Nguyễn",
      initials: "VN",
      source: "Facebook",
      role: "Khách căn hộ",
      time: "3 tuần trước",
      content:
        "Mình không rành về gỗ công nghiệp nhưng được giải thích khá dễ hiểu về MDF, chống ẩm và màu bề mặt. Cách tư vấn nhẹ nhàng, không ép chọn loại đắt."
    },
    {
      name: "Anh Hòa Mộc",
      initials: "HM",
      source: "Google Maps",
      role: "Xưởng nội thất",
      time: "1 tháng trước",
      content:
        "Xưởng mình cần cắt ván theo kích thước gấp. Gửi file xong bên Tùng Phát kiểm tra lại quy cách trước khi chạy máy nên đỡ sai sót."
    },
    {
      name: "Lê Phương Studio",
      initials: "LP",
      source: "Facebook",
      role: "Đơn vị thiết kế nội thất",
      time: "1 tháng trước",
      content:
        "Có catalogue và mã vật liệu để đối chiếu với khách nên làm việc tiện hơn. Khi cần mã tương đương, bên Tùng Phát phản hồi khá nhanh."
    },
    {
      name: "Trần Quốc Bảo",
      initials: "QB",
      source: "Google Maps",
      role: "Thợ mộc",
      time: "2 tháng trước",
      content:
        "Mình đặt vài tấm MDF chống ẩm và nhờ cắt thêm vài chi tiết nhỏ. Hàng đúng độ dày, cạnh cắt ổn, giao tiếp rõ ràng."
    },
    {
      name: "Mộc An Decor",
      initials: "MA",
      source: "Facebook",
      role: "Vendor thi công",
      time: "2 tháng trước",
      content:
        "Quy trình hỏi mã, báo giá, xác nhận file khá rõ. Phù hợp với các đơn cần xử lý nhanh nhưng vẫn phải chắc thông tin trước khi làm."
    },
    {
      name: "KTS Hoàng Nam",
      initials: "HN",
      source: "Google Maps",
      role: "Kiến trúc sư",
      time: "3 tháng trước",
      content:
        "Điểm cộng là có thể trao đổi theo mã vật liệu, bề mặt và ứng dụng. Phần gia công CNC hỗ trợ tốt cho vài chi tiết theo bản vẽ."
    },
    {
      name: "GreenHome Agency",
      initials: "GH",
      source: "Facebook",
      role: "Agency thiết kế & thi công",
      time: "3 tháng trước",
      content:
        "Bên mình cần nguồn vật liệu ổn định cho nhiều hạng mục nhỏ. Tùng Phát phản hồi nhanh, thông tin rõ, hợp tác khá dễ chịu."
    },
    {
      name: "Anh Phúc",
      initials: "AP",
      source: "Google Maps",
      role: "Khách hàng B2B",
      time: "4 tháng trước",
      content:
        "Báo giá không vòng vo, cần mã nào kiểm tra mã đó. Có file thì gửi qua Zalo, bên shop phản hồi nhanh và hỏi lại mấy điểm chưa rõ trước khi làm."
    },
    {
      name: "Nội Thất Gia Minh",
      initials: "GM",
      source: "Facebook",
      role: "Xưởng nội thất",
      time: "4 tháng trước",
      content:
        "Đặt vật liệu nhiều lần, chất lượng ổn định. Có vấn đề về quy cách thì bên Tùng Phát gọi xác nhận trước chứ không tự làm đại."
    }
  ],

  /* ── Workshop media ── */
  workshopEyebrow: "Hình ảnh thực tế",
  workshopTitle: "Xưởng, vật liệu và thành phẩm Tùng Phát",
  workshopDescription:
    "Tập trung vào năng lực kho/xưởng và chất lượng gia công để bạn đánh giá trước khi đặt hàng.",
  workshopDisclaimer: "Ảnh không gian chỉ dùng để minh họa ứng dụng",
  workshopGalleryLabels: [
    "Kho ván và vật liệu",
    "Máy CNC đang vận hành",
    "Quá trình gia công tại xưởng",
    "Mẫu vật liệu thực tế",
    "Cạnh cắt và chi tiết thành phẩm",
    "Bộ mẫu bề mặt"
  ],
  workshopProcessEyebrow: "Quy trình tại xưởng",
  workshopProcessTitle: "Gia công thực tế tại xưởng Tùng Phát",
  workshopProcessDescription:
    "Từ triển khai bản vẽ, cắt CNC đến dán chỉ hoàn thiện, từng công đoạn đều được đội ngũ Tùng Phát thực hiện trực tiếp tại xưởng, đảm bảo độ chính xác và chất lượng theo yêu cầu của từng đơn hàng.",
  workshopSteps: [
    "Triển khai và kiểm tra file gia công",
    "Cắt CNC chính xác theo kích thước",
    "Dán chỉ và hoàn thiện sản phẩm"
  ],

  /* ── Contact form ── */
  formTitle: "Bạn đã có mã vật liệu hoặc bản vẽ?",
  formDescription:
    "Gửi thông tin để chúng tôi kiểm tra hàng và báo giá nhanh.",
  formZalo: "Liên hệ Zalo: 0909 259 160",
  formCall: "Gọi tư vấn: 0909 259 160",
  formHeading: "Gửi yêu cầu báo giá",
  formSubheading: "Điền quy cách càng rõ, báo giá càng nhanh và sát nhu cầu.",
  formName: "Họ và tên *",
  formNamePlaceholder: "Nguyễn Văn A",
  formPhone: "Số điện thoại *",
  formPhonePlaceholder: "0909 259 160",
  formNeed: "Nhu cầu",
  formNeedPlaceholder: "Chọn nhu cầu",
  formNeedMaterial: "Mua vật liệu",
  formNeedCNC: "Gia công CNC",
  formNeedBoth: "Cả vật liệu và CNC",
  formQuantity: "Số lượng / quy cách",
  formQuantityPlaceholder: "Ví dụ: 20 tấm, 18 mm",
  formMessage: "Thông tin cần báo giá",
  formMessagePlaceholder:
    "Mã vật liệu, kích thước, số lượng hoặc yêu cầu gia công...",
  formFileUpload: "Tải file DXF, DWG, PDF, AI/CDR hoặc hình phác thảo",
  formSubmit: "Gửi yêu cầu báo giá",

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

  /* ── Floating CTAs ── */
  floatingQuote: "Nhận báo giá",

  /* ── Breadcrumb ── */
  breadcrumbHome: "Trang chủ",
  breadcrumbProducts: "Sản phẩm",

  /* ── Catalogue pages ── */
  catalogueTitle: "Catalogue",
  catalogueDescription: "Catalogue sản phẩm chính thức từ",
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
        "Thông tin được thu thập khi bạn: gửi yêu cầu báo giá qua website, tải file thiết kế CNC (DXF, DWG, PDF, AI/CDR), liên hệ qua Zalo, điện thoại hoặc email, và khi bạn đặt hàng vật liệu hoặc gia công tại Tùng Phát."
      ]
    },
    {
      id: "pham-vi",
      title: "02. Phạm vi sử dụng thông tin",
      content: [
        "Toàn bộ thông tin khách hàng cung cấp chỉ được sử dụng trong nội bộ Tùng Phát cho các mục đích: kiểm tra tình trạng hàng và mã vật liệu, lập báo giá và xác nhận đơn hàng, tiếp nhận và xử lý file gia công CNC, liên hệ giao nhận và hỗ trợ sau bán hàng.",
        "Chúng tôi không sử dụng thông tin khách hàng vào bất kỳ mục đích nào ngoài phạm vi đã nêu, trừ khi có sự đồng ý riêng từ khách hàng hoặc theo yêu cầu của cơ quan nhà nước có thẩm quyền.",
        "Tùng Phát không bán, trao đổi hoặc cho thuê thông tin cá nhân của khách hàng cho bất kỳ bên thứ ba nào."
      ]
    },
    {
      id: "thoi-gian",
      title: "03. Thời gian lưu trữ thông tin",
      content: [
        "Thông tin khách hàng được lưu trữ trong suốt quá trình hợp tác và giao dịch. Đối với các giao dịch đã hoàn tất, dữ liệu được lưu giữ trong thời gian cần thiết để phục vụ công tác bảo hành, đối chiếu và tuân thủ quy định pháp luật.",
        "Khi thông tin không còn cần thiết cho các mục đích đã nêu, Tùng Phát sẽ xóa hoặc ẩn danh dữ liệu một cách an toàn."
      ]
    },
    {
      id: "don-vi",
      title: "04. Đơn vị tiếp nhận và quản lý thông tin",
      content: [
        "Đơn vị chịu trách nhiệm tiếp nhận và quản lý thông tin khách hàng:",
        "Công ty TNHH Thương mại Dịch vụ Gỗ Tùng Phát",
        "Địa chỉ: TP.HCM và khu vực lân cận",
        "Điện thoại: 0909 259 160",
        "Email: hello@tungphatwood.vn",
        "Mọi thắc mắc liên quan đến việc thu thập và xử lý dữ liệu, quý khách vui lòng liên hệ qua các kênh trên."
      ]
    },
    {
      id: "cam-ket",
      title: "05. Cam kết bảo mật thông tin",
      content: [
        "Tùng Phát cam kết áp dụng các biện pháp bảo mật kỹ thuật và tổ chức để bảo vệ dữ liệu khách hàng khỏi truy cập trái phép, thay đổi hoặc tiết lộ. Dữ liệu được lưu trữ trên hệ thống có kiểm soát truy cập.",
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
        "Email: hello@tungphatwood.vn",
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
        "Bằng việc truy cập website tungphatwood.vn, bạn xác nhận đã đọc, hiểu và đồng ý với các điều khoản sử dụng này.",
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
        "Báo giá gửi qua website là báo giá sơ bộ, có thể thay đổi tùy theo quy cách thực tế, số lượng và thời điểm đặt hàng.",
        "Đơn hàng chỉ được xác nhận sau khi hai bên thống nhất quy cách, giá cả và thời gian giao hàng qua văn bản hoặc tin nhắn xác nhận."
      ]
    },
    {
      id: "file",
      title: "5. File thiết kế và gia công CNC",
      content: [
        "Khi gửi file thiết kế (DXF, DWG, PDF, AI/CDR), bạn đảm bảo mình có quyền sử dụng các file đó và không vi phạm bản quyền của bên thứ ba.",
        "Tùng Phát cam kết chỉ sử dụng file của bạn cho mục đích báo giá và gia công, không chia sẻ cho bên thứ ba khi chưa có sự đồng ý."
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
        "Email: hello@tungphatwood.vn"
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
  heroTitle3: "materials &",
  heroTitle4: "CNC solutions",
  heroDescription:
    "Supplying materials from trusted brands, combined with CNC machining to specification, serving furniture workshops, carpenters, architects, and business clients.",
  heroCtaExplore: "Explore catalogue",
  heroCtaQuote: "Send file for CNC quote",

  partnersTitle: "PARTNERS & DISTRIBUTED BRANDS",
  partnersDescription:
    "Tùng Phát supplies wood material lines from reputable brands in the market.",

  categoryEyebrow: "Material Categories",
  categoryTitle: "Find the right panel for the right application",
  categoryDescription:
    "Browse by core, surface, or application. Send a material code and we will check stock and specifications.",
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
  cncCta: "Upload CNC file for a quote",
  cncFormats: "Accepted formats: DXF · DWG · PDF · AI/CDR · Images / sketches",
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
    ["05", "Pickup or delivery"]
  ],
  processScope:
    "Scope of service: material supply and in-house machining. Transport, assembly, or on-site installation are not included unless confirmed separately.",

  whyUsEyebrow: "Why Partner with Us",
  whyUsTitle: "Why choose Tùng Phát?",
  whyUsItems: [
    "Verified material sources",
    "Wide range of colors & surfaces",
    "Precision CNC machining",
    "Support for workshops, carpenters & designers"
  ],

  reviewEyebrow: "Customer Reviews",
  reviewTitle: "What customers say about Tùng Phát",
  reviewSubtitle:
    "Feedback from furniture workshops, carpenters, architects, and customers who ordered materials or machining.",
  reviewSummaryTitle: "Trusted by customers",
  reviewRating: "4.9",
  reviewSummaryText: "48+ responses from customers, furniture workshops, and design teams",
  reviewFilterAll: "All",
  reviewPrevious: "Previous review",
  reviewNext: "Next review",
  reviewFiveStars: "5 stars",
  reviewReadMore: "Read more",
  reviewCarouselLabel: "Customer review list",
  reviews: [
    {
      name: "Nguyen Minh Khang",
      initials: "MK",
      source: "Google Maps",
      role: "Individual customer",
      time: "2 weeks ago",
      content:
        "We were redoing our kitchen cabinets and needed a panel code close to the design. Tùng Phát advised carefully, priced each item clearly, and delivered the material we confirmed."
    },
    {
      name: "Vy Nguyen",
      initials: "VN",
      source: "Facebook",
      role: "Apartment owner",
      time: "3 weeks ago",
      content:
        "I do not know much about engineered wood, but they explained MDF, moisture resistance, and surface colors in an easy way. The advice felt calm, with no pressure to choose the expensive option."
    },
    {
      name: "Anh Hoa Moc",
      initials: "HM",
      source: "Google Maps",
      role: "Furniture workshop",
      time: "1 month ago",
      content:
        "Our workshop needed cut-to-size panels urgently. After we sent the file, Tùng Phát checked the specs again before machining, which helped reduce mistakes."
    },
    {
      name: "Le Phuong Studio",
      initials: "LP",
      source: "Facebook",
      role: "Interior design studio",
      time: "1 month ago",
      content:
        "Having catalogues and material codes makes client discussions easier. When we needed an equivalent code, Tùng Phát responded quite quickly."
    },
    {
      name: "Tran Quoc Bao",
      initials: "QB",
      source: "Google Maps",
      role: "Carpenter",
      time: "2 months ago",
      content:
        "I ordered several moisture-resistant MDF boards and asked them to cut a few small details. Thickness was correct, cut edges were clean enough, and communication was clear."
    },
    {
      name: "Moc An Decor",
      initials: "MA",
      source: "Facebook",
      role: "Fit-out vendor",
      time: "2 months ago",
      content:
        "The flow for checking codes, pricing, and confirming files is clear. It suits orders that need quick handling but still require solid information before production."
    },
    {
      name: "Architect Hoang Nam",
      initials: "HN",
      source: "Google Maps",
      role: "Architect",
      time: "3 months ago",
      content:
        "A plus is that we can discuss by material code, surface finish, and application. Their CNC machining also helped with a few drawing-based details."
    },
    {
      name: "GreenHome Agency",
      initials: "GH",
      source: "Facebook",
      role: "Design & fit-out agency",
      time: "3 months ago",
      content:
        "We need a stable material source for many small scopes. Tùng Phát replies quickly, gives clear information, and is pleasant to work with."
    },
    {
      name: "Anh Phuc",
      initials: "AP",
      source: "Google Maps",
      role: "B2B customer",
      time: "4 months ago",
      content:
        "Quotes are straight to the point, and they check the exact code we ask for. If we send files through Zalo, they reply quickly and ask about unclear details before proceeding."
    },
    {
      name: "Gia Minh Furniture",
      initials: "GM",
      source: "Facebook",
      role: "Furniture workshop",
      time: "4 months ago",
      content:
        "We have ordered materials several times and the quality has been stable. If there is a spec issue, Tùng Phát calls to confirm instead of just doing it their own way."
    }
  ],

  workshopEyebrow: "Real-World Images",
  workshopTitle: "Tùng Phát Workshop, Materials & Finished Products",
  workshopDescription:
    "Focus on warehouse and workshop capability and machining quality so you can evaluate before ordering.",
  workshopDisclaimer: "Images are for application illustration only",
  workshopGalleryLabels: [
    "Panel and material warehouse",
    "CNC machine in operation",
    "Workshop machining process",
    "Actual material samples",
    "Cut edges and finished details",
    "Surface sample collection"
  ],
  workshopProcessEyebrow: "Workshop Process",
  workshopProcessTitle: "Real machining at Tùng Phát workshop",
  workshopProcessDescription:
    "From drawing review and CNC cutting to edge-banding and finishing, every step is performed directly by the Tùng Phát team at our workshop, ensuring accuracy and quality to each order's specifications.",
  workshopSteps: [
    "Review and verify machining files",
    "Precision CNC cutting to specification",
    "Edge-banding and finishing"
  ],

  formTitle: "Already have a material code or drawing?",
  formDescription:
    "Send us your details and we'll check stock and provide a quick quote.",
  formZalo: "Contact via Zalo: 0909 259 160",
  formCall: "Call for consultation: 0909 259 160",
  formHeading: "Submit a Quote Request",
  formSubheading:
    "The more detail you provide, the faster and more accurate the quote.",
  formName: "Full name *",
  formNamePlaceholder: "John Doe",
  formPhone: "Phone number *",
  formPhonePlaceholder: "0909 259 160",
  formNeed: "Requirement",
  formNeedPlaceholder: "Select requirement",
  formNeedMaterial: "Purchase materials",
  formNeedCNC: "CNC machining",
  formNeedBoth: "Both materials & CNC",
  formQuantity: "Quantity / Specifications",
  formQuantityPlaceholder: "e.g. 20 panels, 18 mm",
  formMessage: "Quote details",
  formMessagePlaceholder:
    "Material code, dimensions, quantity, or machining requirements...",
  formFileUpload: "Upload DXF, DWG, PDF, AI/CDR file or sketch",
  formSubmit: "Send Quote Request",

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
        "Information is collected when you: submit a quote request through the website, upload CNC design files (DXF, DWG, PDF, AI/CDR), contact us via Zalo, phone, or email, and when you place material or machining orders with Tùng Phát."
      ]
    },
    {
      id: "pham-vi",
      title: "02. Scope of Information Use",
      content: [
        "All customer-provided information is used internally by Tùng Phát for the following purposes: checking stock and material codes, preparing quotes and confirming orders, receiving and processing CNC machining files, and coordinating delivery and after-sales support.",
        "We do not use customer information for any purpose beyond the stated scope unless with the customer's explicit consent or as required by competent government authorities.",
        "Tùng Phát does not sell, trade, or rent customer personal information to any third parties."
      ]
    },
    {
      id: "thoi-gian",
      title: "03. Information Retention Period",
      content: [
        "Customer information is retained throughout the cooperation and transaction period. For completed transactions, data is kept for as long as necessary to support warranty, reconciliation, and legal compliance.",
        "When information is no longer needed for the stated purposes, Tùng Phát will securely delete or anonymize the data."
      ]
    },
    {
      id: "don-vi",
      title: "04. Information Management Unit",
      content: [
        "The unit responsible for receiving and managing customer information:",
        "Tùng Phát Wood Trading & Service Co., Ltd.",
        "Address: Ho Chi Minh City and surrounding areas",
        "Phone: 0909 259 160",
        "Email: hello@tungphatwood.vn",
        "For any inquiries regarding data collection and processing, please contact us through the channels above."
      ]
    },
    {
      id: "cam-ket",
      title: "05. Information Security Commitment",
      content: [
        "Tùng Phát is committed to implementing technical and organizational security measures to protect customer data from unauthorized access, alteration, or disclosure. Data is stored on access-controlled systems.",
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
        "Email: hello@tungphatwood.vn",
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
        "By accessing the tungphatwood.vn website, you confirm that you have read, understood, and agree to these terms of use.",
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
        "Quotes sent through the website are preliminary and may change depending on actual specifications, quantities, and order timing.",
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
        "Email: hello@tungphatwood.vn"
      ]
    }
  ]
};

export const translations: Record<Lang, typeof vi> = { vi, en };

export function t(lang: Lang, key: TranslationKey): any {
  return translations[lang][key];
}

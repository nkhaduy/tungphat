export type ProductFaqItem = { question: string; answer: string };

export type ProductContent = {
  orderingSteps: string[];
  faq: ProductFaqItem[];
};

type ServiceContent = { faq: ProductFaqItem[] };

const moneyPageOverrides: Record<string, ProductContent> = {
  "van-mdf": {
    orderingSteps: [
      "Gửi hạng mục, kích thước, độ dày, số lượng và loại bề mặt cần hỏi.",
      "Nếu đã có mã hoặc ảnh mẫu, gửi kèm; cần CNC thì gửi thêm file hoặc bản phác thảo.",
      "Tùng Phát kiểm tra quy cách và trao đổi lựa chọn phù hợp trước khi báo giá.",
    ],
    faq: [
      {
        question: "Nên chọn độ dày ván MDF theo tiêu chí nào?",
        answer: "Độ dày nên đi cùng hạng mục, kích thước chi tiết, cách liên kết và bản vẽ. Gửi danh sách chi tiết hoặc kích thước dự kiến để kiểm tra đúng cốt và quy cách.",
      },
      {
        question: "Ván MDF thường có dùng ở khu vực ẩm không?",
        answer: "MDF thường phù hợp hơn với môi trường khô. Nếu vị trí có độ ẩm cao hơn, hãy xem MDF chống ẩm và nói rõ phần gần nước, bề mặt cùng cách xử lý cạnh.",
      },
    ],
  },
  "mdf-chong-am": {
    orderingSteps: [
      "Gửi hạng mục, vị trí sử dụng, kích thước, độ dày và số lượng.",
      "Nêu rõ bề mặt, cạnh để lộ và phần nào cần cắt hoặc CNC nếu có.",
      "Tùng Phát kiểm tra thông tin cốt ván và trao đổi phương án phù hợp trước khi báo giá.",
    ],
    faq: [
      {
        question: "MDF chống ẩm có thay thế ván chống nước không?",
        answer: "Không nên hiểu như vậy. MDF chống ẩm phù hợp hơn MDF thường trong điều kiện ẩm, nhưng vị trí tiếp xúc nước trực tiếp cần được xem riêng theo cốt, bề mặt, cạnh và cách lắp đặt.",
      },
      {
        question: "Làm tủ bếp bằng MDF chống ẩm cần gửi gì?",
        answer: "Gửi vị trí gần nước, kích thước chi tiết, độ dày, bề mặt, cạnh cần xử lý và số lượng. Nếu có bản vẽ hoặc cần CNC, gửi kèm file để trao đổi đúng phần việc.",
      },
    ],
  },
  "go-ghep": {
    orderingSteps: [
      "Gửi hạng mục, loại gỗ muốn xem, kích thước, độ dày và số lượng.",
      "Nêu mặt sử dụng, màu/vân, mối ghép hoặc ảnh mẫu nếu những yếu tố này quan trọng.",
      "Nếu cần cắt hoặc CNC, gửi thêm danh sách chi tiết, đơn vị đo và file hoặc bản phác thảo.",
    ],
    faq: [
      {
        question: "Nên bắt đầu từ gỗ ghép cao su hay gỗ ghép tràm?",
        answer: "Bắt đầu từ hạng mục và mặt sử dụng, sau đó so màu/vân, mối ghép và quy cách của từng hướng. Gửi kích thước hoặc ảnh mẫu để trao đổi đúng nhóm gỗ hơn.",
      },
      {
        question: "Gỗ ghép cần kiểm tra gì trước khi hỏi hàng?",
        answer: "Nên chuẩn bị hạng mục, kích thước, độ dày, số lượng, mặt nhìn thấy và yêu cầu hoàn thiện. Nếu có cắt hoặc CNC, ghi thêm đường cắt, lỗ, rãnh và mặt gia công.",
      },
    ],
  },
  "go-ghep-cao-su": {
    orderingSteps: [
      "Gửi hạng mục, kích thước, độ dày, số lượng và mặt bàn hoặc chi tiết cần làm.",
      "Nêu màu/vân mong muốn, mối ghép, cạnh để lộ và ảnh mẫu nếu có.",
      "Cần cắt hoặc CNC thì gửi danh sách chi tiết, đơn vị đo và file hoặc bản phác thảo.",
    ],
    faq: [
      {
        question: "Mặt bàn gỗ ghép cao su nên gửi quy cách thế nào?",
        answer: "Gửi dài, rộng, độ dày, số lượng, mặt sử dụng và yêu cầu cạnh. Nếu mặt bàn có biên dạng hoặc lỗ cần gia công, đánh dấu rõ trên bản vẽ hoặc file.",
      },
      {
        question: "Gỗ ghép cao su có thể trao đổi gia công CNC không?",
        answer: "Có thể gửi yêu cầu cắt, khoan, soi rãnh hoặc biên dạng để kiểm tra theo từng tấm và file. Hãy nêu mặt gia công, kích thước, số lượng và phần cần hoàn thiện tiếp.",
      },
    ],
  },
};

const servicePageOverrides: Record<string, ServiceContent> = {
  "cat-cnc-go": {
    faq: [
      {
        question: "Cần chuẩn bị gì khi gửi yêu cầu cắt CNC gỗ?",
        answer: "Chuẩn bị vật liệu, độ dày, kích thước, số lượng, đơn vị đo và file hoặc bản vẽ. Ghi rõ lỗ, rãnh, mặt gia công và cạnh để lộ nếu có.",
      },
      {
        question: "Website có thể xác nhận ngay định dạng file, dung sai, thời gian và giá không?",
        answer: "Các mục này cần được xem cùng file, vật liệu, kích thước và số lượng cụ thể. Gửi đủ thông tin để xưởng trao đổi đúng phạm vi thay vì đoán theo tên hạng mục.",
      },
    ],
  },
  "gia-cong-cnc-mdf": {
    faq: [
      {
        question: "Cần gửi gì để Tùng Phát kiểm tra yêu cầu CNC MDF?",
        answer: "Gửi loại MDF, độ dày, kích thước, số lượng, đơn vị đo và file hoặc bản phác thảo. Ghi thêm đường cắt, lỗ, rãnh và mặt gia công.",
      },
      {
        question: "Tấm MDF đã có bề mặt hoặc lớp phủ cần lưu ý gì?",
        answer: "Nêu mã hoặc ảnh bề mặt, mặt cần gia công và cạnh để lộ. Những thông tin này giúp trao đổi cách đặt tấm và phần hoàn thiện sau khi cắt.",
      },
      {
        question: "MDF chống ẩm có cần xác nhận riêng trước khi gia công không?",
        answer: "Có. Hãy ghi rõ cốt MDF chống ẩm, vị trí sử dụng, độ dày, bề mặt và phần việc cần làm để kiểm tra đúng vật liệu trước khi trao đổi CNC.",
      },
      {
        question: "Vì sao chưa thể báo giá CNC MDF khi chưa xem file và vật liệu?",
        answer: "Phạm vi gia công phụ thuộc vào vật liệu, độ dày, kích thước, đường cắt, lỗ, rãnh và số lượng. File hoặc bản phác thảo giúp xác định đúng phần việc cần trao đổi.",
      },
    ],
  },
};

export function getProductContent(slug: string, fallback: ProductContent): ProductContent {
  const override = moneyPageOverrides[slug];
  if (!override) return fallback;

  const hasRepeatedSteps = hasRepeatedValue(fallback.orderingSteps);
  const hasRepeatedFaqAnswers = hasRepeatedValue(fallback.faq.map((item) => item.answer));
  if (!hasRepeatedSteps && !hasRepeatedFaqAnswers) return fallback;

  return {
    orderingSteps: hasRepeatedSteps ? [...override.orderingSteps] : fallback.orderingSteps,
    faq: hasRepeatedFaqAnswers ? override.faq.map((item) => ({ ...item })) : fallback.faq,
  };
}

function hasRepeatedValue(values: string[]) {
  return new Set(values).size < values.length;
}

export function getServiceContent(slug: string, fallback: ServiceContent): ServiceContent {
  const override = servicePageOverrides[slug];
  if (!override || !hasRepeatedValue(fallback.faq.map((item) => item.answer))) return fallback;
  return { faq: override.faq.map((item) => ({ ...item })) };
}

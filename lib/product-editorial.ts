import type { ContentEntry } from "@/lib/content";
import { materialAdditionalSections, materialBodyOverrides } from "@/lib/content-overhaul";
import { extraMaterialGuidance } from "@/lib/material-wave2";
import type { ProductFrontmatter } from "@/lib/content-schema";
import { allMaterialCards, homeProductCards } from "@/lib/product-taxonomy";
import imageIndex from "@/data/product-image-index.json";
import productIntros from "@/data/product-intros.json";
import { cmsManagedMaterialSlugs } from "@/lib/product-ownership";

export type MaterialEditorial = {
  intro: string;
  structure: string;
  applications: string[];
  selection: string;
  options: string;
  related: string[];
  catalogue?: string;
  references: string[];
};

// General material guidance, not a specification or a claim of current stock.
// Sources and the CMS merge policy are documented in docs/product-system/.
export const productEditorial: Record<string, MaterialEditorial> = {
  "van-mdf": {
    intro: productIntros["van-mdf" as keyof typeof productIntros],
    structure: "MDF được làm từ sợi gỗ ép với chất kết dính; HDF cũng là ván sợi nhưng thuộc nhóm có mật độ cao hơn. Mỗi loại có đặc điểm và cách sử dụng riêng, vì vậy nên trao đổi rõ loại ván khi đặt hàng. Bề mặt có thể hoàn thiện bằng Melamine, Laminate, Veneer hoặc sơn tùy dòng ván và nhu cầu.",
    applications: ["Thùng tủ, cánh tủ và kệ trong nhà","Bàn, vách trang trí và các chi tiết nội thất","Cắt ván, khoan và gia công CNC theo bản vẽ"],
    selection: "Vị trí sử dụng, kích thước chi tiết và khoảng đỡ đều ảnh hưởng đến việc chọn ván. Với khu vực có độ ẩm cao, nên hỏi dòng chống ẩm phù hợp và chú ý xử lý các cạnh sau khi cắt. Hãy kiểm tra thông tin của từng sản phẩm thay vì chỉ dựa vào màu sắc của tấm.",
    options: "Nếu đã có bản vẽ, hãy gửi kích thước, số lượng và loại mặt hoàn thiện mong muốn. Tùng Phát sẽ kiểm tra lựa chọn phù hợp, đồng thời trao đổi về phần cắt ván, CNC hoặc dán cạnh khi cần.",
    related: ["mdf-chong-am", "van-okal", "melamine"], references: ["egger-fibreboard", "medite-mr"],
  },
  "van-hdf": {
    intro: productIntros["van-hdf" as keyof typeof productIntros],
    structure: "Ván HDF được ép từ sợi gỗ và chất kết dính. Bề mặt tấm có thể được hoàn thiện theo nhiều cách tùy sản phẩm. Khả năng chịu ẩm, cách gia công và phạm vi sử dụng cần xem theo tài liệu của dòng ván cụ thể.",
    applications: ["Chi tiết nội thất có yêu cầu dùng HDF","Lớp nền cho các sản phẩm hoàn thiện","Tấm trang trí theo thiết kế"],
    selection: "Khi chọn HDF, nên xem rõ mục đích sử dụng, điều kiện môi trường và hướng dẫn gia công. HDF trong một sản phẩm sàn hoàn chỉnh không đồng nghĩa với việc mọi tấm HDF đều có thể dùng trực tiếp làm sàn.",
    options: "Gửi tên dòng ván hoặc bản vẽ nếu đã có chỉ định. Nếu đang chọn vật liệu, hãy cho biết hạng mục, kích thước và bề mặt mong muốn để Tùng Phát kiểm tra trước khi báo giá.",
    related: ["van-mdf", "mdf-chong-am", "laminate"], references: ["egger-fibreboard"],
  },
  "mdf-chong-am": {
    intro: productIntros["mdf-chong-am" as keyof typeof productIntros],
    structure: "Ván vẫn có kết cấu từ sợi gỗ và chất kết dính; một số dòng có màu xanh để dễ nhận biết. Các ký hiệu LMR, MMR và HMR cần được đối chiếu theo từng hãng. Màu xanh không thay thế thông tin kỹ thuật, và chống ẩm không có nghĩa là chịu được ngâm nước.",
    applications: ["Tủ bếp và tủ lưu trữ ở vị trí phù hợp","Cánh tủ, vách và chi tiết nội thất phủ trang trí","Chi tiết cắt hoặc gia công CNC theo bản vẽ"],
    selection: "Nên phân biệt khu vực khô với vị trí gần chậu rửa hoặc nơi có nguy cơ rò nước. Cạnh cắt, lỗ khoan và mối nối cần được hoàn thiện cẩn thận; những chỗ thường xuyên tiếp xúc với nước cần được xem xét riêng.",
    options: "Khi liên hệ, hãy gửi vị trí sử dụng, loại ván hoặc nhãn tấm nếu đã chọn, cùng mã màu và số lượng. Tùng Phát sẽ kiểm tra dòng hàng và trao đổi phần gia công theo yêu cầu.",
    related: ["van-mdf", "van-nhua-pvc", "van-mfc"], references: ["medite-mr"],
  },
  "van-okal": {
    intro: productIntros["van-okal" as keyof typeof productIntros],
    structure: "Ở cạnh tấm Okal có thể thấy các hạt dăm gỗ; đây là điểm khác với bề mặt sợi nhỏ của MDF. Ván có thể để mộc hoặc được hoàn thiện bằng lớp phủ phù hợp. MFC là ván dăm phủ Melamine, còn MDF phủ Melamine là một sản phẩm khác.",
    applications: ["Thùng tủ, bàn và kệ nội thất","Chi tiết dạng tấm cần phủ màu hoặc vân gỗ","Đồ nội thất có yêu cầu dán cạnh đồng bộ"],
    selection: "Nên chọn theo môi trường sử dụng, tải trọng và cách liên kết của từng chi tiết. Cạnh sau khi cắt cần được dán hoặc xử lý phù hợp. Nếu chọn MFC, hãy xem mẫu màu thực tế và xác nhận số mặt phủ trước khi đặt.",
    options: "Bạn có thể gửi kích thước, số lượng và mã màu mong muốn. Nếu cần cắt ván hoặc dán cạnh, hãy ghi rõ các cạnh cần hoàn thiện để Tùng Phát kiểm tra và báo giá.",
    related: ["van-mdf", "melamine", "chi-nep-nhua"], references: ["egger-chipboard"],
  },
  "van-mfc": {
    intro: productIntros["van-mfc" as keyof typeof productIntros],
    structure: "Bên trong tấm là ván dăm, bên ngoài là lớp Melamine tạo màu và vân. MDF phủ Melamine có thể trông tương tự nhưng phần ván bên trong khác nhau. Sau khi cắt, cạnh tấm thường được dán chỉ để hoàn thiện.",
    applications: ["Thùng tủ áo và tủ lưu trữ","Bàn làm việc và kệ nội thất","Chi tiết cần phối mặt ván với chỉ cạnh"],
    selection: "Hãy xem mẫu màu dưới ánh sáng thực tế và chọn loại ván phù hợp với vị trí sử dụng. Với mặt kệ dài hoặc chi tiết chịu tải, cần xem thêm độ dày và khoảng đỡ thay vì chọn chỉ theo màu sắc.",
    options: "Bạn có thể tra mã trong catalogue rồi gửi mã màu, quy cách và số lượng. Nếu cần cắt và dán chỉ, gửi thêm kích thước chi tiết để Tùng Phát kiểm tra.",
    related: ["van-okal", "melamine", "chi-nep-nhua"], catalogue: "/catalogue/?group=melamine", references: ["egger-chipboard", "egger-melamine"],
  },
  "van-plywood": {
    intro: productIntros["van-plywood" as keyof typeof productIntros],
    structure: "Các lớp gỗ thường được xếp đổi hướng thớ trước khi ép. Plywood có thể dùng mặt mộc hoặc kết hợp với Melamine, Laminate và Veneer tùy sản phẩm. Loại gỗ, chất lượng lớp mặt và chất kết dính khác nhau giữa các dòng ván.",
    applications: ["Thùng tủ, kệ và các chi tiết nội thất","Làm nền phủ Veneer hoặc Laminate","Chi tiết để lộ cạnh nhiều lớp theo thiết kế"],
    selection: "Khi chọn ván, hãy xem độ phẳng, mặt tấm và phần cạnh; nếu cạnh để lộ, nên xem mẫu thực tế trước. Khả năng dùng ở nơi ẩm hoặc ngoài trời phụ thuộc từng loại ván và không thể kết luận chỉ từ tên Plywood.",
    options: "Hãy gửi hạng mục, quy cách và yêu cầu về mặt ván khi cần tư vấn. Với ván đã phủ Melamine, nên ghi thêm mã màu, số mặt phủ và phần cạnh cần dán.",
    related: ["tam-veneer", "melamine", "laminate"], references: ["apa-plywood"],
  },
  "plywood-phu-melamine": {
    intro: productIntros["plywood-phu-melamine" as keyof typeof productIntros],
    structure: "Phần ván ép và lớp phủ là hai phần cần xem khi chọn sản phẩm. Loại này khác với ván dăm phủ Melamine và cũng khác ván ép phủ phim. Mỗi loại có cấu tạo và mục đích sử dụng riêng.",
    applications: ["Thùng tủ và kệ dùng ván ép phủ mặt","Chi tiết nội thất cần mặt màu hoàn thiện","Phối bề mặt ván với chỉ dán cạnh"],
    selection: "Nên kiểm tra mặt phủ, độ phẳng và cạnh tấm theo mẫu thực tế. Lớp Melamine không thay thế việc chọn ván phù hợp với môi trường; các cạnh cắt và mối nối vẫn cần được xử lý cẩn thận.",
    options: "Gửi mã màu, số mặt cần phủ, quy cách và số lượng để Tùng Phát kiểm tra. Nếu có bản vẽ cắt hoặc yêu cầu dán cạnh, bạn có thể gửi kèm khi hỏi hàng.",
    related: ["van-plywood", "van-mfc", "melamine"], catalogue: "/catalogue/?group=melamine", references: ["apa-plywood", "egger-melamine"],
  },
  "go-ghep-cao-su": {
    intro: productIntros["go-ghep-cao-su" as keyof typeof productIntros],
    structure: "Màu sắc, vân gỗ và cách ghép có thể khác nhau giữa các tấm. Một số mặt để lộ rõ đường nối giữa các thanh, tạo vẻ tự nhiên riêng. Lớp sơn hoặc hoàn thiện cần được chọn theo thiết kế và điều kiện sử dụng.",
    applications: ["Mặt bàn, mặt kệ và chi tiết tủ","Vách trang trí có vân gỗ tự nhiên","Các chi tiết cần cắt hoặc gia công CNC"],
    selection: "Nếu làm mặt bàn hoặc nhiều chi tiết đặt cạnh nhau, nên xem mẫu để thống nhất màu, vân và mức chấp nhận mắt gỗ. Gỗ có thể thay đổi theo độ ẩm môi trường, vì vậy cần chú ý cách liên kết và hoàn thiện bề mặt.",
    options: "Gửi kích thước, số lượng, kiểu ghép và mặt cần ưu tiên khi hỏi hàng. Nếu cần gia công, hãy đánh dấu chiều vân và mặt sử dụng trên bản vẽ để trao đổi rõ hơn.",
    related: ["tam-veneer", "van-plywood", "van-mdf"], references: ["cms-rubberwood", "wood-handbook"],
  },
  "go-ghep-tram": {
    intro: productIntros["go-ghep-tram" as keyof typeof productIntros],
    structure: "Các thanh gỗ được liên kết thành tấm; mối ghép, hướng thanh và màu sắc là những đặc điểm có thể quan sát trên bề mặt. Tên gọi thương mại chưa đủ để xác định mọi thông tin về loài gỗ hoặc chất lượng của từng lô.",
    applications: ["Mặt bàn và kệ nội thất","Vách trang trí có vân gỗ","Chi tiết gia công từ tấm ghép"],
    selection: "Nên xem mẫu thực tế để chọn màu, vân, kiểu ghép và mức chấp nhận mắt gỗ. Với mặt rộng hoặc chi tiết chịu tải, cần tính thêm phần đỡ, liên kết và lớp hoàn thiện phù hợp.",
    options: "Khi hỏi hàng, hãy gửi kích thước, số lượng, ảnh mẫu và mặt cần ưu tiên. Nếu cần cắt hoặc CNC, đánh dấu hướng thanh và mặt gia công trên bản vẽ.",
    related: ["go-ghep-cao-su", "tam-veneer", "van-plywood"], references: ["cms-acacia", "wood-handbook"],
  },
  "melamine": {
    intro: productIntros["melamine" as keyof typeof productIntros],
    structure: "Bề mặt Melamine thường được tạo từ giấy trang trí tẩm nhựa rồi ép lên tấm ván phù hợp. Ván bên dưới có thể là MDF, ván dăm hoặc loại khác tùy sản phẩm. Cùng một màu nhìn bên ngoài vẫn cần chọn rõ loại ván và cách hoàn thiện cạnh.",
    applications: ["Cánh tủ, thùng tủ và kệ nội thất","Mặt bàn và vách trang trí","Phối màu mặt ván với chỉ dán cạnh"],
    selection: "Màu trên màn hình có thể khác mẫu thật, vì vậy nên xem trực tiếp sắc độ, vân và độ nhám trước khi chọn. Với nơi có độ ẩm cao, cần chú ý cả loại ván bên dưới lẫn cách xử lý cạnh và mối nối.",
    options: "Bạn có thể tra mã màu trong catalogue và gửi mã cùng quy cách, số lượng. Tùng Phát sẽ kiểm tra loại ván, mặt phủ và chỉ cạnh phù hợp trước khi báo giá.",
    related: ["van-okal", "van-mdf", "chi-nep-nhua"], catalogue: "/catalogue/?group=melamine", references: ["egger-melamine"],
  },
  "laminate": {
    intro: productIntros["laminate" as keyof typeof productIntros],
    structure: "Tấm Laminate gồm nhiều lớp vật liệu được ép với nhau; dòng HPL được sản xuất dưới nhiệt và áp lực cao. Khác với Melamine ép trực tiếp lên ván, Laminate thường được dán lên bề mặt nền bằng phương pháp phù hợp.",
    applications: ["Mặt bàn và quầy nội thất","Cánh tủ, vách và tấm trang trí","Các chi tiết cần phối màu mặt và cạnh"],
    selection: "Nên xem mẫu thật để chọn màu, độ nhám và bề mặt phù hợp với vị trí sử dụng. Phần cạnh, mối nối và lỗ khoét cũng cần được tính trước; nếu có chi tiết cong, hãy kiểm tra khả năng gia công của đúng loại tấm.",
    options: "Gửi mã Laminate, loại ván nền, kích thước và yêu cầu hoàn thiện để được tư vấn. Nếu có bản vẽ, hãy đánh dấu những mặt nhìn thấy và các cạnh cần xử lý.",
    related: ["melamine", "van-plywood", "chi-nep-nhua"], catalogue: "/catalogue/?group=laminate", references: ["egger-laminate"],
  },
  "acrylic": {
    intro: productIntros["acrylic" as keyof typeof productIntros],
    structure: "Trong sản phẩm nội thất, lớp Acrylic được kết hợp với một tấm nền phù hợp. Chất lượng mặt hoàn thiện còn phụ thuộc độ phẳng của tấm nền và cách xử lý cạnh. Bề mặt Acrylic nội thất không nên nhầm với mọi loại tấm mica dùng trong quảng cáo.",
    applications: ["Cánh tủ và mặt ngăn kéo","Tấm trang trí trong nhà","Chi tiết phối mặt bóng và chỉ cạnh đồng màu"],
    selection: "Nên xem mẫu ở nhiều góc sáng để chọn màu và mức độ phản chiếu. Mặt bóng cần được vệ sinh đúng cách; tránh vật sắc và chất tẩy không phù hợp để hạn chế làm xước bề mặt.",
    options: "Gửi mã màu, loại ván nền, kích thước và số lượng khi hỏi hàng. Nếu cần hoàn thiện cạnh, hãy cho biết yêu cầu để Tùng Phát kiểm tra phương án gia công.",
    related: ["van-mdf", "melamine", "chi-nep-nhua"], catalogue: "/catalogue/?group=acrylic", references: ["rehau-acrylic"],
  },
  "tam-veneer": {
    intro: productIntros["tam-veneer" as keyof typeof productIntros],
    structure: "Veneer có loại tự nhiên và loại tái cấu trúc, với màu và cách thể hiện vân khác nhau. Sau khi phủ lên ván, bề mặt thường được sơn hoặc hoàn thiện theo yêu cầu. Tấm Veneer rời và ván đã phủ Veneer là hai sản phẩm cần phân biệt khi đặt hàng.",
    applications: ["Cánh tủ, mặt bàn và vách trang trí","Nội thất cần bề mặt có vân gỗ","Chi tiết cần phối hướng vân giữa các mặt"],
    selection: "Nên xem mẫu đã hoàn thiện để chọn màu và cách ghép vân. Với Veneer tự nhiên, màu sắc và đường vân có thể khác nhau giữa các lá; những cánh tủ đặt cạnh nhau cần được tính trước hướng vân và mối nối.",
    options: "Hãy cho biết bạn cần lá Veneer hay ván đã phủ, loại ván nền và số mặt cần hoàn thiện. Nếu có bản vẽ cắt, đánh dấu chiều vân và mặt sử dụng để trao đổi với Tùng Phát.",
    related: ["van-plywood", "van-mdf", "go-ghep-cao-su"], catalogue: "/catalogue/thanh-thuy/veneer/", references: ["wood-handbook", "thanh-thuy-veneer"],
  },
  "pvc-film-pet": {
    intro: productIntros["pvc-film-pet" as keyof typeof productIntros],
    structure: "Hai loại màng có vật liệu và cách gia công khác nhau. PVC Film hay PET không phải là ván nhựa dạng tấm; khi chọn cần xem tên dòng sản phẩm, màu sắc và hướng dẫn gia công tương ứng.",
    applications: ["Bề mặt cánh tủ và ngăn kéo","Chi tiết trang trí nội thất","Phối màu theo catalogue nhà cung cấp"],
    selection: "Hãy xem mẫu thực tế và hỏi rõ loại màng, vật liệu nền, mặt sau và cách hoàn thiện cạnh. Với chi tiết có rãnh hoặc bo cong, cần kiểm tra khả năng gia công của từng dòng trước khi đặt.",
    options: "Bạn có thể gửi mã catalogue cùng kích thước, số lượng và bản vẽ. Tùng Phát sẽ kiểm tra lựa chọn phù hợp trước khi trao đổi báo giá.",
    related: ["acrylic", "melamine", "van-nhua-pvc"], catalogue: "/catalogue/thanh-thuy/pvc/", references: ["thanh-thuy-pvc"],
  },
  "van-nhua-pvc": {
    intro: productIntros["van-nhua-pvc" as keyof typeof productIntros],
    structure: "Ván nhựa PVC có thành phần và cấu tạo khác với ván gỗ; một số dòng có cấu trúc xốp. Sản phẩm này cũng khác với PVC Film là màng trang trí. Độ cứng, cách bắt vít và đặc điểm sử dụng cần xem theo từng loại tấm.",
    applications: ["Chi tiết nội thất có yêu cầu dùng ván nhựa","Tấm trang trí và trưng bày","Chi tiết cắt, khoan theo khả năng của từng loại tấm"],
    selection: "Với tủ hoặc kệ, nên xem tải sử dụng, khoảng đỡ và vị trí gắn bản lề trước khi chọn. Những nơi gần nhiệt hoặc có nắng cần đối chiếu thêm hướng dẫn của nhà sản xuất thay vì chỉ dựa vào tên vật liệu.",
    options: "Gửi hạng mục, kích thước, số lượng và mẫu bề mặt mong muốn. Nếu đã có tên dòng sản phẩm hoặc ảnh nhãn, bạn có thể gửi kèm để Tùng Phát kiểm tra.",
    related: ["mdf-chong-am", "melamine", "chi-nep-nhua"], references: ["palram-pvc"],
  },
  "chi-nep-nhua": {
    intro: productIntros["chi-nep-nhua" as keyof typeof productIntros],
    structure: "Chỉ được dán vào cạnh bằng phương pháp và loại keo phù hợp. Tùy dòng sản phẩm, màu sắc, độ bóng và chất liệu chỉ có thể khác nhau. Khi chọn, nên đối chiếu trực tiếp với mặt ván để đường cạnh hài hòa hơn.",
    applications: ["Dán cạnh cánh tủ và thùng tủ","Hoàn thiện cạnh bàn, kệ và các tấm ván","Phối chỉ với bề mặt màu hoặc vân gỗ"],
    selection: "Cần xem màu chỉ dưới cùng ánh sáng với mẫu ván, đồng thời chọn khổ chỉ phù hợp với độ dày tấm. Với cạnh cong hoặc hình dáng đặc biệt, nên gửi bản vẽ trước để kiểm tra cách gia công.",
    options: "Gửi mã màu hoặc ảnh mẫu, kích thước chi tiết và các cạnh cần dán. Tùng Phát sẽ kiểm tra chỉ phù hợp và trao đổi phần gia công theo yêu cầu.",
    related: ["van-okal", "melamine", "laminate"], references: ["rehau-edgeband"],
  },
};

export function getMaterialEditorial(slug: string) {
  return productEditorial[slug];
}

/** One public record per slug. CMS owns visibility and lifecycle for existing records;
 * this versioned catalogue owns the reviewed educational copy and representative image.
 * Missing CMS records are material-family guides, never inventory/SKU offers.
 */
export function mergeProductEditorial(cmsProducts: ContentEntry<ProductFrontmatter>[]): ContentEntry<ProductFrontmatter>[] {
  const bySlug = new Map(cmsProducts.map((product) => [product.slug, product]));
  const cmsManaged = new Set<string>(cmsManagedMaterialSlugs);
  for (const original of allMaterialCards) {
    const card = homeProductCards.find((item) => item.id === original.id) ?? original;
    const slug = card.href.replace(/^\//u, "").replace(/\/$/u, "");
    const editorial = productEditorial[slug];
    if (!editorial) throw new Error(`Missing material editorial: ${slug}`);
    const cms = bySlug.get(slug);
    if (cmsManaged.has(slug) && !cms) continue;
    const image = imageIndex[slug as keyof typeof imageIndex];
    const body = [
      "## Cấu tạo và đặc điểm", editorial.structure,
      "## Ứng dụng thường gặp", editorial.applications.map((item) => `- ${item}`).join("\n"),
      "## Lưu ý khi lựa chọn", editorial.selection,
      ...(materialAdditionalSections[slug] ? [materialAdditionalSections[slug]] : []),
      ...(extraMaterialGuidance[slug] ? [extraMaterialGuidance[slug]] : []),
      "## Lựa chọn và quy cách cần trao đổi", editorial.options,
    ].join("\n\n");
    bySlug.set(slug, {
      ...(cms ?? {}),
      title: card.title, slug,
      category: card.group === "surface" ? "Bề mặt trang trí" : card.group === "accessory" ? "Vật tư hoàn thiện" : "Ván và vật liệu",
      materialType: card.title,
      supplier: "", dimensions: [], thicknesses: [], surfaces: [], standards: [],
      applications: editorial.applications,
      advantages: [original.description], limitations: ["Chọn theo tài liệu của đúng dòng hàng, điều kiện sử dụng và cách hoàn thiện."],
      orderingSteps: ["Gửi hạng mục, loại vật liệu, quy cách và số lượng cần hỏi.", "Gửi mã hoặc ảnh mẫu bề mặt, bản vẽ và yêu cầu gia công nếu có.", "Tùng Phát kiểm tra dòng hàng và trao đổi lựa chọn trước khi báo giá."],
      excerpt: card.description, featuredImage: card.image, featuredImageAlt: card.alt,
      gallery: image?.gallery.map((item) => item.image) ?? [], video: "", catalogue: "", ogImage: card.image || "/og-logo.png",
      status: cms?.status ?? "guide", quoteCta: "Gửi yêu cầu báo giá",
      publishedAt: cms?.publishedAt ?? "2026-11-03", updatedAt: cms?.updatedAt && cms.updatedAt > "2026-11-13" ? cms.updatedAt : "2026-11-13",
      draft: cms?.draft ?? false, featured: cms?.featured ?? false,
      seoTitle: `${card.title} | Đặc điểm và tư vấn | Tùng Phát`,
      seoDescription: slug === "acrylic"
        ? "Tìm hiểu bề mặt Acrylic, ván nền, cạnh, ưu nhược điểm và cách so sánh với Melamine, Laminate trước khi chọn vật liệu."
        : slug === "van-mdf"
          ? "Tìm hiểu cấu tạo ván MDF, cách chọn ván nền và bề mặt, lưu ý chịu ẩm, khoảng đỡ, gia công và kiểm tra quy cách."
          : `${original.description} Liên hệ Tùng Phát để tư vấn và kiểm tra quy cách.`,
      canonical: cms?.canonical || `https://mdftungphat.com/${slug}/`, noindex: cms?.noindex ?? false,
      faq: [], relatedArticles: cms?.relatedArticles ?? [], body: materialBodyOverrides[slug] ?? body,
      sourcePath: cms?.sourcePath ?? `catalogue-editorial://${slug}`,
      mediaMetadata: image?.image ? { featuredImage: { width: image.width, height: image.height, type: "image/webp" }, ogImage: { width: image.width, height: image.height, type: "image/webp" } } : undefined,
    });
  }
  return [...bySlug.values()];
}

import type { CategoryGroup, MakeupCategory } from '../types/catalog'

/*
 * DỮ LIỆU MẪU (seed) — trích nguyên văn từ js/data/seed-data.js của bản HTML/JS gốc.
 * Tạm thời là nguồn dữ liệu duy nhất; ở Phase 3 sẽ được thay bằng API thật
 * (chỉ cần đổi bên trong services/catalog-service.ts, UI không phải sửa).
 */

export function defaultCategoryTree(): CategoryGroup[] {
  return [
  { group:'Váy & Đầm dạ hội', items:['Váy dạ hội','Đầm đôi'] },
  { group:'Áo dài', items:['Áo dài cách tân','Áo dài truyền thống & cưới'] },
  { group:'Vest & Suit nam', items:['Vest công sở','Tuxedo & dạ tiệc nam'] },
  { group:'Phụ kiện dạ tiệc', items:['Trang sức dạ tiệc','Giày & túi dạ hội'] },
  ]
}

export const makeupCategories: MakeupCategory[] = [
  { id:'mk1', emoji:'👰', name:'Makeup cưới hỏi - cô dâu', tagline:'Trang điểm cô dâu rạng rỡ, bền màu suốt buổi lễ',
    desc:'Trang điểm cô dâu cho ngày ăn hỏi & lễ cưới, tông tự nhiên hoặc theo yêu cầu, bền màu, chống trôi dưới ánh đèn và máy ảnh.',
    priceFrom:1200000, duration:'90 - 120 phút', highlights:['Thử trước makeup miễn phí','Tặng kèm làm tóc cô dâu','Hỗ trợ trang điểm phụ dâu, mẹ hai bên'], images:[] },
  { id:'mk2', emoji:'🎉', name:'Trang điểm dự tiệc', tagline:'Lên đồ lộng lẫy cho mọi buổi tiệc',
    desc:'Trang điểm dự tiệc sinh nhật, gala, sự kiện công ty — tông trang nhã hoặc cá tính tuỳ dịp, hoàn thiện nhanh gọn trong 45 phút.',
    priceFrom:400000, duration:'45 - 60 phút', highlights:['Tư vấn tông màu theo trang phục','Bền màu 6-8 tiếng','Có thể kết hợp làm tóc'], images:[] },
  { id:'mk3', emoji:'📸', name:'Makeup concept chụp hình', tagline:'Trang điểm theo concept, lên hình cực ăn ảnh',
    desc:'Trang điểm theo concept chụp ảnh cá nhân, editorial, tạp chí — phối hợp cùng ekip chụp ảnh để lên hình đẹp nhất.',
    priceFrom:600000, duration:'60 - 90 phút', highlights:['Tư vấn concept trước buổi chụp','Hỗ trợ chỉnh sửa makeup giữa buổi','Đa dạng phong cách: vintage, high fashion, natural'], images:[] },
  { id:'mk4', emoji:'🎓', name:'Makeup Kỷ Yếu', tagline:'Lưu giữ thanh xuân với diện mạo tươi mới',
    desc:'Trang điểm kỷ yếu cho nhóm bạn/lớp, tông tự nhiên tươi tắn, hỗ trợ chụp theo nhóm với giá ưu đãi.',
    priceFrom:300000, duration:'30 - 45 phút', highlights:['Ưu đãi khi đặt theo nhóm từ 5 người','Tông trang điểm học trò, tự nhiên','Hỗ trợ đúng lịch chụp của trường/lớp'], images:[] },
  { id:'mk5', emoji:'💄', name:'Dạy trang điểm cá nhân', tagline:'Tự tin trang điểm mỗi ngày',
    desc:'Khoá học 1-kèm-1 dạy trang điểm cơ bản cho nhu cầu cá nhân: đi làm, đi chơi, dự tiệc nhẹ.',
    priceFrom:800000, duration:'2 - 3 giờ / buổi', highlights:['Học 1 kèm 1 theo khuôn mặt thật của bạn','Tặng kèm tài liệu tổng hợp sản phẩm nên dùng','Hỗ trợ tư vấn sau khoá học'], images:[] },
  { id:'mk6', emoji:'👩‍🏫', name:'Dạy trang điểm chuyên nghiệp', tagline:'Khoá học bài bản cho người theo nghề',
    desc:'Khoá học chuyên sâu dành cho học viên muốn theo nghề makeup: cô dâu, dự tiệc, chụp ảnh, cấp chứng nhận hoàn thành.',
    priceFrom:8000000, duration:'Khoá học nhiều buổi', highlights:['Giáo trình bài bản từ cơ bản đến nâng cao','Thực hành trên người mẫu thật','Cấp chứng nhận hoàn thành khoá học'], images:[] },
  { id:'mk7', emoji:'🏠', name:'Dịch vụ trang điểm tại nhà', tagline:'Chuyên viên đến tận nơi, tiết kiệm thời gian',
    desc:'Trang điểm tại nhà/khách sạn cho cô dâu, dự tiệc — tiện lợi, không mất thời gian di chuyển vào ngày quan trọng.',
    priceFrom:500000, duration:'Theo lịch hẹn', highlights:['Phụ thu di chuyển theo khu vực','Mang đầy đủ dụng cụ chuyên nghiệp','Đặt lịch trước ít nhất 1 ngày'], images:[] },
]

// ---------------------------------------------------------------------------
// Sản phẩm thuê đồ + đơn thuê mẫu — trích nguyên văn từ js/data/seed-data.js gốc.
// Cũng dùng addDays(TODAY_ISO, n) như bản gốc để dữ liệu mẫu luôn "gần đây" so
// với ngày chạy thử, thay vì hard-code 1 mốc ngày cố định sẽ nhanh lỗi thời.
// ---------------------------------------------------------------------------
import type { Product, RentalBooking, Review, Differentiator } from '../types/product'
import type { MakeupAppointment } from '../types/makeup-appointment'
import { addDays, TODAY_ISO } from '../utils/dates'

const rawProducts: any[] = [
  { id:'p1', name:'Váy dạ hội đuôi cá ánh kim', category:'Váy dạ hội', icon:'dress',
    pricePerDay:250000, deposit:2000000, depositNote:'Cọc tiền mặt 2.000.000đ hoặc giữ CCCD bản gốc',
    desc:'Chất liệu vải nhung ánh kim co giãn, dáng đuôi cá tôn dáng, phù hợp tiệc cưới và sự kiện trang trọng.',
    colorHex:{'Đỏ rượu vang':'#7A2233','Đen':'#241A28'},
    variants:[
      {id:'p1-v1', size:'M', color:'Đỏ rượu vang', total:3, renting:0, cleaning:1, repair:0},
      {id:'p1-v2', size:'L', color:'Đen', total:2, renting:0, cleaning:0, repair:0},
    ]},
  { id:'p2', name:'Áo dài cách tân thêu hoa', category:'Áo dài cách tân', icon:'aodai',
    pricePerDay:150000, deposit:1000000, depositNote:'Cọc tiền mặt 1.000.000đ hoặc giữ CCCD bản gốc',
    desc:'Áo dài lụa cách tân thêu hoa nổi tay, form ôm nhẹ, đi kèm quần lụa cùng tông.',
    colorHex:{'Hồng phấn':'#D9AFAE','Trắng ngà':'#F1E7D8'},
    variants:[
      {id:'p2-v1', size:'S', color:'Hồng phấn', total:3, renting:1, cleaning:0, repair:0},
      {id:'p2-v2', size:'M', color:'Trắng ngà', total:2, renting:0, cleaning:0, repair:0},
    ]},
  { id:'p3', name:'Vest nam Slimfit công sở', category:'Vest công sở', icon:'suit',
    pricePerDay:200000, deposit:1500000, depositNote:'Cọc tiền mặt 1.500.000đ hoặc giữ CCCD bản gốc',
    desc:'Form Slimfit hiện đại, vải wool pha co giãn nhẹ, phù hợp dự tiệc, chụp ảnh, phỏng vấn.',
    colorHex:{'Xanh navy':'#22314F','Xám':'#6B6660'},
    variants:[
      {id:'p3-v1', size:'50', color:'Xanh navy', total:2, renting:0, cleaning:0, repair:0},
      {id:'p3-v2', size:'52', color:'Xám', total:2, renting:0, cleaning:0, repair:0},
    ]},
  { id:'p4', name:'Đầm dạ tiệc công chúa xoè bồng', category:'Váy dạ hội', icon:'dress',
    pricePerDay:280000, deposit:2200000, depositNote:'Cọc tiền mặt 2.200.000đ hoặc giữ CCCD bản gốc',
    desc:'Thiết kế chân váy xoè bồng nhiều lớp lưới, phần thân đính đá lấp lánh, sang trọng cho tiệc lớn.',
    colorHex:{'Hồng pastel':'#E7C7CE','Xanh ngọc':'#5C8C82'},
    variants:[
      {id:'p4-v1', size:'L', color:'Hồng pastel', total:2, renting:1, cleaning:0, repair:0},
      {id:'p4-v2', size:'M', color:'Xanh ngọc', total:2, renting:0, cleaning:0, repair:0},
    ]},
  { id:'p5', name:'Set đôi dạ tiệc nam nữ', category:'Đầm đôi', icon:'couple',
    pricePerDay:400000, deposit:3000000, depositNote:'Cọc tiền mặt 3.000.000đ hoặc giữ CCCD bản gốc (cả 2 người)',
    desc:'Trọn bộ set đồng điệu cho cặp đôi: đầm dạ hội và vest cùng tông màu, phù hợp dự tiệc cùng nhau.',
    colorHex:{'Đen - Ánh kim':'#2E2430'},
    variants:[
      {id:'p5-v1', size:'M / 50', color:'Đen - Ánh kim', total:2, renting:1, cleaning:0, repair:0},
    ]},
  { id:'p6', name:'Áo dài cưới truyền thống', category:'Áo dài truyền thống & cưới', icon:'aodai',
    pricePerDay:300000, deposit:2000000, depositNote:'Cọc tiền mặt 2.000.000đ hoặc giữ CCCD bản gốc',
    desc:'Áo dài gấm thêu long phụng truyền thống dùng trong lễ ăn hỏi, lễ gia tiên.',
    colorHex:{'Đỏ':'#8C2A2A','Vàng gold':'#B4863C'},
    variants:[
      {id:'p6-v1', size:'M', color:'Đỏ', total:2, renting:0, cleaning:1, repair:0},
      {id:'p6-v2', size:'L', color:'Vàng gold', total:2, renting:0, cleaning:0, repair:0},
    ]},
  { id:'p7', name:'Vòng cổ & bông tai đính đá', category:'Trang sức dạ tiệc', icon:'accessory',
    pricePerDay:50000, deposit:300000, depositNote:'Cọc tiền mặt 300.000đ hoặc giữ CCCD bản gốc',
    desc:'Bộ trang sức đính đá pha lê, đi kèm hộp bảo quản, phù hợp mọi trang phục dạ hội.',
    colorHex:{'Bạc':'#B9B9BE'},
    variants:[
      {id:'p7-v1', size:'Free size', color:'Bạc', total:4, renting:1, cleaning:0, repair:0},
    ]},
  { id:'p8', name:'Giày cao gót ánh kim', category:'Giày & túi dạ hội', icon:'accessory',
    pricePerDay:60000, deposit:300000, depositNote:'Cọc tiền mặt 300.000đ hoặc giữ CCCD bản gốc',
    desc:'Giày cao gót 7cm phối ánh kim, đế êm, phù hợp mặc cùng váy dạ hội hoặc đầm dự tiệc.',
    colorHex:{'Ánh kim':'#C9A85C'},
    variants:[
      {id:'p8-v1', size:'36', color:'Ánh kim', total:3, renting:0, cleaning:1, repair:0},
      {id:'p8-v2', size:'37', color:'Ánh kim', total:2, renting:0, cleaning:0, repair:0},
    ]},
  { id:'p9', name:'Vest Tuxedo đen dạ tiệc', category:'Tuxedo & dạ tiệc nam', icon:'suit',
    pricePerDay:250000, deposit:1800000, depositNote:'Cọc tiền mặt 1.800.000đ hoặc giữ CCCD bản gốc',
    desc:'Tuxedo cổ điển vải sợi mềm, đi kèm nơ bướm, dùng cho tiệc tối trang trọng.',
    colorHex:{'Đen':'#1E1A20'},
    variants:[
      {id:'p9-v1', size:'48', color:'Đen', total:2, renting:0, cleaning:0, repair:0},
    ]},
]

// Port nguyên dòng products.forEach(...) cuối seedData() gốc: đảm bảo images/videoUrl luôn có mặt.
export const products: Product[] = rawProducts.map((p) => ({
  ...p,
  images: p.images ?? [],
  videoUrl: p.videoUrl ?? '',
})) as Product[]

export const bookings: RentalBooking[] = [
  { id:'b1', code:'PA-1001', customer:'Ngọc Hà', phone:'0901234561', productId:'p1', variantId:'p1-v1',
    orderDate:addDays(TODAY_ISO,-10), pickupDate:addDays(TODAY_ISO,-6), dueDate:addDays(TODAY_ISO,-3),
    returnDate:addDays(TODAY_ISO,-2), days:3, pricePerDay:250000, rentalTotal:750000,
    depositType:'Tiền mặt', depositAmount:2000000, depositRefunded:true, lateFee:10000, status:'Đã trả', paid:true },
  { id:'b2', code:'PA-1002', customer:'Minh Thư', phone:'0901234562', productId:'p2', variantId:'p2-v1',
    orderDate:addDays(TODAY_ISO,-3), pickupDate:addDays(TODAY_ISO,-2), dueDate:addDays(TODAY_ISO,1),
    returnDate:null, days:3, pricePerDay:150000, rentalTotal:450000,
    depositType:'CCCD', depositAmount:1000000, depositRefunded:false, lateFee:0, status:'Đang thuê', paid:true },
  { id:'b3', code:'PA-1003', customer:'Anh Quân', phone:'0901234563', productId:'p3', variantId:'p3-v1',
    orderDate:addDays(TODAY_ISO,-1), pickupDate:addDays(TODAY_ISO,1), dueDate:addDays(TODAY_ISO,3),
    returnDate:null, days:2, pricePerDay:200000, rentalTotal:400000,
    depositType:'Tiền mặt', depositAmount:1500000, depositRefunded:false, lateFee:0, status:'Đặt trước', paid:false },
  { id:'b4', code:'PA-1004', customer:'Thuỳ Linh', phone:'0901234564', productId:'p4', variantId:'p4-v1',
    orderDate:addDays(TODAY_ISO,-8), pickupDate:addDays(TODAY_ISO,-7), dueDate:addDays(TODAY_ISO,-4),
    returnDate:null, days:3, pricePerDay:280000, rentalTotal:840000,
    depositType:'CCCD', depositAmount:2200000, depositRefunded:false, lateFee:0, status:'Đang thuê', paid:true },
  { id:'b5', code:'PA-1005', customer:'Gia Bảo & Kim Chi', phone:'0901234565', productId:'p5', variantId:'p5-v1',
    orderDate:addDays(TODAY_ISO,-1), pickupDate:TODAY_ISO, dueDate:addDays(TODAY_ISO,2),
    returnDate:null, days:2, pricePerDay:400000, rentalTotal:800000,
    depositType:'Tiền mặt', depositAmount:3000000, depositRefunded:false, lateFee:0, status:'Đang thuê', paid:true },
  { id:'b6', code:'PA-1006', customer:'Diễm My', phone:'0901234566', productId:'p6', variantId:'p6-v1',
    orderDate:addDays(TODAY_ISO,-15), pickupDate:addDays(TODAY_ISO,-14), dueDate:addDays(TODAY_ISO,-10),
    returnDate:addDays(TODAY_ISO,-10), days:4, pricePerDay:300000, rentalTotal:1200000,
    depositType:'Tiền mặt', depositAmount:2000000, depositRefunded:true, lateFee:0, status:'Đã trả', paid:true },
  { id:'b7', code:'PA-1007', customer:'Hải Yến', phone:'0901234567', productId:'p7', variantId:'p7-v1',
    orderDate:addDays(TODAY_ISO,-2), pickupDate:addDays(TODAY_ISO,-1), dueDate:addDays(TODAY_ISO,1),
    returnDate:null, days:2, pricePerDay:50000, rentalTotal:100000,
    depositType:'Tiền mặt', depositAmount:300000, depositRefunded:false, lateFee:0, status:'Đang thuê', paid:true },
  { id:'b8', code:'PA-1008', customer:'Phương Vy', phone:'0901234568', productId:'p8', variantId:'p8-v1',
    orderDate:addDays(TODAY_ISO,-20), pickupDate:addDays(TODAY_ISO,-19), dueDate:addDays(TODAY_ISO,-16),
    returnDate:addDays(TODAY_ISO,-16), days:3, pricePerDay:60000, rentalTotal:180000,
    depositType:'Tiền mặt', depositAmount:300000, depositRefunded:true, lateFee:0, status:'Đã trả', paid:true },
  { id:'b9', code:'PA-1009', customer:'Đức Anh', phone:'0901234569', productId:'p9', variantId:'p9-v1',
    orderDate:TODAY_ISO, pickupDate:addDays(TODAY_ISO,3), dueDate:addDays(TODAY_ISO,5),
    returnDate:null, days:2, pricePerDay:250000, rentalTotal:500000,
    depositType:'CCCD', depositAmount:1800000, depositRefunded:false, lateFee:0, status:'Đặt trước', paid:false },
  { id:'b10', code:'PA-1010', customer:'Thanh Tâm', phone:'0901234570', productId:'p1', variantId:'p1-v2',
    orderDate:addDays(TODAY_ISO,-40), pickupDate:addDays(TODAY_ISO,-39), dueDate:addDays(TODAY_ISO,-37),
    returnDate:addDays(TODAY_ISO,-37), days:2, pricePerDay:250000, rentalTotal:500000,
    depositType:'Tiền mặt', depositAmount:2000000, depositRefunded:true, lateFee:0, status:'Đã trả', paid:true },
  { id:'b11', code:'PA-1011', customer:'Bích Ngọc', phone:'0901234571', productId:'p1', variantId:'p1-v1',
    orderDate:addDays(TODAY_ISO,-33), pickupDate:addDays(TODAY_ISO,-32), dueDate:addDays(TODAY_ISO,-29),
    returnDate:addDays(TODAY_ISO,-29), days:3, pricePerDay:250000, rentalTotal:750000,
    depositType:'CCCD', depositAmount:2000000, depositRefunded:true, lateFee:0, status:'Đã trả', paid:true },
  { id:'b12', code:'PA-1012', customer:'Hoài An', phone:'0901234572', productId:'p1', variantId:'p1-v2',
    orderDate:addDays(TODAY_ISO,-15), pickupDate:addDays(TODAY_ISO,-14), dueDate:addDays(TODAY_ISO,-12),
    returnDate:addDays(TODAY_ISO,-12), days:2, pricePerDay:250000, rentalTotal:500000,
    depositType:'Tiền mặt', depositAmount:2000000, depositRefunded:true, lateFee:0, status:'Đã trả', paid:true },
  { id:'b13', code:'PA-1013', customer:'Kim Oanh', phone:'0901234573', productId:'p4', variantId:'p4-v2',
    orderDate:addDays(TODAY_ISO,-28), pickupDate:addDays(TODAY_ISO,-27), dueDate:addDays(TODAY_ISO,-24),
    returnDate:addDays(TODAY_ISO,-24), days:3, pricePerDay:280000, rentalTotal:840000,
    depositType:'CCCD', depositAmount:2200000, depositRefunded:true, lateFee:0, status:'Đã trả', paid:true },
  { id:'b14', code:'PA-1014', customer:'Tuyết Nhung', phone:'0901234574', productId:'p4', variantId:'p4-v2',
    orderDate:addDays(TODAY_ISO,-9), pickupDate:addDays(TODAY_ISO,-8), dueDate:addDays(TODAY_ISO,-6),
    returnDate:addDays(TODAY_ISO,-6), days:2, pricePerDay:280000, rentalTotal:560000,
    depositType:'Tiền mặt', depositAmount:2200000, depositRefunded:true, lateFee:0, status:'Đã trả', paid:true },
  { id:'b15', code:'PA-1015', customer:'Lan Phương', phone:'0901234575', productId:'p2', variantId:'p2-v2',
    orderDate:addDays(TODAY_ISO,-22), pickupDate:addDays(TODAY_ISO,-21), dueDate:addDays(TODAY_ISO,-19),
    returnDate:addDays(TODAY_ISO,-19), days:2, pricePerDay:150000, rentalTotal:300000,
    depositType:'Tiền mặt', depositAmount:1000000, depositRefunded:true, lateFee:0, status:'Đã trả', paid:true },
]

export const makeupAppointments: MakeupAppointment[] = [
  { id: 'ma1', customer: 'Ngọc Hà', phone: '0901234561', serviceId: 'mk1', date: TODAY_ISO, time: '09:30', notes: 'Makeup cô dâu tông tự nhiên', amount: 1200000, depositAmount: 300000, depositRefunded: false, lateFee: 0, paid: true, status: 'Đã xác nhận' },
  { id: 'ma2', customer: 'Minh Thư', phone: '0901234562', serviceId: 'mk2', date: addDays(TODAY_ISO, 2), time: '14:00', notes: 'Tông hồng nhẹ', amount: 400000, depositAmount: 0, depositRefunded: false, lateFee: 0, paid: false, status: 'Chờ xác nhận' },
  { id: 'ma3', customer: 'Thuỳ Linh', phone: '0901234564', serviceId: 'mk3', date: addDays(TODAY_ISO, 5), time: '08:30', notes: 'Concept chụp ảnh ngoài trời', amount: 600000, depositAmount: 200000, depositRefunded: false, lateFee: 0, paid: false, status: 'Đã xác nhận' },
  { id: 'ma4', customer: 'Phương Vy', phone: '0901234568', serviceId: 'mk2', date: addDays(TODAY_ISO, -3), time: '17:00', notes: '', amount: 400000, depositAmount: 100000, depositRefunded: true, lateFee: 50000, paid: true, status: 'Hoàn thành' },
]

export const REVIEWS: Review[] = [
{ name:'Ngọc Hà', item:'Váy dạ hội đuôi cá ánh kim', rating:5, quote:'Váy đẹp, chất vải mượt, đi tiệc cưới ai cũng khen. Nhân viên tư vấn size rất nhiệt tình!', icon:'dress', color:'#7A2233' },
{ name:'Minh Thư', item:'Áo dài cách tân thêu hoa', rating:5, quote:'Thuê áo dài chụp kỷ yếu, form ôm vừa vặn, giá thuê hợp lý hơn nhiều so với may mới.', icon:'aodai', color:'#D9AFAE' },
{ name:'Anh Quân', item:'Vest nam Slimfit công sở', rating:4, quote:'Vest lịch sự, đi phỏng vấn tự tin hẳn. Sẽ quay lại thuê lần sau.', icon:'suit', color:'#22314F' },
{ name:'Gia Bảo & Kim Chi', item:'Set đôi dạ tiệc nam nữ', rating:5, quote:'Đặt set đôi đi tiệc công ty, hai đứa lên đồ đồng điệu cực đẹp, ai cũng hỏi thuê ở đâu.', icon:'couple', color:'#2E2430' },
{ name:'Diễm My', item:'Áo dài cưới truyền thống', rating:5, quote:'Áo dài lễ ăn hỏi sang trọng, thêu tay tinh xảo, đúng ý nhà mình.', icon:'aodai', color:'#8C2A2A' },
{ name:'Phương Vy', item:'Giày cao gót ánh kim', rating:4, quote:'Giày êm chân dù đi tiệc cả buổi tối, phối đồ nào cũng hợp.', icon:'accessory', color:'#C9A85C' },
]

export const DIFFS: Differentiator[] = [
{ icon:'🎁', title:'Miễn phí phụ kiện đi kèm', desc:'Thuê váy dạ hội hay áo dài được tặng kèm phụ kiện phù hợp (túi, khăn choàng) mà không phụ thu.' },
{ icon:'💰', title:'Ưu đãi thuê nhiều, thuê nhóm', desc:'Giảm giá hấp dẫn khi thuê từ 2 bộ trở lên, hoặc thuê theo nhóm, công ty, đoàn khách.' },
{ icon:'👗', title:'Tư vấn phối đồ tận tâm', desc:'Đội ngũ tư vấn giúp chọn size, màu sắc, phong cách phù hợp dáng người và tính chất sự kiện.' },
{ icon:'✨', title:'Cam kết chất lượng', desc:'Trang phục được kiểm tra kỹ, giặt là & khử khuẩn sau mỗi lượt thuê, đảm bảo sạch đẹp như mới.' },
{ icon:'⏱️', title:'Giao nhận linh hoạt, đúng hẹn', desc:'Hỗ trợ lấy/trả đồ nhanh chóng, linh động giờ giấc, luôn đúng hẹn cho ngày trọng đại của bạn.' },
]

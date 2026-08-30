# Mobile App — i18n: Full Translation (lo/th/en/vi)

## ขอบเขต
- สร้าง `constants/translations.ts` — translation strings 4 ภาษา
- แก้ `contexts/LanguageContext.tsx` — เพิ่ม `vi` + export `useT` hook
- แก้ `app/(tabs)/index.tsx`
- แก้ `app/(tabs)/research.tsx`
- แก้ `app/(tabs)/account.tsx`
- แก้ `app/(tabs)/favorites.tsx`
- แก้ `app/(tabs)/contact.tsx`
- แก้ `app/search.tsx`
- แก้ `app/history.tsx`
- แก้ `app/notifications.tsx`
- แก้ `app/research/[slug].tsx`
- แก้ `app/(auth)/login.tsx`
- แก้ `app/(auth)/register.tsx`
- ห้ามแตะไฟล์อื่น

---

## STEP 1: สร้าง `constants/translations.ts`

```ts
export type AppLanguage = 'lo' | 'th' | 'en' | 'vi';

export const translations = {
  // ── Navigation / Tabs ──
  tab_home:      { lo: 'ຫນ້າທຳອິດ',   th: 'หน้าแรก',     en: 'Home',       vi: 'Trang chủ' },
  tab_shelf:     { lo: 'ຊັ້ນຫນັງສື',   th: 'ชั้นหนังสือ', en: 'Shelf',      vi: 'Kệ sách' },
  tab_favorites: { lo: 'ລາຍການທີ່ມັກ', th: 'รายการโปรด',  en: 'Favorites',  vi: 'Yêu thích' },
  tab_settings:  { lo: 'ຕັ້ງຄ່າ',      th: 'ตั้งค่า',     en: 'Settings',   vi: 'Cài đặt' },
  tab_contact:   { lo: 'ຕິດຕໍ່',       th: 'ติดต่อ',      en: 'Contact',    vi: 'Liên hệ' },

  // ── Home ──
  home_greeting:    { lo: 'ສະບາຍດີ 👋',    th: 'สวัสดี 👋',   en: 'Hello 👋',    vi: 'Xin chào 👋' },
  home_title:       { lo: 'ຫ້ອງສະໝຸດດິຈິຕອນ', th: 'ห้องสมุดดิจิทัล', en: 'Digital Library', vi: 'Thư viện số' },
  home_welcome:     { lo: 'ຍິນດີຕ້ອນຮັບ 👋', th: 'ยินดีต้อนรับ 👋', en: 'Welcome 👋', vi: 'Chào mừng 👋' },
  home_search_btn:  { lo: 'ຄົ້ນຫາງານວິໄຈ →', th: 'ค้นหางานวิจัย →', en: 'Search Research →', vi: 'Tìm kiếm →' },
  home_popular:     { lo: 'ລາຍການຍອດນິຍົມ', th: 'รายการยอดนิยม', en: 'Popular',   vi: 'Phổ biến' },
  home_latest:      { lo: 'ງານວິໄຈລ່າສຸດ',  th: 'งานวิจัยล่าสุด', en: 'Latest',  vi: 'Mới nhất' },
  home_see_more:    { lo: 'ເບິ່ງເພີ່ມເຕີມ →', th: 'ดูเพิ่มเติม →', en: 'See more →', vi: 'Xem thêm →' },
  stat_research:    { lo: 'ງານວິໄຈ',    th: 'งานวิจัย',  en: 'Research',   vi: 'Nghiên cứu' },
  stat_category:    { lo: 'ຫມວດຫມູ່',   th: 'หมวดหมู่',  en: 'Categories', vi: 'Danh mục' },
  stat_org:         { lo: 'ຫນ່ວຍງານ',   th: 'หน่วยงาน',  en: 'Orgs',       vi: 'Đơn vị' },

  // ── Shelf ──
  shelf_title:      { lo: 'ຊັ້ນຫນັງສື',   th: 'ชั้นหนังสือ',   en: 'Shelf',        vi: 'Kệ sách' },
  shelf_search:     { lo: 'ຄົ້ນຫາ',        th: 'ค้นหา',         en: 'Search',       vi: 'Tìm kiếm' },
  shelf_featured:   { lo: 'ຫນັງສືໂດດເດັ່ນ', th: 'หนังสือโดดเด่น', en: 'Featured',    vi: 'Nổi bật' },
  shelf_all:        { lo: 'ທັງໝົດ',         th: 'ทั้งหมด',       en: 'All',          vi: 'Tất cả' },
  shelf_see_all:    { lo: 'ເບິ່ງທັງໝົດ →',  th: 'ดูทั้งหมด →',   en: 'See all →',    vi: 'Xem tất cả →' },
  shelf_empty:      { lo: 'ບໍ່ພົບງານວິໄຈ',  th: 'ไม่พบงานวิจัย', en: 'No research found', vi: 'Không tìm thấy' },

  // ── Search ──
  search_placeholder: { lo: 'ຄົ້ນຫາງານວິໄຈ...', th: 'ค้นหางานวิจัย...', en: 'Search research...', vi: 'Tìm kiếm...' },
  search_result:      { lo: 'ຜົນການຄົ້ນຫາ',      th: 'ผลการค้นหา',       en: 'Results',            vi: 'Kết quả' },
  search_items:       { lo: 'ລາຍການ',             th: 'รายการ',           en: 'items',              vi: 'mục' },
  search_page:        { lo: 'ໜ້າ',                th: 'หน้า',             en: 'Page',               vi: 'Trang' },
  search_empty:       { lo: 'ບໍ່ພົບງານວິໄຈ',      th: 'ไม่พบงานวิจัย',    en: 'No results found',   vi: 'Không có kết quả' },
  search_all:         { lo: 'ທັງໝົດ',             th: 'ทั้งหมด',          en: 'All',                vi: 'Tất cả' },
  filter_title:       { lo: 'ຕົວກອງ',             th: 'ตัวกรอง',          en: 'Filters',            vi: 'Bộ lọc' },
  filter_sort:        { lo: 'ຮຽງຕາມ',             th: 'เรียงตาม',         en: 'Sort by',            vi: 'Sắp xếp' },
  filter_access:      { lo: 'ລະດັບການເຂົ້າເຖິງ',  th: 'ระดับการเข้าถึง',  en: 'Access level',       vi: 'Cấp truy cập' },
  filter_year:        { lo: 'ຊ່ວງປີ (ຄ.ສ.)',      th: 'ช่วงปี (ค.ศ.)',    en: 'Year range',         vi: 'Năm' },
  filter_apply:       { lo: 'ນຳໃຊ້',              th: 'นำใช้',            en: 'Apply',              vi: 'Áp dụng' },
  filter_reset:       { lo: 'ລ້າງຕົວກອງ',         th: 'ล้างตัวกรอง',      en: 'Reset',              vi: 'Đặt lại' },
  filter_latest:      { lo: 'ລ່າສຸດ',             th: 'ล่าสุด',           en: 'Latest',             vi: 'Mới nhất' },
  filter_popular:     { lo: 'ຍອດນິຍົມ',           th: 'ยอดนิยม',          en: 'Popular',            vi: 'Phổ biến' },
  filter_downloads:   { lo: 'ດາວໂຫລດ',            th: 'ดาวน์โหลด',        en: 'Downloads',          vi: 'Tải về' },
  filter_public:      { lo: 'ສາທາລະນະ',           th: 'สาธารณะ',          en: 'Public',             vi: 'Công khai' },
  filter_readonly:    { lo: 'ອ່ານໄດ້',             th: 'อ่านได้',          en: 'Read only',          vi: 'Chỉ đọc' },
  filter_meta:        { lo: 'ຂໍ້ມູນດ່ວນ',         th: 'ข้อมูลด่วน',       en: 'Metadata only',      vi: 'Chỉ metadata' },
  year_from:          { lo: 'ຈາກປີ',              th: 'จากปี',            en: 'From year',          vi: 'Từ năm' },
  year_to:            { lo: 'ຫາປີ',               th: 'ถึงปี',            en: 'To year',            vi: 'Đến năm' },

  // ── Research Detail ──
  detail_title:       { lo: 'ລາຍລະອຽດ',           th: 'รายละเอียด',       en: 'Detail',             vi: 'Chi tiết' },
  detail_org:         { lo: 'ໜ່ວຍງານ',            th: 'หน่วยงาน',         en: 'Organization',       vi: 'Tổ chức' },
  detail_author:      { lo: 'ຜູ້ວິໄຈ',            th: 'ผู้วิจัย',         en: 'Author(s)',          vi: 'Tác giả' },
  detail_abstract:    { lo: 'ບົດຄັດຫຍໍ້',         th: 'บทคัดย่อ',         en: 'Abstract',           vi: 'Tóm tắt' },
  detail_keywords:    { lo: 'ຄຳສຳຄັນ',            th: 'คำสำคัญ',          en: 'Keywords',           vi: 'Từ khóa' },
  detail_related:     { lo: 'ງານວິໄຈທີ່ກ່ຽວຂ້ອງ', th: 'งานวิจัยที่เกี่ยวข้อง', en: 'Related research', vi: 'Liên quan' },
  detail_read_pdf:    { lo: 'ອ່ານ PDF ອອນລາຍ',    th: 'อ่าน PDF ออนไลน์', en: 'Read PDF Online',    vi: 'Đọc PDF' },
  detail_not_found:   { lo: 'ບໍ່ພົບງານວິໄຈ',      th: 'ไม่พบงานวิจัย',    en: 'Research not found', vi: 'Không tìm thấy' },
  detail_views:       { lo: 'ເທື່ອ',              th: 'ครั้ง',            en: 'views',              vi: 'lượt' },
  rating_label:       { lo: 'ໃຫ້ຄະແນນ:',         th: 'ให้คะแนน:',        en: 'Rate this:',         vi: 'Đánh giá:' },
  rating_login:       { lo: 'ເຂົ້າສູ່ລະບົບເພື່ອໃຫ້ຄະແນນ', th: 'เข้าสู่ระบบเพื่อให้คะแนน', en: 'Login to rate', vi: 'Đăng nhập để đánh giá' },
  rating_count:       { lo: 'ຄະແນນ',             th: 'คะแนน',            en: 'ratings',            vi: 'đánh giá' },
  comment_title:      { lo: 'ຄຳເຫັນ',             th: 'ความคิดเห็น',      en: 'Comments',           vi: 'Bình luận' },
  comment_placeholder:{ lo: 'ຂຽນຄຳເຫັນ...',      th: 'เขียนความคิดเห็น...', en: 'Write a comment...', vi: 'Viết bình luận...' },
  comment_login:      { lo: 'ເຂົ້າສູ່ລະບົບເພື່ອຄຳເຫັນ', th: 'เข้าสู่ระบบเพื่อแสดงความเห็น', en: 'Login to comment', vi: 'Đăng nhập để bình luận' },
  comment_empty:      { lo: 'ຍັງບໍ່ມີຄຳເຫັນ',    th: 'ยังไม่มีความคิดเห็น', en: 'No comments yet', vi: 'Chưa có bình luận' },

  // ── Auth ──
  login_title:        { lo: 'ເຂົ້າສູ່ລະບົບ',      th: 'เข้าสู่ระบบ',      en: 'Sign In',            vi: 'Đăng nhập' },
  login_subtitle:     { lo: 'ເຂົ້າສູ່ລະບົບເພື່ອເຂົ້າເຖິງງານວິໄຈ', th: 'เข้าสู่ระบบเพื่อเข้าถึงงานวิจัย', en: 'Sign in to access research', vi: 'Đăng nhập để truy cập' },
  login_btn:          { lo: 'ເຂົ້າສູ່ລະບົບ',      th: 'เข้าสู่ระบบ',      en: 'Sign In',            vi: 'Đăng nhập' },
  login_no_account:   { lo: 'ຍັງບໍ່ມີບັນຊີ? ສະໝັກສະມາຊິກ', th: 'ยังไม่มีบัญชี? สมัครสมาชิก', en: "Don't have an account? Register", vi: 'Chưa có tài khoản? Đăng ký' },
  login_forgot:       { lo: 'ລືມລະຫັດຜ່ານ?',     th: 'ลืมรหัสผ่าน?',     en: 'Forgot password?',   vi: 'Quên mật khẩu?' },
  login_fail:         { lo: 'ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ', th: 'เข้าสู่ระบบไม่สำเร็จ', en: 'Sign in failed', vi: 'Đăng nhập thất bại' },
  login_wrong_pw:     { lo: 'ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ', th: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', en: 'Invalid email or password', vi: 'Email hoặc mật khẩu không đúng' },
  register_title:     { lo: 'ສະໝັກສະມາຊິກ',      th: 'สมัครสมาชิก',      en: 'Register',           vi: 'Đăng ký' },
  register_subtitle:  { lo: 'ສະໝັກສະມາຊິກເພື່ອເຂົ້າເຖິງງານວິໄຈ ແລະ ຟີເຈີເພີ່ມເຕີມ', th: 'สมัครสมาชิกเพื่อเข้าถึงงานวิจัยและฟีเจอร์เพิ่มเติม', en: 'Register to access research and more features', vi: 'Đăng ký để truy cập nghiên cứu' },
  register_btn:       { lo: 'ສະໝັກສະມາຊິກ',      th: 'สมัครสมาชิก',      en: 'Register',           vi: 'Đăng ký' },
  register_has_account: { lo: 'ມີບັນຊີຢູ່ແລ້ວ? ເຂົ້າສູ່ລະບົບ', th: 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ', en: 'Already have an account? Sign in', vi: 'Đã có tài khoản? Đăng nhập' },
  register_success:   { lo: 'ສະໝັກສະມາຊິກສຳເລັດ', th: 'สมัครสมาชิกสำเร็จ', en: 'Registration successful', vi: 'Đăng ký thành công' },
  register_verify:    { lo: 'ກະລຸນາກວດສອບອີເມວຂອງທ່ານເພື່ອຢືນຢັນບັນຊີ', th: 'กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี', en: 'Please check your email to verify your account', vi: 'Vui lòng kiểm tra email để xác nhận tài khoản' },
  register_fail:      { lo: 'ສະໝັກສະມາຊິກບໍ່ສຳເລັດ', th: 'สมัครสมาชิกไม่สำเร็จ', en: 'Registration failed', vi: 'Đăng ký thất bại' },

  // ── Form fields ──
  field_email:        { lo: 'ອີເມວ',              th: 'อีเมล',            en: 'Email',              vi: 'Email' },
  field_password:     { lo: 'ລະຫັດຜ່ານ',          th: 'รหัสผ่าน',         en: 'Password',           vi: 'Mật khẩu' },
  field_confirm_pw:   { lo: 'ຢືນຢັນລະຫັດຜ່ານ',   th: 'ยืนยันรหัสผ่าน',   en: 'Confirm password',   vi: 'Xác nhận mật khẩu' },
  field_fullname:     { lo: 'ຊື່ເຕັມ',            th: 'ชื่อเต็ม',         en: 'Full name',          vi: 'Họ và tên' },
  field_org:          { lo: 'ໜ່ວຍງານ',            th: 'หน่วยงาน',         en: 'Organization',       vi: 'Tổ chức' },

  // ── Validation ──
  val_email_required: { lo: 'ກະລຸນາປ້ອນອີເມວ',   th: 'กรุณากรอกอีเมล',   en: 'Please enter email', vi: 'Vui lòng nhập email' },
  val_email_invalid:  { lo: 'ຮູບແບບອີເມວບໍ່ຖືກຕ້ອງ', th: 'รูปแบบอีเมลไม่ถูกต้อง', en: 'Invalid email format', vi: 'Email không hợp lệ' },
  val_pw_required:    { lo: 'ກະລຸນາປ້ອນລະຫັດຜ່ານ', th: 'กรุณากรอกรหัสผ่าน', en: 'Please enter password', vi: 'Vui lòng nhập mật khẩu' },
  val_pw_short:       { lo: 'ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ', th: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร', en: 'Password must be at least 8 characters', vi: 'Mật khẩu tối thiểu 8 ký tự' },
  val_pw_mismatch:    { lo: 'ລະຫັດຜ່ານບໍ່ຕົງກັນ', th: 'รหัสผ่านไม่ตรงกัน', en: 'Passwords do not match', vi: 'Mật khẩu không khớp' },

  // ── Account / Settings ──
  account_title:      { lo: 'ບັນຊີຂອງຂ້ອຍ',       th: 'บัญชีของฉัน',      en: 'My Account',         vi: 'Tài khoản' },
  account_guest:      { lo: 'ຍັງບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ', th: 'ยังไม่ได้เข้าสู่ระบบ', en: 'Not signed in', vi: 'Chưa đăng nhập' },
  account_guest_sub:  { lo: 'ເຂົ້າສູ່ລະບົບເພື່ອເຂົ້າເຖິງລາຍການທີ່ມັກ ແລະ ປະຫວັດການອ່ານ', th: 'เข้าสู่ระบบเพื่อเข้าถึงรายการโปรดและประวัติการอ่าน', en: 'Sign in to access favorites and reading history', vi: 'Đăng nhập để xem yêu thích và lịch sử' },
  account_history:    { lo: 'ປະຫວັດການອ່ານ',       th: 'ประวัติการอ่าน',   en: 'Reading history',    vi: 'Lịch sử đọc' },
  account_theme:      { lo: 'ຮູບແບບສີ',            th: 'รูปแบบสี',         en: 'Theme',              vi: 'Giao diện' },
  account_language:   { lo: 'ພາສາ',               th: 'ภาษา',             en: 'Language',           vi: 'Ngôn ngữ' },
  account_logout:     { lo: 'ອອກຈາກລະບົບ',        th: 'ออกจากระบบ',       en: 'Sign out',           vi: 'Đăng xuất' },
  account_logout_q:   { lo: 'ທ່ານຕ້ອງການອອກຈາກລະບົບບໍ?', th: 'ต้องการออกจากระบบไหม?', en: 'Sign out?', vi: 'Bạn muốn đăng xuất?' },
  account_edit:       { lo: 'ແກ້ໄຂໂປຣໄຟລ',        th: 'แก้ไขโปรไฟล์',     en: 'Edit profile',       vi: 'Sửa hồ sơ' },
  account_change_pw:  { lo: 'ປ່ຽນລະຫັດຜ່ານ',      th: 'เปลี่ยนรหัสผ่าน',  en: 'Change password',    vi: 'Đổi mật khẩu' },
  account_save:       { lo: 'ບັນທຶກ',              th: 'บันทึก',           en: 'Save',               vi: 'Lưu' },
  account_no_name:    { lo: 'ບໍ່ລະບຸຊື່',          th: 'ไม่ระบุชื่อ',      en: 'No name',            vi: 'Chưa đặt tên' },
  pw_current:         { lo: 'ລະຫັດຜ່ານປັດຈຸບັນ',   th: 'รหัสผ่านปัจจุบัน', en: 'Current password',   vi: 'Mật khẩu hiện tại' },
  pw_new:             { lo: 'ລະຫັດຜ່ານໃໝ່',        th: 'รหัสผ่านใหม่',     en: 'New password',       vi: 'Mật khẩu mới' },
  pw_confirm:         { lo: 'ຢືນຢັນລະຫັດຜ່ານໃໝ່', th: 'ยืนยันรหัสผ่านใหม่', en: 'Confirm new password', vi: 'Xác nhận mật khẩu mới' },
  pw_min8:            { lo: 'ຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ', th: 'อย่างน้อย 8 ตัวอักษร', en: 'At least 8 characters', vi: 'Ít nhất 8 ký tự' },
  pw_confirm_label:   { lo: 'ຢືນຢັນລະຫັດຜ່ານ',    th: 'ยืนยันรหัสผ่าน',   en: 'Confirm password',   vi: 'Xác nhận mật khẩu' },

  // ── Favorites ──
  fav_empty_title:    { lo: 'ຍັງບໍ່ມີລາຍການທີ່ມັກ', th: 'ยังไม่มีรายการโปรด', en: 'No favorites yet', vi: 'Chưa có yêu thích' },
  fav_empty_text:     { lo: 'ກົດ ❤️ ໃນໜ້າລາຍລະອຽດ ເພື່ອບັນທຶກ', th: 'กด ❤️ ในหน้ารายละเอียด เพื่อบันทึก', en: 'Tap ❤️ on a research to save', vi: 'Nhấn ❤️ để lưu nghiên cứu' },
  fav_search:         { lo: 'ຄົ້ນຫາງານວິໄຈ',       th: 'ค้นหางานวิจัย',     en: 'Search research',   vi: 'Tìm nghiên cứu' },
  fav_login:          { lo: 'ເຂົ້າສູ່ລະບົບກ່ອນ',   th: 'เข้าสู่ระบบก่อน',  en: 'Please sign in',    vi: 'Vui lòng đăng nhập' },
  fav_login_text:     { lo: 'ເຂົ້າສູ່ລະບົບເພື່ອເບິ່ງລາຍການທີ່ມັກ', th: 'เข้าสู่ระบบเพื่อดูรายการโปรด', en: 'Sign in to view favorites', vi: 'Đăng nhập để xem yêu thích' },
  fav_items:          { lo: 'ລາຍການ',              th: 'รายการ',           en: 'items',              vi: 'mục' },
  fav_sort_latest:    { lo: 'ລ່າສຸດ',              th: 'ล่าสุด',           en: 'Latest',             vi: 'Mới nhất' },
  fav_sort_name:      { lo: 'ຊື່',                 th: 'ชื่อ',             en: 'Name',               vi: 'Tên' },
  fav_sort_by:        { lo: 'ຮຽງຕາມ:',             th: 'เรียงตาม:',        en: 'Sort by:',           vi: 'Sắp xếp:' },
  fav_remove:         { lo: 'ລຶບອອກ',              th: 'ลบออก',            en: 'Remove',             vi: 'Xóa' },
  fav_remove_q:       { lo: 'ທ່ານຕ້ອງການລຶບອອກຈາກລາຍການທີ່ມັກບໍ?', th: 'ต้องการลบออกจากรายการโปรด?', en: 'Remove from favorites?', vi: 'Xóa khỏi yêu thích?' },

  // ── History ──
  history_title:      { lo: 'ປະຫວັດການອ່ານ',       th: 'ประวัติการอ่าน',   en: 'Reading History',    vi: 'Lịch sử đọc' },
  history_clear:      { lo: 'ລົບທັງໝົດ',           th: 'ลบทั้งหมด',        en: 'Clear all',          vi: 'Xóa tất cả' },
  history_clear_q:    { lo: 'ທ່ານຕ້ອງການລົບປະຫວັດການອ່ານທັງໝົດບໍ?', th: 'ต้องการลบประวัติการอ่านทั้งหมด?', en: 'Clear all reading history?', vi: 'Xóa toàn bộ lịch sử đọc?' },
  history_empty_title:{ lo: 'ຍັງບໍ່ມີປະຫວັດການອ່ານ', th: 'ยังไม่มีประวัติการอ่าน', en: 'No reading history', vi: 'Chưa có lịch sử đọc' },
  history_empty_text: { lo: 'ງານວິໄຈທີ່ທ່ານເປີດອ່ານຈະຖືກບັນທຶກໄວ້ທີ່ນີ້', th: 'งานวิจัยที่คุณเปิดอ่านจะถูกบันทึกไว้ที่นี่', en: 'Research you read will appear here', vi: 'Nghiên cứu bạn đọc sẽ xuất hiện ở đây' },
  history_remove_q:   { lo: 'ທ່ານຕ້ອງການລຶບອອກຈາກປະຫວັດການອ່ານບໍ?', th: 'ต้องการลบออกจากประวัติการอ่าน?', en: 'Remove from history?', vi: 'Xóa khỏi lịch sử?' },
  today:              { lo: 'ມື້ນີ້',               th: 'วันนี้',           en: 'Today',              vi: 'Hôm nay' },
  yesterday:          { lo: 'ມື້ວານ',               th: 'เมื่อวาน',         en: 'Yesterday',          vi: 'Hôm qua' },
  before:             { lo: 'ກ່ອນໜ້ານີ້',           th: 'ก่อนหน้านี้',      en: 'Earlier',            vi: 'Trước đó' },

  // ── Notifications ──
  notif_title:        { lo: 'ການແຈ້ງເຕືອນ',        th: 'การแจ้งเตือน',     en: 'Notifications',      vi: 'Thông báo' },
  notif_mark_all:     { lo: 'ອ່ານທັງໝົດ',           th: 'อ่านทั้งหมด',      en: 'Mark all read',      vi: 'Đánh dấu đã đọc' },
  notif_empty:        { lo: 'ບໍ່ມີການແຈ້ງເຕືອນ',    th: 'ไม่มีการแจ้งเตือน', en: 'No notifications',  vi: 'Không có thông báo' },
  notif_login:        { lo: 'ເຂົ້າສູ່ລະບົບເພື່ອເບິ່ງການແຈ້ງເຕືອນ', th: 'เข้าสู่ระบบเพื่อดูการแจ้งเตือน', en: 'Sign in to view notifications', vi: 'Đăng nhập để xem thông báo' },

  // ── Common ──
  common_back:        { lo: 'ກັບໄປ',               th: 'กลับไป',           en: 'Go back',            vi: 'Quay lại' },
  common_cancel:      { lo: 'ຍົກເລີກ',              th: 'ยกเลิก',           en: 'Cancel',             vi: 'Hủy' },
  common_ok:          { lo: 'ຕົກລົງ',               th: 'ตกลง',             en: 'OK',                 vi: 'OK' },
  common_delete:      { lo: 'ລຶບ',                  th: 'ลบ',               en: 'Delete',             vi: 'Xóa' },
  common_error:       { lo: 'ຜິດພາດ',               th: 'ผิดพลาด',          en: 'Error',              vi: 'Lỗi' },
  common_success:     { lo: 'ສຳເລັດ',               th: 'สำเร็จ',           en: 'Success',            vi: 'Thành công' },
  common_loading:     { lo: 'ກຳລັງໂຫລດ...',         th: 'กำลังโหลด...',     en: 'Loading...',         vi: 'Đang tải...' },
  common_pdf_loading: { lo: 'ກຳລັງໂຫລດ PDF...',    th: 'กำลังโหลด PDF...',  en: 'Loading PDF...',    vi: 'Đang tải PDF...' },
  common_pdf_error:   { lo: 'ບໍ່ສາມາດໂຫລດ PDF ໄດ້', th: 'ไม่สามารถโหลด PDF ได้', en: 'Cannot load PDF', vi: 'Không thể tải PDF' },
  common_pdf_retry:   { lo: 'ລອງໃໝ່',               th: 'ลองใหม่',          en: 'Retry',              vi: 'Thử lại' },
  common_forgot_msg:  { lo: 'ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບ ຫຼື ສົ່ງອີເມວ info@digitallibrary.la', th: 'กรุณาติดต่อผู้ดูแลระบบหรือส่งอีเมล info@digitallibrary.la', en: 'Please contact admin or email info@digitallibrary.la', vi: 'Vui lòng liên hệ quản trị viên' },
  common_no_user:     { lo: 'ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້',   th: 'ไม่พบข้อมูลผู้ใช้', en: 'User not found',    vi: 'Không tìm thấy người dùng' },
  common_save_error:  { lo: 'ບໍ່ສາມາດບັນທຶກໂປຣໄຟລໄດ້', th: 'ไม่สามารถบันทึกโปรไฟล์ได้', en: 'Cannot save profile', vi: 'Không thể lưu hồ sơ' },
  common_pw_error:    { lo: 'ບໍ່ສາມາດປ່ຽນລະຫັດຜ່ານໄດ້', th: 'ไม่สามารถเปลี่ยนรหัสผ่านได้', en: 'Cannot change password', vi: 'Không thể đổi mật khẩu' },
  common_auth_error:  { lo: 'ບໍ່ສາມາດຢືນຢັນຕົວຕົນໄດ້', th: 'ไม่สามารถยืนยันตัวตนได้', en: 'Cannot verify identity', vi: 'Không thể xác thực' },
  common_pw_changed:  { lo: 'ປ່ຽນລະຫັດຜ່ານສຳເລັດ', th: 'เปลี่ยนรหัสผ่านสำเร็จ', en: 'Password changed successfully', vi: 'Đổi mật khẩu thành công' },
  common_pw_wrong:    { lo: 'ລະຫັດຜ່ານປັດຈຸບັນບໍ່ຖືກຕ້ອງ', th: 'รหัสผ่านปัจจุบันไม่ถูกต้อง', en: 'Current password is incorrect', vi: 'Mật khẩu hiện tại không đúng' },
  common_pw_req:      { lo: 'ກະລຸນາປ້ອນລະຫັດຜ່ານປັດຈຸບັນ', th: 'กรุณากรอกรหัสผ่านปัจจุบัน', en: 'Please enter current password', vi: 'Vui lòng nhập mật khẩu hiện tại' },
  common_comment_error: { lo: 'ບໍ່ສາມາດສົ່ງຄຳເຫັນໄດ້', th: 'ไม่สามารถส่งความคิดเห็นได้', en: 'Cannot send comment', vi: 'Không thể gửi bình luận' },
  common_rating_error:{ lo: 'ບໍ່ສາມາດບັນທຶກຄະແນນໄດ້', th: 'ไม่สามารถบันทึกคะแนนได้', en: 'Cannot save rating', vi: 'Không thể lưu đánh giá' },
} as const;

export type TranslationKey = keyof typeof translations;
```

---

## STEP 2: แก้ `contexts/LanguageContext.tsx`

เพิ่ม `vi` และ export `useT` hook:

```tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, TranslationKey, AppLanguage } from '@/constants/translations';

export type { AppLanguage };

const LANG_KEY = 'app_language';

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  lo: 'ລາວ',
  th: 'ไทย',
  en: 'English',
  vi: 'Tiếng Việt',
};

type LanguageContextType = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  languageLabel: string;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'lo',
  setLanguage: () => {},
  languageLabel: 'ລາວ',
  t: (key) => translations[key].lo,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('lo');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((val) => {
      if (val === 'lo' || val === 'th' || val === 'en' || val === 'vi') {
        setLanguageState(val);
      }
    });
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANG_KEY, lang);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[key][language] ?? translations[key].lo;
  }, [language]);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      languageLabel: LANGUAGE_LABELS[language],
      t,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

// shortcut hook — ใช้ในทุก component
export function useT() {
  return useContext(LanguageContext).t;
}
```

---

## STEP 3: แก้ทุกไฟล์ให้ใช้ `useT()`

### Pattern การใช้งานในทุกไฟล์:

```tsx
// เพิ่ม import
import { useT } from '@/contexts/LanguageContext';

// เพิ่มใน component
const t = useT();

// แทนที่ hardcoded string
// เดิม: 'ຫ້ອງສະໝຸດດິຈິຕອນ'
// ใหม่: t('home_title')
```

### แต่ละไฟล์ — strings ที่ต้องเปลี่ยน:

**`app/(tabs)/index.tsx`**
- `'ສະບາຍດີ 👋'` → `t('home_greeting')`
- `'ຫ້ອງສະໝຸດດິຈິຕອນ'` → `t('home_title')`
- `'ຍິນດີຕ້ອນຮັບ 👋'` → `t('home_welcome')`
- `'ຄົ້ນຫາງານວິໄຈ →'` → `t('home_search_btn')`
- `'ລາຍການຍອດນິຍົມ'` → `t('home_popular')`
- `'ງານວິໄຈລ່າສຸດ'` → `t('home_latest')`
- `'ເບິ່ງເພີ່ມເຕີມ →'` → `t('home_see_more')`
- `'ງານວິໄຈ'` → `t('stat_research')`
- `'ຫມວດຫມູ່'` → `t('stat_category')`
- `'ຫນ່ວຍງານ'` → `t('stat_org')`

**`app/(tabs)/research.tsx`**
- `'ຊັ້ນຫນັງສື'` → `t('shelf_title')`
- `'ຄົ້ນຫາ'` → `t('shelf_search')`
- `'ຫນັງສືໂດດເດັ່ນ'` → `t('shelf_featured')`
- `'ທັງໝົດ'` → `t('shelf_all')`
- `'ເບິ່ງທັງໝົດ →'` → `t('shelf_see_all')`
- `'ບໍ່ພົບງານວິໄຈ'` → `t('shelf_empty')`
- FEATURED_CATEGORIES names — ยังคง hardcode ภาษาลาวไว้ก่อน (เป็น DB data)

**`app/search.tsx`**
- `'ຄົ້ນຫາງານວິໄຈ...'` → `t('search_placeholder')`
- `'ຜົນການຄົ້ນຫາ'` → `t('search_result')`
- `'ລາຍການ'` → `t('search_items')`
- `'ໜ້າ'` → `t('search_page')`
- `'ບໍ່ພົບງານວິໄຈ'` → `t('search_empty')`
- `'ທັງໝົດ'` → `t('search_all')`
- `'ຕົວກອງ'` → `t('filter_title')`
- `'ຮຽງຕາມ'` → `t('filter_sort')`
- `'ລະດັບການເຂົ້າເຖິງ'` → `t('filter_access')`
- `'ຊ່ວງປີ (ຄ.ສ.)'` → `t('filter_year')`
- `'ນຳໃຊ້'` → `t('filter_apply')`
- `'ລ້າງຕົວກອງ'` → `t('filter_reset')`
- `'ລ່າສຸດ'` → `t('filter_latest')`
- `'ຍອດນິຍົມ'` → `t('filter_popular')`
- `'ດາວໂຫລດ'` → `t('filter_downloads')`
- `'ສາທາລະນະ'` → `t('filter_public')`
- `'ອ່ານໄດ້'` → `t('filter_readonly')`
- `'ຂໍ້ມູນດ່ວນ'` → `t('filter_meta')`
- `'ຈາກປີ'` → `t('year_from')`
- `'ຫາປີ'` → `t('year_to')`

**`app/(tabs)/account.tsx`**
- `'ຕັ້ງຄ່າ'` → `t('tab_settings')`
- `'ບັນຊີຂອງຂ້ອຍ'` → `t('account_title')`
- `'ຍັງບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ'` → `t('account_guest')`
- `'ເຂົ້າສູ່ລະບົບ...'` → `t('login_btn')`
- `'ສະໝັກສະມາຊິກ'` → `t('register_btn')`
- `'ລາຍການທີ່ມັກ'` → `t('tab_favorites')`
- `'ປະຫວັດການອ່ານ'` → `t('account_history')`
- `'ຮູບແບບສີ'` → `t('account_theme')`
- `'ພາສາ'` → `t('account_language')`
- `'ປ່ຽນລະຫັດຜ່ານ'` → `t('account_change_pw')`
- `'ອອກຈາກລະບົບ'` → `t('account_logout')`
- `'ແກ້ໄຂໂປຣໄຟລ'` → `t('account_edit')`
- `'ບັນທຶກ'` → `t('account_save')`
- `'ບໍ່ລະບຸຊື່'` → `t('account_no_name')`
- `'ຊື່ເຕັມ'` → `t('field_fullname')`
- `'ໜ່ວຍງານ'` → `t('field_org')`
- `'ລະຫັດຜ່ານປັດຈຸບັນ'` → `t('pw_current')`
- `'ລະຫັດຜ່ານໃໝ່'` → `t('pw_new')`
- `'ຢືນຢັນລະຫັດຜ່ານໃໝ່'` → `t('pw_confirm')`
- Alert strings → ใช้ t() ที่ตรงกัน
- Language buttons: เพิ่ม `vi` option: `{ lo: 'ລາວ', th: 'ไทย', en: 'EN', vi: 'VI' }`

**`app/(tabs)/favorites.tsx`**
- `'ລາຍການທີ່ມັກ'` → `t('tab_favorites')`
- `'ລາຍການ'` → `t('fav_items')`
- `'ຮຽງຕາມ:'` → `t('fav_sort_by')`
- `'ລ່າສຸດ'` → `t('fav_sort_latest')`
- `'ຊື່'` → `t('fav_sort_name')`
- `'ລຶບ'` → `t('common_delete')`
- `'ລຶບອອກ'` → `t('fav_remove')`
- Alert strings → ใช้ t()
- Empty state strings → ใช้ t()

**`app/history.tsx`**
- `'ປະຫວັດການອ່ານ'` → `t('history_title')`
- `'ລົບທັງໝົດ'` → `t('history_clear')`
- `'ມື້ນີ້'` ใน getDateLabel → `t('today')`
- `'ມື້ວານ'` → `t('yesterday')`
- `'ກ່ອນໜ້ານີ້'` → `t('before')`
- Alert strings → ใช้ t()
- Empty state → ใช้ t()

**`app/notifications.tsx`**
- `'ການແຈ້ງເຕືອນ'` → `t('notif_title')`
- `'ອ່ານທັງໝົດ'` → `t('notif_mark_all')`
- `'ບໍ່ມີການແຈ້ງເຕືອນ'` → `t('notif_empty')`
- `'ເຂົ້າສູ່ລະບົບ...'` → `t('notif_login')`

**`app/research/[slug].tsx`**
- `'ລາຍລະອຽດ'` → `t('detail_title')`
- `'ໜ່ວຍງານ'` → `t('detail_org')`
- `'ຜູ້ວິໄຈ'` → `t('detail_author')`
- `'ບົດຄັດຫຍໍ້'` → `t('detail_abstract')`
- `'ຄຳສຳຄັນ'` → `t('detail_keywords')`
- `'ງານວິໄຈທີ່ກ່ຽວຂ້ອງ'` → `t('detail_related')`
- `'ອ່ານ PDF ອອນລາຍ'` → `t('detail_read_pdf')`
- `'ບໍ່ພົບງານວິໄຈ'` → `t('detail_not_found')`
- `'ເທື່ອ'` → `t('detail_views')`
- `'ໃຫ້ຄະແນນ:'` → `t('rating_label')`
- `'ເຂົ້າສູ່ລະບົບເພື່ອໃຫ້ຄະແນນ'` → `t('rating_login')`
- `'ຄະແນນ'` → `t('rating_count')`
- `'ຄຳເຫັນ'` → `t('comment_title')`
- `'ຂຽນຄຳເຫັນ...'` → `t('comment_placeholder')`
- `'ເຂົ້າສູ່ລະບົບເພື່ອຄຳເຫັນ'` → `t('comment_login')`
- `'ຍັງບໍ່ມີຄຳເຫັນ'` → `t('comment_empty')`
- Alert strings → ใช้ t()

**`app/(auth)/login.tsx`**
- `'ເຂົ້າສູ່ລະບົບ'` title → `t('login_title')`
- subtitle → `t('login_subtitle')`
- button → `t('login_btn')`
- no account → `t('login_no_account')`
- forgot → `t('login_forgot')`
- Alert title/msg → ใช้ t()
- validation → ใช้ t()
- field labels → ใช้ t()

**`app/(auth)/register.tsx`**
- title → `t('register_title')`
- subtitle → `t('register_subtitle')`
- button → `t('register_btn')`
- has account → `t('register_has_account')`
- Alert/validation → ใช้ t()
- field labels → ใช้ t()

---

## วิธีใช้ใน Cursor

```
@constants/translations.ts @contexts/LanguageContext.tsx
@app/(tabs)/index.tsx @app/(tabs)/research.tsx @app/search.tsx
@app/(tabs)/account.tsx @app/(tabs)/favorites.tsx @app/history.tsx
@app/notifications.tsx @app/research/[slug].tsx
@app/(auth)/login.tsx @app/(auth)/register.tsx

i18n Phase:
1. สร้าง constants/translations.ts ใหม่ตามโค้ดด้านบน
2. แก้ contexts/LanguageContext.tsx: เพิ่ม vi, export useT hook
3. แก้ทุกไฟล์: import useT + เปลี่ยน hardcoded string → t('key')
   ตาม mapping ที่ระบุในแต่ละไฟล์
ห้ามแตะไฟล์อื่น
```

## ตรวจสอบหลังรัน

1. `npx tsc --noEmit` — 0 errors
2. เปลี่ยนภาษาเป็น `ไทย` → ทุก string เปลี่ยนเป็นภาษาไทย
3. เปลี่ยนเป็น `English` → ทุก string เป็นภาษาอังกฤษ
4. เปลี่ยนเป็น `Tiếng Việt` → ทุก string เป็นภาษาเวียดนาม
5. ปิด app แล้วเปิดใหม่ → ภาษาที่เลือกยังคงอยู่
6. Language buttons: ลาว / ไทย / EN / VI

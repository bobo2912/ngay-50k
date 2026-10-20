# Tiêu Gọn – bản iOS

Bản iOS đóng gói **đúng mã web ở thư mục gốc repo** bằng [Capacitor](https://capacitorjs.com). Không có bản code riêng: sửa app như bình thường ở `index.html`, `lock.js`…, rồi đóng gói lại. Những gì khác ở bản iOS nằm trong `native.js` (thư mục gốc). File đó tự nhận ra đang chạy trong app; trên web nó không làm gì.

| Tính năng | Bản web | Bản iOS |
| --- | --- | --- |
| Face ID | passkey PRF (iOS 18+) | Keychain + Face ID gốc |
| Nhận giao dịch từ Phím tắt | trạm Cloudflare hoặc dán | tác vụ **Ghi vào Tiêu Gọn**, ngay trên máy |
| Widget | không có | "Hôm nay còn được tiêu": màn hình chính và màn hình khoá |
| Thông báo ngân sách AI | thông báo web | thông báo iPhone |
| Sao lưu / CSV | chia sẻ kiểu web | bảng chia sẻ iOS |
| Đọc chữ trong ảnh | tải Tesseract từ jsDelivr | Tesseract có sẵn trong app |
| Cập nhật | tự nhận khi đẩy lên GitHub | qua App Store / TestFlight |

## Cấu trúc

```
ios-app/
  package.json, capacitor.config.json   Capacitor 8, appId io.github.bobo2912.tieugon
  scripts/build-web.mjs                  chép mã web + Tesseract vào www/ (không đưa lên git)
  ios/App/App.xcodeproj                  dự án Xcode: target App + TieuGonWidgetExtension
  ios/App/App/TieuGonPlugin.swift        cầu nối JS ↔ iOS (Face ID, thông báo, chia sẻ, link, hàng đợi, widget)
  ios/App/App/TGIntents.swift            tác vụ Phím tắt: Ghi vào Tiêu Gọn, Hôm nay còn được tiêu bao nhiêu
  ios/App/App/TGViewController.swift     màn hình chính, đăng ký plugin
  ios/App/Shared/TGShared.swift          dùng chung app + widget (App Group)
  ios/App/TieuGonWidget/                 widget
```

Mã định danh: app `io.github.bobo2912.tieugon`, widget `io.github.bobo2912.tieugon.widget`, App Group `group.io.github.bobo2912.tieugon`. Yêu cầu iOS 16 trở lên, chỉ iPhone.

## Mỗi lần đóng gói

```bash
cd ios-app
npm install          # lần đầu
npm run sync         # chép mã web mới nhất vào dự án Xcode
```

Tăng **Version** (vd 1.0 → 1.1) khi phát hành bản mới lên App Store. **Build** tăng mỗi lần tải lên (đường GitHub Actions tự lấy số lần chạy).

## Cách 1: có máy Mac

1. Cài Xcode từ App Store, đăng nhập Apple ID của tài khoản nhà phát triển (Xcode → Settings → Accounts).
2. Trên Mac: `git clone` repo, `cd ios-app && npm install && npm run sync`, rồi `npm run open`.
3. Trong Xcode chọn từng target **App** và **TieuGonWidgetExtension** → tab **Signing & Capabilities** → Team: chọn tài khoản của bạn. Kiểm tra mục **App Groups** có tick `group.io.github.bobo2912.tieugon` ở cả hai target.
4. Cắm iPhone, chọn máy ở thanh trên, bấm ▶ để chạy thử.
5. Đẩy lên TestFlight: **Product → Archive** → **Distribute App** → **App Store Connect**.

## Cách 2: không có Mac – build trên máy Mac của GitHub

Repo công khai nên GitHub cho dùng máy Mac miễn phí.

1. [App Store Connect](https://appstoreconnect.apple.com) → **Users and Access → Integrations → App Store Connect API** → tạo khoá vai trò **App Manager**. Tải file `.p8` (chỉ tải được một lần), ghi lại **Key ID** và **Issuer ID**.
2. [developer.apple.com](https://developer.apple.com/account) → **Membership**: ghi lại **Team ID**.
3. Repo GitHub → **Settings → Secrets and variables → Actions** → thêm 4 secret: `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` (dán toàn bộ nội dung file .p8).
4. App Store Connect → **Apps → ＋ → New App**: nền tảng iOS, tên *Tiêu Gọn – Quản lý chi tiêu*, ngôn ngữ chính Tiếng Việt, Bundle ID `io.github.bobo2912.tieugon` (chưa có trong danh sách thì tạo ở developer.apple.com → Identifiers, bật App Groups).
5. Tab **Actions** → **iOS → TestFlight** → **Run workflow**. Khoảng 15–25 phút sau bản build hiện trong TestFlight.

Nếu bước Build báo lỗi App Group: vào developer.apple.com → **Identifiers → App Groups** tạo `group.io.github.bobo2912.tieugon`, gắn vào cả hai Identifier (app và `.widget`), rồi chạy lại.

## Cài Phím tắt trên bản iOS

Trong app: **Cài đặt → Tự ghi từ thông báo → Cài đặt từng bước** (chọn *Gửi thẳng vào app*). Tóm tắt: automation **Thông báo** của MB Bank, lọc tiêu đề "Thông báo biến động số dư", chạy ngay không hỏi, một tác vụ **Ghi vào Tiêu Gọn** với Nội dung = *Shortcut Input → Body*.

## Chưa chạy thử được

Mã Swift được viết và kiểm tra cấu trúc dự án trên Linux, chưa biên dịch bằng Xcode. Phần web của bản iOS đã thử bằng trình duyệt với plugin giả lập. Lần build đầu có lỗi biên dịch thì gửi nguyên văn lỗi để sửa.

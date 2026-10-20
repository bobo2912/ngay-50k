// Tiêu Gọn – tác vụ cho app Phím tắt (App Intents, iOS 16+).
//
// "Ghi vào Tiêu Gọn": automation Thông báo của Phím tắt truyền nội dung thông báo ngân hàng vào đây.
// Tác vụ chạy ngầm (không mở app), chỉ cất nội dung vào hàng đợi trên máy. Lần mở app sau
// (hoặc ngay lập tức nếu app đang mở) native.js lấy hàng đợi và đưa vào Chat như thông báo từ trạm Cloudflare.
// Không có mạng, không có máy chủ: thay cho trạm Cloudflare ở bản iOS.
import AppIntents
import Foundation

@available(iOS 16.0, *)
struct GhiVaoTieuGonIntent: AppIntent {
    static var title: LocalizedStringResource = "Ghi vào Tiêu Gọn"
    static var description = IntentDescription("Gửi nội dung thông báo biến động số dư vào Tiêu Gọn. Mở app là giao dịch hiện trong Chat để bạn kiểm tra rồi bấm Ghi.")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Nội dung", description: "Thường là Shortcut Input → Body của thông báo ngân hàng",
               inputOptions: String.IntentInputOptions(multiline: true))
    var text: String

    static var parameterSummary: some ParameterSummary {
        Summary("Ghi \(\.$text) vào Tiêu Gọn")
    }

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        TGShared.enqueue(text)
        await MainActor.run {
            NotificationCenter.default.post(name: TGShared.queueChanged, object: nil)
        }
        // Trả "TG_OK" giống trạm Cloudflare, để phím tắt cũ có bước If vẫn chạy đúng
        return .result(value: "TG_OK")
    }
}

@available(iOS 16.0, *)
struct HomNayConIntent: AppIntent {
    static var title: LocalizedStringResource = "Hôm nay còn được tiêu bao nhiêu"
    static var description = IntentDescription("Đọc số tiền còn được tiêu hôm nay theo hạn mức, tính tới lần mở Tiêu Gọn gần nhất.")
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog {
        guard let w = TGShared.widgetData(), !w.hidden else {
            return .result(value: "", dialog: "Mở Tiêu Gọn một lần để cập nhật số liệu.")
        }
        let today = TGShared.dayKey(Date())
        guard let d = w.days.first(where: { $0.d == today }) else {
            return .result(value: "", dialog: "Mở Tiêu Gọn một lần để cập nhật số liệu hôm nay.")
        }
        let left = w.budget - d.spent
        let text = left >= 0 ? "Hôm nay còn được tiêu \(TGShared.money(left))."
                             : "Hôm nay đã vượt hạn mức \(TGShared.money(-left))."
        return .result(value: text, dialog: IntentDialog(stringLiteral: text))
    }
}

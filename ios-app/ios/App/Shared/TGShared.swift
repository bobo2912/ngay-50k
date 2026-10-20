// Tiêu Gọn – phần dùng chung giữa app và widget (cùng App Group).
// File này thuộc CẢ HAI target: App và TieuGonWidget.
import Foundation

enum TGShared {
    /// App Group: app ghi, widget và tác vụ Phím tắt đọc. Phải khớp trong App.entitlements và TieuGonWidget.entitlements.
    static let group = "group.io.github.bobo2912.tieugon"
    static var defaults: UserDefaults { UserDefaults(suiteName: group) ?? .standard }

    static let queueKey = "tg.queue.v1"
    static let widgetKey = "tg.widget.v1"
    static let widgetKind = "TieuGonToday"
    /// Báo trong cùng tiến trình app: Phím tắt vừa gửi giao dịch vào hàng đợi (app đang mở thì hiện ngay).
    static let queueChanged = Notification.Name("TGQueueChanged")

    // MARK: - Hàng đợi thông báo ngân hàng từ Phím tắt

    struct QueueItem: Codable {
        var t: String      // nội dung thông báo (một hoặc nhiều dòng)
        var at: Double     // thời điểm nhận, mili giây
    }

    private static let lock = NSLock()

    /// Thêm vào hàng đợi; trả về số mục đang chờ. Giữ tối đa 300 mục, 3 ngày (giống trạm Cloudflare).
    @discardableResult
    static func enqueue(_ text: String) -> Int {
        let clean = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !clean.isEmpty else { return queue().count }
        lock.lock(); defer { lock.unlock() }
        let now = Date().timeIntervalSince1970 * 1000
        var q = readQueue().filter { now - $0.at < 3 * 86_400_000 }
        q.append(QueueItem(t: String(clean.prefix(20_000)), at: now))
        if q.count > 300 { q.removeFirst(q.count - 300) }
        writeQueue(q)
        return q.count
    }

    static func queue() -> [QueueItem] {
        lock.lock(); defer { lock.unlock() }
        return readQueue()
    }

    /// Lấy hết và xoá khỏi hàng đợi.
    static func takeQueue() -> [QueueItem] {
        lock.lock(); defer { lock.unlock() }
        let q = readQueue()
        if !q.isEmpty { writeQueue([]) }
        return q
    }

    private static func readQueue() -> [QueueItem] {
        guard let d = defaults.data(forKey: queueKey) else { return [] }
        return (try? JSONDecoder().decode([QueueItem].self, from: d)) ?? []
    }
    private static func writeQueue(_ q: [QueueItem]) {
        defaults.set(try? JSONEncoder().encode(q), forKey: queueKey)
    }

    // MARK: - Dữ liệu cho widget "Hôm nay còn được tiêu"

    struct Day: Codable {
        var d: String        // yyyy-MM-dd
        var spent: Double    // đã tính vào hạn mức ngày đó (kể cả khoản định kỳ đã lên lịch)
    }
    struct WidgetData: Codable {
        var budget: Double
        var days: [Day]      // hôm nay và vài ngày tới, để widget đổi đúng lúc nửa đêm
        var hidden: Bool     // app đang khoá bằng mã PIN và người dùng chọn ẩn số tiền
        var demo: Bool?      // đang xem dữ liệu mẫu
        var updated: Double  // mili giây
    }

    static func widgetData() -> WidgetData? {
        guard let d = defaults.data(forKey: widgetKey) else { return nil }
        return try? JSONDecoder().decode(WidgetData.self, from: d)
    }

    /// Nhận chuỗi JSON từ app (native.js). Trả về false nếu sai dạng.
    @discardableResult
    static func setWidget(json: String) -> Bool {
        guard let raw = json.data(using: .utf8),
              (try? JSONDecoder().decode(WidgetData.self, from: raw)) != nil else { return false }
        defaults.set(raw, forKey: widgetKey)
        return true
    }

    static func clearWidget() { defaults.removeObject(forKey: widgetKey) }

    static func dayKey(_ date: Date) -> String {
        let c = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    /// 45.000 → "45.000đ"; 1.250.000 → "1.250.000đ"
    static func money(_ v: Double) -> String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.groupingSeparator = "."
        f.maximumFractionDigits = 0
        return (f.string(from: NSNumber(value: v.rounded())) ?? "\(Int(v))") + "đ"
    }
    /// Gọn cho chỗ hẹp: 45.000 → "45k"; 1.250.000 → "1,3tr"
    static func short(_ v: Double) -> String {
        let a = abs(v), s = v < 0 ? "−" : ""
        if a >= 1_000_000 {
            let m = a / 1_000_000
            return s + (m >= 10 ? String(format: "%.0f", m) : String(format: "%.1f", m).replacingOccurrences(of: ".", with: ",")) + "tr"
        }
        if a >= 1000 { return s + String(format: "%.0f", a / 1000) + "k" }
        return s + String(format: "%.0f", a)
    }
}

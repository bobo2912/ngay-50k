// Tiêu Gọn – widget "Hôm nay còn được tiêu" cho màn hình chính và màn hình khoá (iOS 16+).
// Số liệu do app ghi vào App Group mỗi lần thay đổi (TGShared.WidgetData): hạn mức và số đã tính vào
// hạn mức của hôm nay cùng vài ngày tới, nên qua nửa đêm widget tự sang ngày mới mà không cần mở app.
import WidgetKit
import SwiftUI

// MARK: - Dữ liệu

struct TGEntry: TimelineEntry {
    enum State { case empty, hidden, stale, ok }
    let date: Date
    let state: State
    let budget: Double
    let spent: Double
    let demo: Bool
    let updated: Date?

    var left: Double { budget - spent }
    var over: Bool { left < 0 }
    /// Phần còn lại trên hạn mức, 0…1 (vượt thì 0)
    var fraction: Double { budget > 0 ? max(0, min(1, left / budget)) : 0 }

    static let sample = TGEntry(date: Date(), state: .ok, budget: 100_000, spent: 64_000, demo: false, updated: Date())
}

struct TGProvider: TimelineProvider {
    func placeholder(in context: Context) -> TGEntry { .sample }

    func getSnapshot(in context: Context, completion: @escaping (TGEntry) -> Void) {
        let e = entry(for: Date())
        completion(context.isPreview && e.state != .ok ? .sample : e)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TGEntry>) -> Void) {
        let cal = Calendar.current
        let now = Date()
        var entries = [entry(for: now)]
        // Một mục cho mỗi nửa đêm trong 3 ngày tới
        var day = cal.startOfDay(for: now)
        for _ in 0..<3 {
            guard let next = cal.date(byAdding: .day, value: 1, to: day) else { break }
            day = next
            entries.append(entry(for: day))
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }

    private func entry(for date: Date) -> TGEntry {
        guard let w = TGShared.widgetData() else {
            return TGEntry(date: date, state: .empty, budget: 0, spent: 0, demo: false, updated: nil)
        }
        let upd = Date(timeIntervalSince1970: w.updated / 1000)
        if w.hidden {
            return TGEntry(date: date, state: .hidden, budget: w.budget, spent: 0, demo: false, updated: upd)
        }
        let key = TGShared.dayKey(date)
        guard let d = w.days.first(where: { $0.d == key }) else {
            return TGEntry(date: date, state: .stale, budget: w.budget, spent: 0, demo: w.demo ?? false, updated: upd)
        }
        return TGEntry(date: date, state: .ok, budget: w.budget, spent: d.spent, demo: w.demo ?? false, updated: upd)
    }
}

// MARK: - Giao diện

private let brand = Color(red: 0.12, green: 0.42, blue: 0.94)     // #1F6BF0, màu icon app
private let overRed = Color(red: 0.76, green: 0.20, blue: 0.17)   // #C3342C, màu "vượt" trong app

extension View {
    /// iOS 17 bắt buộc khai báo nền widget; iOS 16 dùng nền thường.
    @ViewBuilder func tgBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(for: .widget) { Color(.systemBackground) }
        } else {
            background(Color(.systemBackground))
        }
    }
}

struct TGMessage: View {
    let icon: String
    let text: String
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(systemName: icon).font(.title3).foregroundStyle(brand)
            Spacer(minLength: 0)
            Text(text).font(.footnote).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

struct TGHomeView: View {
    let e: TGEntry
    let medium: Bool

    var body: some View {
        switch e.state {
        case .empty:  TGMessage(icon: "wallet.pass", text: "Mở Tiêu Gọn để bắt đầu.")
        case .hidden: TGMessage(icon: "lock.fill", text: "Tiêu Gọn đang khoá. Mở app để xem.")
        case .stale:  TGMessage(icon: "arrow.clockwise", text: "Ngày mới. Mở Tiêu Gọn để cập nhật.")
        case .ok:     content
        }
    }

    private var content: some View {
        HStack(alignment: .top, spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text(e.over ? "Hôm nay vượt" : "Hôm nay còn")
                    .font(.caption).fontWeight(.semibold).foregroundStyle(.secondary)
                Text(TGShared.money(abs(e.left)))
                    .font(.system(size: medium ? 30 : 26, weight: .bold, design: .rounded))
                    .foregroundStyle(e.over ? overRed : .primary)
                    .minimumScaleFactor(0.5).lineLimit(1)
                    .privacySensitive()
                Spacer(minLength: 0)
                ProgressView(value: e.over ? 1 : 1 - e.fraction)
                    .tint(e.over ? overRed : brand)
                Text("Hạn mức \(TGShared.short(e.budget))" + (e.demo ? " · mẫu" : ""))
                    .font(.caption2).foregroundStyle(.secondary)
            }
            if medium {
                VStack(alignment: .leading, spacing: 8) {
                    row("Đã tiêu", TGShared.money(e.spent))
                    row("Hạn mức", TGShared.money(e.budget))
                    Spacer(minLength: 0)
                    if let u = e.updated {
                        Text("Cập nhật \(u.formatted(date: .omitted, time: .shortened))")
                            .font(.caption2).foregroundStyle(.tertiary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private func row(_ k: String, _ v: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(k).font(.caption2).foregroundStyle(.secondary)
            Text(v).font(.subheadline).fontWeight(.semibold).privacySensitive().lineLimit(1).minimumScaleFactor(0.7)
        }
    }
}

struct TGCircularView: View {
    let e: TGEntry
    var body: some View {
        if e.state == .ok {
            Gauge(value: e.fraction) {
                Text("Còn")
            } currentValueLabel: {
                Text(TGShared.short(e.left)).privacySensitive()
            }
            .gaugeStyle(.accessoryCircularCapacity)
        } else {
            ZStack { AccessoryWidgetBackground(); Image(systemName: e.state == .hidden ? "lock.fill" : "wallet.pass") }
        }
    }
}

struct TGRectangularView: View {
    let e: TGEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            switch e.state {
            case .ok:
                Text(e.over ? "Hôm nay vượt" : "Hôm nay còn").font(.caption2)
                Text(TGShared.money(abs(e.left))).font(.headline).privacySensitive()
                Gauge(value: e.fraction) { EmptyView() }.gaugeStyle(.accessoryLinearCapacity)
            case .hidden:
                Label("Tiêu Gọn đang khoá", systemImage: "lock.fill").font(.caption)
            case .stale:
                Text("Tiêu Gọn").font(.headline)
                Text("Mở app để cập nhật").font(.caption)
            case .empty:
                Text("Tiêu Gọn").font(.headline)
                Text("Mở app để bắt đầu").font(.caption)
            }
        }
    }
}

struct TGInlineView: View {
    let e: TGEntry
    var body: some View {
        if e.state == .ok {
            Text(e.over ? "Vượt \(TGShared.short(-e.left)) hôm nay" : "Còn \(TGShared.short(e.left)) hôm nay").privacySensitive()
        } else {
            Text("Tiêu Gọn")
        }
    }
}

struct TGWidgetView: View {
    @Environment(\.widgetFamily) var family
    let e: TGEntry
    var body: some View {
        Group {
            switch family {
            case .accessoryCircular: TGCircularView(e: e)
            case .accessoryRectangular: TGRectangularView(e: e)
            case .accessoryInline: TGInlineView(e: e)
            case .systemMedium: TGHomeView(e: e, medium: true)
            default: TGHomeView(e: e, medium: false)
            }
        }
        .tgBackground()
    }
}

// MARK: - Khai báo widget

struct TieuGonTodayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: TGShared.widgetKind, provider: TGProvider()) { e in
            TGWidgetView(e: e)
        }
        .configurationDisplayName("Hôm nay còn được tiêu")
        .description("Số tiền còn lại trong hạn mức hôm nay.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

@main
struct TieuGonWidgetBundle: WidgetBundle {
    var body: some Widget {
        TieuGonTodayWidget()
    }
}

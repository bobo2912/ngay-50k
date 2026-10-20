// Tiêu Gọn – cầu nối giữa mã web (native.js) và iOS.
// JS gọi qua window.Capacitor: TieuGon.info(), TieuGon.bioLoad(...), ...
// Mỗi hàm nhỏ, không phụ thuộc plugin bên ngoài nào ngoài lõi Capacitor.
import Foundation
import Capacitor
import LocalAuthentication
import Security
import UserNotifications
import UIKit
import WidgetKit

@objc(TieuGonPlugin)
public class TieuGonPlugin: CAPPlugin, CAPBridgedPlugin, NotificationHandlerProtocol {
    public let identifier = "TieuGonPlugin"
    public let jsName = "TieuGon"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "info", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "bioSave", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "bioLoad", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "bioDelete", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "notifyState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "notifyAsk", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "notify", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "shareFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openUrl", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "queueTake", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "widgetSet", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "widgetClear", returnType: CAPPluginReturnPromise),
    ]

    private let kcService = "io.github.bobo2912.tieugon.lock"
    private let kcAccount = "dek"
    private var queueObserver: NSObjectProtocol?

    override public func load() {
        // Thông báo do app tự tạo: cho hiện cả khi app đang mở
        bridge?.notificationRouter.localNotificationHandler = self
        // Phím tắt gửi giao dịch lúc app đang mở: báo JS lấy ngay
        queueObserver = NotificationCenter.default.addObserver(forName: TGShared.queueChanged, object: nil, queue: .main) { [weak self] _ in
            self?.notifyListeners("queue", data: ["count": TGShared.queue().count])
        }
    }

    deinit { if let o = queueObserver { NotificationCenter.default.removeObserver(o) } }

    // MARK: - Thông tin máy

    @objc func info(_ call: CAPPluginCall) {
        let ctx = LAContext()
        var err: NSError?
        let canBio = ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &err)
        var bio = "none"
        if canBio {
            switch ctx.biometryType {
            case .faceID: bio = "faceID"
            case .touchID: bio = "touchID"
            default:
                if #available(iOS 17.0, *), ctx.biometryType == .opticID { bio = "opticID" }
            }
        }
        let b = Bundle.main
        call.resolve([
            "platform": "ios",
            "bio": bio,
            "bioSaved": keychainHasItem(),
            "version": b.infoDictionary?["CFBundleShortVersionString"] as? String ?? "",
            "build": b.infoDictionary?["CFBundleVersion"] as? String ?? "",
        ])
    }

    // MARK: - Face ID: cất khoá dữ liệu trong Keychain, chỉ lấy ra được sau khi xác thực sinh trắc

    @objc func bioSave(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), let data = key.data(using: .utf8), !key.isEmpty else {
            call.reject("Thiếu khoá", "args"); return
        }
        var acErr: Unmanaged<CFError>?
        // .biometryCurrentSet: thêm hay xoá khuôn mặt / vân tay trong Cài đặt iPhone thì khoá này mất hiệu lực,
        // người dùng phải nhập mã PIN rồi bật lại Face ID trong app. Người khác thêm mặt mình vào máy cũng không mở được.
        guard let ac = SecAccessControlCreateWithFlags(nil, kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly, .biometryCurrentSet, &acErr) else {
            call.reject("Máy chưa đặt mật mã màn hình, không bật được Face ID", "nopasscode"); return
        }
        let base: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                                   kSecAttrService as String: kcService,
                                   kSecAttrAccount as String: kcAccount]
        SecItemDelete(base as CFDictionary)
        var add = base
        add[kSecValueData as String] = data
        add[kSecAttrAccessControl as String] = ac
        let st = SecItemAdd(add as CFDictionary, nil)
        if st == errSecSuccess { call.resolve() }
        else { call.reject("Không lưu được vào Keychain (\(st))", st == errSecAuthFailed ? "nopasscode" : "keychain") }
    }

    @objc func bioLoad(_ call: CAPPluginCall) {
        let reason = call.getString("reason") ?? "Mở khoá Tiêu Gọn"
        let ctx = LAContext()
        ctx.localizedReason = reason
        ctx.localizedFallbackTitle = "Nhập mã PIN"
        let q: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                                kSecAttrService as String: kcService,
                                kSecAttrAccount as String: kcAccount,
                                kSecReturnData as String: true,
                                kSecMatchLimit as String: kSecMatchLimitOne,
                                kSecUseAuthenticationContext as String: ctx]
        // SecItemCopyMatching chờ người dùng nhìn Face ID: chạy ngoài luồng giao diện
        DispatchQueue.global(qos: .userInitiated).async {
            var out: AnyObject?
            let st = SecItemCopyMatching(q as CFDictionary, &out)
            DispatchQueue.main.async {
                switch st {
                case errSecSuccess:
                    if let d = out as? Data, let s = String(data: d, encoding: .utf8) { call.resolve(["key": s]) }
                    else { call.reject("Dữ liệu Keychain lạ", "fail") }
                case errSecUserCanceled:
                    call.reject("Đã huỷ", "cancel")
                case errSecItemNotFound:
                    // Chưa bật, hoặc danh sách khuôn mặt / vân tay vừa thay đổi nên iOS đã huỷ khoá
                    call.reject("Face ID cần bật lại", "nokey")
                case errSecAuthFailed:
                    call.reject("Không nhận ra", "fail")
                default:
                    call.reject("Lỗi Keychain \(st)", "fail")
                }
            }
        }
    }

    @objc func bioDelete(_ call: CAPPluginCall) {
        SecItemDelete([kSecClass as String: kSecClassGenericPassword,
                       kSecAttrService as String: kcService,
                       kSecAttrAccount as String: kcAccount] as CFDictionary)
        call.resolve()
    }

    private func keychainHasItem() -> Bool {
        let ctx = LAContext()
        ctx.interactionNotAllowed = true          // chỉ hỏi có hay không, không bật Face ID
        let q: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                                kSecAttrService as String: kcService,
                                kSecAttrAccount as String: kcAccount,
                                kSecUseAuthenticationContext as String: ctx]
        let st = SecItemCopyMatching(q as CFDictionary, nil)
        return st == errSecSuccess || st == errSecInteractionNotAllowed
    }

    // MARK: - Thông báo trên máy (báo ngân sách AI sắp hết)

    @objc func notifyState(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().getNotificationSettings { s in
            let state: String
            switch s.authorizationStatus {
            case .authorized, .provisional, .ephemeral: state = "granted"
            case .denied: state = "denied"
            default: state = "prompt"
            }
            call.resolve(["state": state])
        }
    }

    @objc func notifyAsk(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { ok, _ in
            call.resolve(["state": ok ? "granted" : "denied"])
        }
    }

    @objc func notify(_ call: CAPPluginCall) {
        let content = UNMutableNotificationContent()
        content.title = call.getString("title") ?? "Tiêu Gọn"
        content.body = call.getString("body") ?? ""
        content.sound = .default
        let id = call.getString("id") ?? UUID().uuidString
        let req = UNNotificationRequest(identifier: id, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(req) { err in
            if let err = err { call.reject(err.localizedDescription, "notify") } else { call.resolve() }
        }
    }

    public func willPresent(notification: UNNotification) -> UNNotificationPresentationOptions {
        return [.banner, .list, .sound]
    }
    public func didReceive(response: UNNotificationResponse) {}

    // MARK: - Chia sẻ / lưu file (sao lưu JSON, CSV)

    @objc func shareFile(_ call: CAPPluginCall) {
        guard let name = call.getString("name"), let text = call.getString("text") else {
            call.reject("Thiếu tên hoặc nội dung file", "args"); return
        }
        let safe = name.replacingOccurrences(of: "/", with: "-")
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("share", isDirectory: true)
        try? FileManager.default.removeItem(at: dir)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let url = dir.appendingPathComponent(safe)
        do { try text.write(to: url, atomically: true, encoding: .utf8) }
        catch { call.reject("Không tạo được file: \(error.localizedDescription)", "write"); return }

        DispatchQueue.main.async { [weak self] in
            guard let vc = self?.bridge?.viewController else { call.reject("Không mở được bảng chia sẻ", "ui"); return }
            let av = UIActivityViewController(activityItems: [url], applicationActivities: nil)
            av.completionWithItemsHandler = { activity, completed, _, error in
                try? FileManager.default.removeItem(at: url)
                if let error = error { call.reject(error.localizedDescription, "share"); return }
                call.resolve(["completed": completed, "activity": activity?.rawValue ?? ""])
            }
            // iPad: bảng chia sẻ cần chỗ neo
            if let pop = av.popoverPresentationController {
                pop.sourceView = vc.view
                pop.sourceRect = CGRect(x: vc.view.bounds.midX, y: vc.view.bounds.maxY - 80, width: 1, height: 1)
                pop.permittedArrowDirections = []
            }
            vc.present(av, animated: true)
        }
    }

    // MARK: - Mở link ngoài bằng Safari / app khác

    @objc func openUrl(_ call: CAPPluginCall) {
        guard let s = call.getString("url"), let url = URL(string: s),
              let scheme = url.scheme?.lowercased(), ["https", "http", "mailto", "tel", "shortcuts"].contains(scheme) else {
            call.reject("Link không hợp lệ", "args"); return
        }
        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { ok in call.resolve(["opened": ok]) }
        }
    }

    // MARK: - Hàng đợi giao dịch từ Phím tắt (tác vụ "Ghi vào Tiêu Gọn")

    @objc func queueTake(_ call: CAPPluginCall) {
        let items = TGShared.takeQueue().map { ["t": $0.t, "at": $0.at] as [String: Any] }
        call.resolve(["items": items])
    }

    // MARK: - Widget

    @objc func widgetSet(_ call: CAPPluginCall) {
        guard let json = call.getString("json"), TGShared.setWidget(json: json) else {
            call.reject("Dữ liệu widget sai dạng", "args"); return
        }
        WidgetCenter.shared.reloadTimelines(ofKind: TGShared.widgetKind)
        call.resolve()
    }

    @objc func widgetClear(_ call: CAPPluginCall) {
        TGShared.clearWidget()
        WidgetCenter.shared.reloadTimelines(ofKind: TGShared.widgetKind)
        call.resolve()
    }
}

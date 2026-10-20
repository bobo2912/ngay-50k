// Tiêu Gọn – màn hình chính của app: khung Capacitor + đăng ký plugin TieuGon.
// Main.storyboard trỏ tới lớp này (customClass="TGViewController", customModule="App").
import UIKit
import Capacitor

class TGViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(TieuGonPlugin())
        // Không cho vuốt lùi trang như trình duyệt: app chỉ có một trang
        webView?.allowsBackForwardNavigationGestures = false
        // Nền trùng màu app, đỡ nháy trắng lúc mở ở chế độ tối
        webView?.isOpaque = false
        webView?.backgroundColor = .clear
        webView?.scrollView.backgroundColor = .clear
    }
}

import Foundation
import AVFoundation
import CoreMedia

enum ProxyError: Error, CustomStringConvertible {
    case usage
    case invalidNumber(String)
    case sourceUnavailable(String)
    case exporterUnavailable
    case mp4Unsupported
    case exportFailed(String)
    case emptyRange

    var description: String {
        switch self {
        case .usage:
            return "usage: abraxas-media-proxy <source> <output> <startSeconds> <durationSeconds>"
        case .invalidNumber(let value):
            return "invalid number: \(value)"
        case .sourceUnavailable(let value):
            return "source unavailable: \(value)"
        case .exporterUnavailable:
            return "AVAssetExportSession unavailable for AVAssetExportPreset960x540"
        case .mp4Unsupported:
            return "AVAssetExportSession does not support MP4 for this source/preset"
        case .exportFailed(let value):
            return "export failed: \(value)"
        case .emptyRange:
            return "requested proxy range is empty"
        }
    }
}

func runProxy() throws {
    let args = CommandLine.arguments

    if args.count == 2 && args[1] == "--self-test" {
        print("ABRAXAS_MEDIA_PROXY_SELF_TEST_OK")
        return
    }

    guard args.count == 5 else {
        throw ProxyError.usage
    }

    let sourceURL = URL(fileURLWithPath: args[1])
    let outputURL = URL(fileURLWithPath: args[2])

    guard let startSeconds = Double(args[3]) else {
        throw ProxyError.invalidNumber(args[3])
    }

    guard let durationSeconds = Double(args[4]) else {
        throw ProxyError.invalidNumber(args[4])
    }

    guard FileManager.default.fileExists(atPath: sourceURL.path) else {
        throw ProxyError.sourceUnavailable(sourceURL.path)
    }

    let asset = AVURLAsset(url: sourceURL)

    let assetDuration = asset.duration.seconds
    let safeStart = max(0.0, min(startSeconds, max(0.0, assetDuration - 0.1)))
    let available = max(0.0, assetDuration - safeStart)
    let safeDuration = min(max(0.1, durationSeconds), available)

    guard safeDuration > 0 else {
        throw ProxyError.emptyRange
    }

    guard let exporter = AVAssetExportSession(
        asset: asset,
        presetName: AVAssetExportPreset960x540
    ) else {
        throw ProxyError.exporterUnavailable
    }

    guard exporter.supportedFileTypes.contains(.mp4) else {
        throw ProxyError.mp4Unsupported
    }

    try? FileManager.default.removeItem(at: outputURL)
    try FileManager.default.createDirectory(
        at: outputURL.deletingLastPathComponent(),
        withIntermediateDirectories: true
    )

    exporter.outputURL = outputURL
    exporter.outputFileType = .mp4
    exporter.shouldOptimizeForNetworkUse = true
    exporter.timeRange = CMTimeRange(
        start: CMTime(seconds: safeStart, preferredTimescale: 600),
        duration: CMTime(seconds: safeDuration, preferredTimescale: 600)
    )

    let semaphore = DispatchSemaphore(value: 0)

    exporter.exportAsynchronously {
        semaphore.signal()
    }

    semaphore.wait()

    switch exporter.status {
    case .completed:
        let attrs = try FileManager.default.attributesOfItem(atPath: outputURL.path)
        let size = (attrs[.size] as? NSNumber)?.int64Value ?? 0

        print(
            """
            {"status":"ok","path":"\(outputURL.path)","bytes":\(size),"start":\(safeStart),"duration":\(safeDuration)}
            """
        )
    case .failed:
        throw ProxyError.exportFailed(
            exporter.error?.localizedDescription ?? "unknown AVFoundation error"
        )
    case .cancelled:
        throw ProxyError.exportFailed("cancelled")
    default:
        throw ProxyError.exportFailed("unexpected status \(exporter.status.rawValue)")
    }
}

do {
    try runProxy()
} catch {
    fputs("ABRAXAS_MEDIA_PROXY_ERROR: \(error)\n", stderr)
    exit(1)
}

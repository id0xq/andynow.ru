// Subject lifting with Apple Vision (macOS 14+): writes an RGBA PNG of the foreground subject(s)
// and a grayscale mask PNG. Usage: swift lift.swift IN.jpg OUT_cutout.png OUT_mask.png
import Foundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count == 4 else { print("usage: lift IN OUT_cutout OUT_mask"); exit(1) }
let inURL = URL(fileURLWithPath: args[1])
guard let src = CGImageSourceCreateWithURL(inURL as CFURL, nil),
      let cg = CGImageSourceCreateImageAtIndex(src, 0, nil) else { print("cannot read"); exit(1) }
let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any]
let orientRaw = (props?[kCGImagePropertyOrientation] as? UInt32) ?? 1
let orient = CGImagePropertyOrientation(rawValue: orientRaw) ?? .up

let req = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(cgImage: cg, orientation: orient, options: [:])
do { try handler.perform([req]) } catch { print("vision error", error); exit(1) }
guard let result = req.results?.first else { print("no subject"); exit(2) }
print("instances:", result.allInstances.count)
do {
  let maskBuf = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
  let cutBuf = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: false)
  let ctx = CIContext()
  func write(_ buf: CVPixelBuffer, _ path: String) {
    let ci = CIImage(cvPixelBuffer: buf)
    guard let out = ctx.createCGImage(ci, from: ci.extent) else { print("render fail"); return }
    let url = URL(fileURLWithPath: path)
    guard let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else { return }
    CGImageDestinationAddImage(dest, out, nil); CGImageDestinationFinalize(dest)
    print("wrote", path, out.width, out.height)
  }
  write(cutBuf, args[2]); write(maskBuf, args[3])
} catch { print("mask error", error); exit(1) }

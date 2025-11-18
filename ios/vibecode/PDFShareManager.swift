//
//  PDFShareManager.swift
//  vibecode
//
//  Native iOS module for robust PDF sharing
//  Handles Share Sheet presentation without React Native window hierarchy conflicts
//

import Foundation
import UIKit

@objc(PDFShareManager)
class PDFShareManager: NSObject {

  // Main queue requirement for UI operations
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  /// Share a PDF file using native UIActivityViewController
  /// This implementation waits for all view controller transitions to complete
  /// and presents from the root view controller to avoid window hierarchy issues
  @objc
  func sharePDF(_ fileURL: String,
                resolver resolve: @escaping RCTPromiseResolveBlock,
                rejecter reject: @escaping RCTPromiseRejectBlock) {

    // Ensure we're on the main thread
    DispatchQueue.main.async {
      do {
        // Validate and convert file URL
        guard let url = URL(string: fileURL) else {
          reject("INVALID_URL", "Invalid file URL provided", nil)
          return
        }

        // Check if file exists
        guard FileManager.default.fileExists(atPath: url.path) else {
          reject("FILE_NOT_FOUND", "PDF file does not exist at path: \(url.path)", nil)
          return
        }

        NSLog("[PDFShareManager] Preparing to share PDF at: %@", fileURL)

        // Wait for any ongoing view controller transitions to complete
        // This is critical to avoid window hierarchy conflicts
        self.waitForViewControllerTransitions {
          // Get the root view controller safely
          guard let rootVC = self.getRootViewController() else {
            reject("NO_ROOT_VC", "Could not find root view controller", nil)
            return
          }

          NSLog("[PDFShareManager] Root VC ready, presenting share sheet")

          // Create activity view controller with the PDF
          let activityVC = UIActivityViewController(
            activityItems: [url],
            applicationActivities: nil
          )

          // Configure for iPad (required)
          if let popover = activityVC.popoverPresentationController {
            popover.sourceView = rootVC.view
            popover.sourceRect = CGRect(x: rootVC.view.bounds.midX,
                                       y: rootVC.view.bounds.midY,
                                       width: 0,
                                       height: 0)
            popover.permittedArrowDirections = []
          }

          // Track completion
          activityVC.completionWithItemsHandler = { activityType, completed, returnedItems, error in
            if let error = error {
              NSLog("[PDFShareManager] Share error: %@", error.localizedDescription)
              reject("SHARE_ERROR", error.localizedDescription, error)
              return
            }

            if completed {
              NSLog("[PDFShareManager] PDF shared successfully via: %@", activityType?.rawValue ?? "unknown")
              resolve([
                "action": "sharedAction",
                "activityType": activityType?.rawValue ?? ""
              ])
            } else {
              NSLog("[PDFShareManager] User dismissed share sheet")
              resolve([
                "action": "dismissedAction"
              ])
            }
          }

          // Present the share sheet
          // Using animated: false to avoid animation conflicts with React Native
          rootVC.present(activityVC, animated: true, completion: {
            NSLog("[PDFShareManager] Share sheet presented successfully")
          })
        }
      } catch {
        reject("UNEXPECTED_ERROR", "Unexpected error: \(error.localizedDescription)", error)
      }
    }
  }

  // MARK: - Private Helper Methods

  /// Wait for all view controller transitions to complete
  /// This prevents window hierarchy conflicts when called after modal dismissal
  private func waitForViewControllerTransitions(completion: @escaping () -> Void) {
    // Check if there are any ongoing transitions
    guard let rootVC = getRootViewController() else {
      completion()
      return
    }

    // If a transition is in progress, wait for it to complete
    if rootVC.transitionCoordinator != nil {
      NSLog("[PDFShareManager] Waiting for view controller transition to complete...")

      // Wait for the transition to finish
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
        self?.waitForViewControllerTransitions(completion: completion)
      }
    } else {
      NSLog("[PDFShareManager] No ongoing transitions, proceeding")
      completion()
    }
  }

  /// Safely get the root view controller
  /// Handles multiple window scenarios and finds the topmost presented VC
  private func getRootViewController() -> UIViewController? {
    // Get the key window
    let keyWindow: UIWindow?

    if #available(iOS 13.0, *) {
      keyWindow = UIApplication.shared.connectedScenes
        .compactMap { $0 as? UIWindowScene }
        .flatMap { $0.windows }
        .first { $0.isKeyWindow }
    } else {
      keyWindow = UIApplication.shared.keyWindow
    }

    guard let window = keyWindow else {
      NSLog("[PDFShareManager] Could not find key window")
      return nil
    }

    guard var topVC = window.rootViewController else {
      NSLog("[PDFShareManager] Could not find root view controller")
      return nil
    }

    // Traverse to find the topmost presented view controller
    while let presented = topVC.presentedViewController {
      topVC = presented
    }

    NSLog("[PDFShareManager] Found top VC: %@", String(describing: type(of: topVC)))
    return topVC
  }
}

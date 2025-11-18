//
//  PDFShareManager.m
//  vibecode
//
//  Objective-C bridge for PDFShareManager Swift module
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PDFShareManager, NSObject)

// Export the sharePDF method to React Native
RCT_EXTERN_METHOD(sharePDF:(NSString *)fileURL
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Required for React Native to recognize this module
+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end

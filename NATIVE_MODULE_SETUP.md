# Native PDF Share Module Setup

## Overview
This native iOS module provides robust PDF sharing that bypasses React Native window hierarchy issues.

## Files Created
- `ios/vibecode/PDFShareManager.swift` - Native Swift implementation
- `ios/vibecode/PDFShareManager.m` - Objective-C bridge
- `ios/vibecode/vibecode-Bridging-Header.h` - Updated bridging header

## Setup Instructions

### 1. Add Files to Xcode Project

**IMPORTANT:** You need to add the new files to your Xcode project:

1. Open the project in Xcode:
   ```bash
   cd ios
   open vibecode.xcworkspace
   ```

2. In Xcode, right-click on the `vibecode` folder in the Project Navigator

3. Select **"Add Files to vibecode"**

4. Navigate to `ios/vibecode/` and select:
   - `PDFShareManager.swift`
   - `PDFShareManager.m`

5. Make sure the following options are selected:
   - ✅ "Copy items if needed" (should be unchecked since files are already in place)
   - ✅ "Create groups"
   - ✅ Add to targets: `vibecode`

6. Click **Add**

### 2. Verify Bridging Header

The bridging header (`vibecode-Bridging-Header.h`) has already been updated.

Verify in Xcode Build Settings:
1. Select the `vibecode` target
2. Go to **Build Settings**
3. Search for "Objective-C Bridging Header"
4. Verify it points to: `vibecode/vibecode-Bridging-Header.h`

### 3. Rebuild the App

After adding the files to Xcode, rebuild the app:

```bash
# Clean and rebuild
cd ios
rm -rf build
cd ..

# Rebuild the iOS app
npx expo run:ios
```

## How It Works

### Native Module (Swift)
- Waits for all view controller transitions to complete
- Presents Share Sheet from the root view controller
- Avoids window hierarchy conflicts completely
- Handles iPad popover configuration

### JavaScript Integration
```typescript
import { NativeModules } from 'react-native';
const { PDFShareManager } = NativeModules;

// Use the module
const result = await PDFShareManager.sharePDF(fileUri);
```

## Expected Logs

When working correctly, you should see:
```
[PDFExportService] Using native PDFShareManager...
[PDFShareManager] Preparing to share PDF at: file://...
[PDFShareManager] No ongoing transitions, proceeding
[PDFShareManager] Root VC ready, presenting share sheet
[PDFShareManager] Share sheet presented successfully
[PDFShareManager] PDF shared successfully via: com.apple.UIKit.activity.AirDrop
[PDFExportService] Share result: {"action": "sharedAction", "activityType": "..."}
```

## Troubleshooting

### Module not found error
If you get "PDFShareManager native module not available":
1. Make sure files are added to Xcode project (see step 1 above)
2. Clean and rebuild the app
3. Check that bridging header is configured correctly

### Build errors
If you get Swift compilation errors:
1. Make sure you're using Xcode 14+
2. Check that the Swift version in Build Settings is 5.0+
3. Verify bridging header path is correct

### Share Sheet still glitchy
This should not happen with the native module, but if it does:
1. Check that you're using the native module (look for logs)
2. Verify the module is calling from the correct view controller
3. Check for any other modal/window conflicts in your app

## Benefits Over React Native Share API

1. **Complete control over timing** - Waits for transitions before presenting
2. **Proper view controller hierarchy** - Always presents from root VC
3. **No React Native conflicts** - Bypasses RN window management
4. **Robust error handling** - Native iOS error handling
5. **iPad support** - Proper popover configuration

## Code Changes

The following files were modified to use the native module:
- `src/services/pdfExportService.ts` - Uses PDFShareManager instead of React Native Share
- `src/screens/StoryboardScreen.tsx` - Updated error handling

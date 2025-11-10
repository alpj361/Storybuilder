//DO NOT REMOVE THIS CODE
console.log("[index] Project ID is: ", process.env.EXPO_PUBLIC_VIBECODE_PROJECT_ID);
import "react-native-gesture-handler";
import "./global.css";
import "react-native-get-random-values";
import { Buffer } from "buffer";
// Ensure Buffer is available for packages expecting Node global
// without importing heavy shims elsewhere.
// @ts-ignore
if (typeof global !== "undefined" && !(global as any).Buffer) {
  // @ts-ignore
  (global as any).Buffer = Buffer;
}
import { LogBox } from "react-native";
LogBox.ignoreLogs(["Expo AV has been deprecated", "Disconnected from Metro"]);

import { registerRootComponent } from "expo";

import App from "./App";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

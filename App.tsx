import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import StoryboardScreen from "./src/screens/StoryboardScreen";
import MiniWorldsScreen from "./src/screens/MiniWorldsScreen";
// import ArchitecturalScreen from "./src/screens/ArchitecturalScreen"; // Comentado para uso futuro

// Keep the splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project. 
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

export default function App() {
  useEffect(() => {
    // Hide splash screen once app is ready
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: "#6366F1",
              tabBarInactiveTintColor: "#9CA3AF",
              tabBarStyle: {
                paddingBottom: 8,
                paddingTop: 8,
                height: 60,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '600',
              },
              tabBarIcon: ({ color, size }) => {
                let iconName: string;
                if (route.name === "Storyboard") {
                  iconName = "images-outline";
                } else if (route.name === "MiniWorlds") {
                  iconName = "cube-outline";
                } else {
                  iconName = "construct-outline";
                }
                return <Ionicons name={iconName as any} size={size} color={color} />;
              }
            })}
          >
            <Tab.Screen name="Storyboard" component={StoryboardScreen} />
            <Tab.Screen name="MiniWorlds" component={MiniWorldsScreen} />
            {/* <Tab.Screen name="Arquitectural" component={ArchitecturalScreen} /> */}
          </Tab.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/*
  Código de Tab Navigator guardado para uso futuro con Arquitectura:

  <NavigationContainer>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarIcon: ({ color, size }) => {
          let iconName: string;
          if (route.name === "Storyboard") {
            iconName = "images-outline";
          } else {
            iconName = "construct-outline";
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Storyboard" component={StoryboardScreen} />
      <Tab.Screen name="Arquitectural" component={ArchitecturalScreen} />
    </Tab.Navigator>
  </NavigationContainer>
*/

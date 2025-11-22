// 🔧 FIX: Disable native screen optimization BEFORE any navigation imports
import { enableScreens } from 'react-native-screens';
enableScreens(false);

// Now safe to import navigation
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StoryboardScreen from "./src/screens/StoryboardScreen";
import MiniWorldsScreen from "./src/screens/MiniWorldsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import MigrationModal from "./src/components/MigrationModal";
import { useAuthStore } from "./src/state/authStore";
import { useStoryboardStore } from "./src/state/storyboardStore";
import { cloudStorageService } from "./src/services/cloudStorageService";
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


function App() {
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkSession = useAuthStore((state) => state.checkSession);
  const user = useAuthStore((state) => state.user);
  const projects = useStoryboardStore((state) => state.projects);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Keep the splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();

        // Check if user has existing session (silent, no blocking)
        await checkSession();

        // Artificially delay for 500ms to ensure everything is loaded
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setIsNavigationReady(true);
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, []);

  // Show migration modal after successful login if user has local projects
  useEffect(() => {
    const checkMigrationStatus = async () => {
      if (isAuthenticated && user && !showMigrationModal) {
        // Download projects from cloud first
        console.log('[App] User authenticated, downloading cloud projects...');
        const cloudProjects = await cloudStorageService.downloadProjects(user.id);

        if (cloudProjects.length > 0) {
          console.log(`[App] Found ${cloudProjects.length} projects in cloud`);

          // Merge cloud projects with local projects
          const localProjects = projects;
          const localProjectIds = new Set(localProjects.map(p => p.id));

          // Add cloud projects that don't exist locally
          const newCloudProjects = cloudProjects.filter(cp => !localProjectIds.has(cp.id));

          if (newCloudProjects.length > 0) {
            console.log(`[App] Restoring ${newCloudProjects.length} projects from cloud`);
            // Add cloud projects to local store
            const setProjects = useStoryboardStore.getState().projects;
            useStoryboardStore.setState({
              projects: [...localProjects, ...newCloudProjects]
            });

            Alert.alert(
              'Projects Restored',
              `Successfully restored ${newCloudProjects.length} project(s) from cloud!`
            );
          }
        }

        // Check if we should show migration modal for local-only projects
        const hasShownMigration = await AsyncStorage.getItem(`migration-shown-${user.id}`);

        if (hasShownMigration !== 'true' && projects.length > 0) {
          setShowMigrationModal(true);
        }
      }
    };

    checkMigrationStatus();
  }, [isAuthenticated, user]);

  const handleMigration = async () => {
    if (!user) return;

    setIsMigrating(true);
    let successCount = 0;
    let errorCount = 0;

    for (const project of projects) {
      const result = await cloudStorageService.uploadProject(project, user.id);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setIsMigrating(false);
    setShowMigrationModal(false);

    // Mark that we've shown the migration modal for this user
    await AsyncStorage.setItem(`migration-shown-${user.id}`, 'true');

    if (errorCount === 0) {
      Alert.alert('Migration Complete', `Successfully synced ${successCount} project(s) to cloud!`);
    } else {
      Alert.alert(
        'Partial Migration',
        `Synced ${successCount} project(s). ${errorCount} failed. You can try again from the Profile tab.`
      );
    }
  };

  const handleSkipMigration = async () => {
    setShowMigrationModal(false);
    // Mark that we've shown the migration modal for this user
    if (user) {
      await AsyncStorage.setItem(`migration-shown-${user.id}`, 'true');
    }
  };

  if (!isNavigationReady) {
    return null;
  }

  console.log('[App] 🚀 About to render NavigationContainer and Tab.Navigator');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer onReady={() => console.log('[App] ✅ NavigationContainer ready')}>
          <Tab.Navigator
            initialRouteName="MiniWorlds"
            screenOptions={({ route }) => ({
              headerShown: false,
              unmountOnBlur: true, // Keep this for isolation
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
                } else if (route.name === "Profile") {
                  iconName = "person-outline";
                } else {
                  iconName = "construct-outline";
                }
                return <Ionicons name={iconName as any} size={size} color={color} />;
              }
            })}
          >
            <Tab.Screen name="Storyboard" component={StoryboardScreen} />
            <Tab.Screen name="MiniWorlds" component={MiniWorldsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
          </Tab.Navigator>
        </NavigationContainer>

        {/* Migration Modal - shows after login if user has local projects */}
        <MigrationModal
          visible={showMigrationModal}
          projectCount={projects.length}
          onMigrate={handleMigration}
          onSkip={handleSkipMigration}
          isLoading={isMigrating}
        />

        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;


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

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { useStoryboardStore } from '../state/storyboardStore';
import { cloudStorageService } from '../services/cloudStorageService';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';

export default function ProfileScreen() {
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const signOut = useAuthStore((state) => state.signOut);
    const projects = useStoryboardStore((state) => state.projects);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authView, setAuthView] = useState<'login' | 'signup'>('login');

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out? Your local projects will remain on this device.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                    },
                },
            ]
        );
    };

    const handleManualSync = async () => {
        if (!user) return;

        setIsSyncing(true);
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

        setIsSyncing(false);

        if (errorCount === 0) {
            Alert.alert('Success', `Synced ${successCount} project(s) to cloud`);
        } else {
            Alert.alert(
                'Partial Success',
                `Synced ${successCount} project(s). ${errorCount} failed.`
            );
        }
    };

    // Not authenticated view - show login/signup options
    if (!isAuthenticated) {
        return (
            <>
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 60 }}
                    >
                        {/* Welcome Card */}
                        <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 24, padding: 32, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
                            {/* Avatar/Icon */}
                            <View style={{ alignItems: 'center', marginBottom: 24 }}>
                                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <Ionicons name="cloud-outline" size={40} color="#6366F1" />
                                </View>
                                <Text style={{ fontSize: 24, fontWeight: '700', color: '#1F2937', textAlign: 'center' }}>
                                    Cloud Sync
                                </Text>
                                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' }}>
                                    Sign in to backup and sync your {projects.length} project{projects.length !== 1 ? 's' : ''} across devices
                                </Text>
                            </View>

                            {/* Sign In Button */}
                            <TouchableOpacity
                                onPress={() => {
                                    setAuthView('login');
                                    setShowAuthModal(true);
                                }}
                                style={{
                                    backgroundColor: '#6366F1',
                                    borderRadius: 12,
                                    padding: 16,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 12,
                                    shadowColor: '#6366F1',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                }}
                            >
                                <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginLeft: 8 }}>
                                    Sign In
                                </Text>
                            </TouchableOpacity>

                            {/* Create Account Button */}
                            <TouchableOpacity
                                onPress={() => {
                                    setAuthView('signup');
                                    setShowAuthModal(true);
                                }}
                                style={{
                                    backgroundColor: '#F3F4F6',
                                    borderRadius: 12,
                                    padding: 16,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ionicons name="person-add-outline" size={20} color="#6366F1" />
                                <Text style={{ color: '#6366F1', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
                                    Create Account
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Info Card */}
                        <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 16, padding: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <Ionicons name="information-circle" size={24} color="#6366F1" />
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginLeft: 8 }}>
                                    Why Sign In?
                                </Text>
                            </View>
                            <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
                                • Backup your creations to the cloud{'\n'}
                                • Access your projects from any device{'\n'}
                                • Never lose your work{'\n'}
                                • Continue working offline - sync when ready
                            </Text>
                        </View>
                    </ScrollView>
                </LinearGradient>

                {/* Auth Modal */}
                <Modal
                    visible={showAuthModal}
                    animationType="slide"
                    presentationStyle="fullScreen"
                >
                    {authView === 'login' ? (
                        <LoginScreen
                            onNavigateToSignup={() => setAuthView('signup')}
                            onClose={() => setShowAuthModal(false)}
                        />
                    ) : (
                        <SignupScreen
                            onNavigateToLogin={() => setAuthView('login')}
                            onClose={() => setShowAuthModal(false)}
                        />
                    )}
                </Modal>
            </>
        );
    }

    // Authenticated view - show profile and sync options
    return (
        <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 60 }}
            >
                {/* Profile Card */}
                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 24, padding: 32, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
                    {/* Avatar */}
                    <View style={{ alignItems: 'center', marginBottom: 24 }}>
                        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                            <Ionicons name="person" size={40} color="#FFFFFF" />
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937' }}>
                            {user?.email || 'User'}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                            {projects.length} project(s) created
                        </Text>
                    </View>

                    {/* Manual Sync Button */}
                    <TouchableOpacity
                        onPress={handleManualSync}
                        disabled={isSyncing}
                        style={{
                            backgroundColor: '#F3F4F6',
                            borderRadius: 12,
                            padding: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 12,
                        }}
                    >
                        {isSyncing ? (
                            <ActivityIndicator color="#6366F1" />
                        ) : (
                            <>
                                <Ionicons name="cloud-upload-outline" size={20} color="#6366F1" />
                                <Text style={{ color: '#6366F1', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
                                    Sync to Cloud
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Sign Out Button */}
                    <TouchableOpacity
                        onPress={handleSignOut}
                        style={{
                            backgroundColor: '#FEE2E2',
                            borderRadius: 12,
                            padding: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                        <Text style={{ color: '#DC2626', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
                            Sign Out
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Info Card */}
                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 16, padding: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Ionicons name="information-circle" size={24} color="#6366F1" />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginLeft: 8 }}>
                            Cloud Sync
                        </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
                        Your projects are automatically synced to the cloud when you're signed in. Use the "Sync to Cloud" button above to manually upload all local projects.
                    </Text>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

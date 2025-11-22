import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../state/authStore';

interface SignupScreenProps {
    onNavigateToLogin: () => void;
    onClose?: () => void;
}

export default function SignupScreen({ onNavigateToLogin, onClose }: SignupScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const signUp = useAuthStore((state) => state.signUp);

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSignup = async () => {
        // Validation
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (!validateEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setIsLoading(true);
        const result = await signUp(email, password);
        setIsLoading(false);

        console.log('[SignupScreen] Signup result:', result);

        if (result.success) {
            if (result.error) {
                // Email confirmation required case
                Alert.alert(
                    'Account Created',
                    result.error,
                    [{ text: 'OK', onPress: onNavigateToLogin }]
                );
            } else {
                // Auto-login case
                Alert.alert('Success', 'Account created! You are now signed in.');
            }
        } else {
            console.error('[SignupScreen] Signup error:', result.error);
            Alert.alert('Signup Failed', result.error || 'Please try again');
        }
    };

    return (
        <LinearGradient
            colors={['#8B5CF6', '#A855F7', '#C084FC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 24, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16 }}>
                        {/* Title */}
                        <Text style={{ fontSize: 32, fontWeight: '700', color: '#1F2937', marginBottom: 8, textAlign: 'center' }}>
                            Create Account
                        </Text>
                        <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 32, textAlign: 'center' }}>
                            Start syncing your creations to the cloud
                        </Text>

                        {/* Email Input */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                                Email
                            </Text>
                            <TextInput
                                style={{
                                    backgroundColor: '#F9FAFB',
                                    borderWidth: 1,
                                    borderColor: '#E5E7EB',
                                    borderRadius: 12,
                                    padding: 16,
                                    fontSize: 16,
                                    color: '#1F2937',
                                }}
                                placeholder="your@email.com"
                                placeholderTextColor="#9CA3AF"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                            />
                        </View>

                        {/* Password Input */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                                Password
                            </Text>
                            <TextInput
                                style={{
                                    backgroundColor: '#F9FAFB',
                                    borderWidth: 1,
                                    borderColor: '#E5E7EB',
                                    borderRadius: 12,
                                    padding: 16,
                                    fontSize: 16,
                                    color: '#1F2937',
                                }}
                                placeholder="At least 6 characters"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoComplete="off"
                                textContentType="none"
                            />
                        </View>

                        {/* Confirm Password Input */}
                        <View style={{ marginBottom: 24 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                                Confirm Password
                            </Text>
                            <TextInput
                                style={{
                                    backgroundColor: '#F9FAFB',
                                    borderWidth: 1,
                                    borderColor: '#E5E7EB',
                                    borderRadius: 12,
                                    padding: 16,
                                    fontSize: 16,
                                    color: '#1F2937',
                                }}
                                placeholder="Re-enter password"
                                placeholderTextColor="#9CA3AF"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                autoComplete="off"
                                textContentType="none"
                            />
                        </View>

                        {/* Sign Up Button */}
                        <TouchableOpacity
                            onPress={handleSignup}
                            disabled={isLoading}
                            style={{
                                backgroundColor: '#8B5CF6',
                                borderRadius: 12,
                                padding: 16,
                                alignItems: 'center',
                                marginBottom: 16,
                                shadowColor: '#8B5CF6',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                            }}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                                    Create Account
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: '#6B7280', fontSize: 14 }}>
                                Already have an account?{' '}
                            </Text>
                            <TouchableOpacity onPress={onNavigateToLogin}>
                                <Text style={{ color: '#8B5CF6', fontSize: 14, fontWeight: '600' }}>
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

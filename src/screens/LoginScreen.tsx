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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../state/authStore';

interface LoginScreenProps {
    onNavigateToSignup: () => void;
    onClose?: () => void;
}

export default function LoginScreen({ onNavigateToSignup, onClose }: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const signIn = useAuthStore((state) => state.signIn);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setIsLoading(true);
        const result = await signIn(email, password);
        setIsLoading(false);

        if (!result.success) {
            Alert.alert('Login Failed', result.error || 'Please check your credentials');
        }
    };

    return (
        <LinearGradient
            colors={['#6366F1', '#8B5CF6', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, justifyContent: 'center', padding: 24 }}
            >
                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 24, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16 }}>
                    {/* Title */}
                    <Text style={{ fontSize: 32, fontWeight: '700', color: '#1F2937', marginBottom: 8, textAlign: 'center' }}>
                        Welcome Back
                    </Text>
                    <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 32, textAlign: 'center' }}>
                        Sign in to sync your creations
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
                    <View style={{ marginBottom: 24 }}>
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
                            placeholder="••••••••"
                            placeholderTextColor="#9CA3AF"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoComplete="password"
                        />
                    </View>

                    {/* Sign In Button */}
                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={isLoading}
                        style={{
                            backgroundColor: '#6366F1',
                            borderRadius: 12,
                            padding: 16,
                            alignItems: 'center',
                            marginBottom: 16,
                            shadowColor: '#6366F1',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                        }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                                Sign In
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Sign Up Link */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#6B7280', fontSize: 14 }}>
                            Don't have an account?{' '}
                        </Text>
                        <TouchableOpacity onPress={onNavigateToSignup}>
                            <Text style={{ color: '#6366F1', fontSize: 14, fontWeight: '600' }}>
                                Sign Up
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

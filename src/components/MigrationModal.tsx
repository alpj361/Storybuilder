import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface MigrationModalProps {
    visible: boolean;
    projectCount: number;
    onMigrate: () => void;
    onSkip: () => void;
    isLoading?: boolean;
}

export default function MigrationModal({
    visible,
    projectCount,
    onMigrate,
    onSkip,
    isLoading = false,
}: MigrationModalProps) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent
        >
            <BlurView intensity={50} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                <View style={{ width: '85%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 }}>
                    {/* Icon */}
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="cloud-upload" size={32} color="#6366F1" />
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={{ fontSize: 24, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 12 }}>
                        Migrate to Cloud?
                    </Text>

                    {/* Description */}
                    <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
                        You have <Text style={{ fontWeight: '700', color: '#6366F1' }}>{projectCount} local project{projectCount !== 1 ? 's' : ''}</Text>.
                        Would you like to sync them to the cloud for backup and access across devices?
                    </Text>

                    {/* Buttons */}
                    <TouchableOpacity
                        onPress={onMigrate}
                        disabled={isLoading}
                        style={{
                            backgroundColor: '#6366F1',
                            borderRadius: 12,
                            padding: 16,
                            alignItems: 'center',
                            marginBottom: 12,
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
                                Yes, Migrate to Cloud
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onSkip}
                        disabled={isLoading}
                        style={{
                            backgroundColor: '#F3F4F6',
                            borderRadius: 12,
                            padding: 16,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ color: '#6B7280', fontSize: 16, fontWeight: '600' }}>
                            Skip for Now
                        </Text>
                    </TouchableOpacity>
                </View>
            </BlurView>
        </Modal>
    );
}

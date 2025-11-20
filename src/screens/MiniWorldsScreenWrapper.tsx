import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MiniWorldsScreen from './MiniWorldsScreen';

/**
 * Wrapper component that ensures navigation context is available
 * before rendering the actual MiniWorldsScreen
 */
export default function MiniWorldsScreenWrapper() {
    const [isNavigationReady, setIsNavigationReady] = useState(false);

    // Try to access navigation - will only work if context is available
    try {
        const navigation = useNavigation();

        useEffect(() => {
            if (navigation) {
                setIsNavigationReady(true);
            }
        }, [navigation]);
    } catch (error) {
        console.log('[MiniWorldsScreenWrapper] Navigation context not ready yet');
    }

    if (!isNavigationReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={{ marginTop: 16, color: '#6b7280' }}>Loading MiniWorlds...</Text>
            </View>
        );
    }

    return <MiniWorldsScreen />;
}

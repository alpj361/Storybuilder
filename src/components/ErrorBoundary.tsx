import React, { Component, ReactNode } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('='.repeat(80));
    console.error('ERROR BOUNDARY CAUGHT ERROR:');
    console.error('='.repeat(80));
    console.error('Error:', error);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('='.repeat(80));

    this.setState({
      error,
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={{ flex: 1, padding: 20, backgroundColor: '#fee' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#c00', marginBottom: 10 }}>
            Error Caught!
          </Text>
          <ScrollView style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
              {this.state.error?.toString()}
            </Text>
            <Text style={{ fontFamily: 'monospace', fontSize: 10, marginTop: 10 }}>
              {this.state.error?.stack}
            </Text>
            <Text style={{ fontFamily: 'monospace', fontSize: 10, marginTop: 10 }}>
              {this.state.errorInfo?.componentStack}
            </Text>
          </ScrollView>
          <Pressable
            onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{ padding: 10, backgroundColor: '#c00', marginTop: 10, borderRadius: 5 }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
              Try Again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

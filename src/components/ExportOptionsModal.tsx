import React, { useState } from "react";
import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ExportOptionsModalProps, PDFLayout, ExportOptions } from "../types/export";

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ExportOptionsModal({
  visible,
  onClose,
  project,
  onExport
}: ExportOptionsModalProps) {
  const [selectedLayout, setSelectedLayout] = useState<PDFLayout>(PDFLayout.SINGLE);
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    const options: ExportOptions = {
      layout: selectedLayout,
      includeMetadata
    };

    // Close modal immediately and start export
    onClose();

    // Give UI time to update before starting heavy operation
    setTimeout(async () => {
      try {
        await onExport(options);
      } catch (error) {
        console.error('[ExportOptionsModal] Export failed:', error);
        // Error will be handled by parent component
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
    }
  };

  // Count panels with images
  const panelsWithImages = project.panels.filter(p => p.generatedImageUrl).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: SCREEN_HEIGHT * 0.9 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">Export to PDF</Text>
              <Text className="text-sm text-gray-500 mt-1">
                {panelsWithImages} panel{panelsWithImages !== 1 ? 's' : ''} with images
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              disabled={isExporting}
              className="p-2 rounded-full active:bg-gray-100"
              style={{ minHeight: 40, minWidth: 40 }}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-6 py-4">
            {/* Layout Selection */}
            <View className="mb-6">
              <Text className="text-base font-bold text-gray-900 mb-3">Page Layout</Text>
              <Text className="text-sm text-gray-600 mb-4">
                Choose how many panels to display per page
              </Text>

              {/* Single Layout Option */}
              <Pressable
                onPress={() => setSelectedLayout(PDFLayout.SINGLE)}
                disabled={isExporting}
                className={`mb-3 p-4 rounded-xl border-2 ${
                  selectedLayout === PDFLayout.SINGLE
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-white border-gray-300'
                }`}
                style={{ minHeight: 80 }}
              >
                <View className="flex-row items-center">
                  <View className="mr-3">
                    <Ionicons
                      name={selectedLayout === PDFLayout.SINGLE ? 'radio-button-on' : 'radio-button-off'}
                      size={24}
                      color={selectedLayout === PDFLayout.SINGLE ? '#3b82f6' : '#9ca3af'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-base font-bold mb-1 ${
                      selectedLayout === PDFLayout.SINGLE ? 'text-blue-900' : 'text-gray-700'
                    }`}>
                      Single Panel
                    </Text>
                    <Text className={`text-sm ${
                      selectedLayout === PDFLayout.SINGLE ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      1 panel per page - Largest images, best for detail
                    </Text>
                  </View>
                  <View className="ml-2 p-2 bg-gray-100 rounded">
                    <Ionicons name="square-outline" size={20} color="#6b7280" />
                  </View>
                </View>
              </Pressable>

              {/* Double Layout Option */}
              <Pressable
                onPress={() => setSelectedLayout(PDFLayout.DOUBLE)}
                disabled={isExporting}
                className={`mb-3 p-4 rounded-xl border-2 ${
                  selectedLayout === PDFLayout.DOUBLE
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-white border-gray-300'
                }`}
                style={{ minHeight: 80 }}
              >
                <View className="flex-row items-center">
                  <View className="mr-3">
                    <Ionicons
                      name={selectedLayout === PDFLayout.DOUBLE ? 'radio-button-on' : 'radio-button-off'}
                      size={24}
                      color={selectedLayout === PDFLayout.DOUBLE ? '#3b82f6' : '#9ca3af'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-base font-bold mb-1 ${
                      selectedLayout === PDFLayout.DOUBLE ? 'text-blue-900' : 'text-gray-700'
                    }`}>
                      Double Panel
                    </Text>
                    <Text className={`text-sm ${
                      selectedLayout === PDFLayout.DOUBLE ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      2 panels per page - Good balance
                    </Text>
                  </View>
                  <View className="ml-2 flex-row" style={{ gap: 4 }}>
                    <View className="p-1.5 bg-gray-100 rounded">
                      <Ionicons name="square-outline" size={16} color="#6b7280" />
                    </View>
                    <View className="p-1.5 bg-gray-100 rounded">
                      <Ionicons name="square-outline" size={16} color="#6b7280" />
                    </View>
                  </View>
                </View>
              </Pressable>

              {/* Quad Layout Option */}
              <Pressable
                onPress={() => setSelectedLayout(PDFLayout.QUAD)}
                disabled={isExporting}
                className={`mb-3 p-4 rounded-xl border-2 ${
                  selectedLayout === PDFLayout.QUAD
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-white border-gray-300'
                }`}
                style={{ minHeight: 80 }}
              >
                <View className="flex-row items-center">
                  <View className="mr-3">
                    <Ionicons
                      name={selectedLayout === PDFLayout.QUAD ? 'radio-button-on' : 'radio-button-off'}
                      size={24}
                      color={selectedLayout === PDFLayout.QUAD ? '#3b82f6' : '#9ca3af'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-base font-bold mb-1 ${
                      selectedLayout === PDFLayout.QUAD ? 'text-blue-900' : 'text-gray-700'
                    }`}>
                      Quad Panel (Comic Style)
                    </Text>
                    <Text className={`text-sm ${
                      selectedLayout === PDFLayout.QUAD ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      4 panels per page (2x2 grid) - Compact, comic book style
                    </Text>
                  </View>
                  <View className="ml-2">
                    <View className="flex-row mb-1" style={{ gap: 2 }}>
                      <View className="p-1 bg-gray-100 rounded">
                        <Ionicons name="square-outline" size={12} color="#6b7280" />
                      </View>
                      <View className="p-1 bg-gray-100 rounded">
                        <Ionicons name="square-outline" size={12} color="#6b7280" />
                      </View>
                    </View>
                    <View className="flex-row" style={{ gap: 2 }}>
                      <View className="p-1 bg-gray-100 rounded">
                        <Ionicons name="square-outline" size={12} color="#6b7280" />
                      </View>
                      <View className="p-1 bg-gray-100 rounded">
                        <Ionicons name="square-outline" size={12} color="#6b7280" />
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            </View>

            {/* Metadata Toggle */}
            <View className="mb-6">
              <Text className="text-base font-bold text-gray-900 mb-3">Content Options</Text>

              <Pressable
                onPress={() => setIncludeMetadata(!includeMetadata)}
                disabled={isExporting}
                className={`p-4 rounded-xl border-2 ${
                  includeMetadata ? 'bg-purple-50 border-purple-500' : 'bg-white border-gray-300'
                }`}
                style={{ minHeight: 70 }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <Text className={`text-base font-bold mb-1 ${
                      includeMetadata ? 'text-purple-900' : 'text-gray-700'
                    }`}>
                      Include Metadata
                    </Text>
                    <Text className={`text-sm ${
                      includeMetadata ? 'text-purple-700' : 'text-gray-500'
                    }`}>
                      Project info, panel descriptions, and characters
                    </Text>
                  </View>
                  <View className={`w-12 h-7 rounded-full justify-center ${
                    includeMetadata ? 'bg-purple-500' : 'bg-gray-300'
                  }`}>
                    <View className={`w-5 h-5 bg-white rounded-full shadow ${
                      includeMetadata ? 'self-end mr-1' : 'self-start ml-1'
                    }`} />
                  </View>
                </View>
              </Pressable>

              {!includeMetadata && (
                <View className="mt-3 flex-row items-start p-3 bg-gray-50 rounded-lg">
                  <Ionicons name="information-circle" size={20} color="#6b7280" style={{ marginRight: 8, marginTop: 2 }} />
                  <Text className="text-sm text-gray-600 flex-1">
                    Without metadata, the PDF will contain only panel images - pure comic style
                  </Text>
                </View>
              )}
            </View>

            {/* Info Box */}
            <View className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <View className="flex-row items-center mb-2">
                <Ionicons name="document-text" size={20} color="#3b82f6" />
                <Text className="text-sm font-bold text-blue-900 ml-2">Export Summary</Text>
              </View>
              <Text className="text-sm text-blue-700">
                • {panelsWithImages} panels will be exported{'\n'}
                • Layout: {selectedLayout === PDFLayout.SINGLE ? '1 panel per page' : selectedLayout === PDFLayout.DOUBLE ? '2 panels per page' : '4 panels per page'}{'\n'}
                • Metadata: {includeMetadata ? 'Included' : 'Not included'}
              </Text>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View className="px-6 py-4 border-t border-gray-200">
            <View className="flex-row" style={{ gap: 12 }}>
              <Pressable
                onPress={handleClose}
                disabled={isExporting}
                className={`flex-1 py-3 rounded-lg ${
                  isExporting ? 'bg-gray-100' : 'bg-gray-200'
                }`}
                style={{ minHeight: 48 }}
              >
                <Text className={`text-center font-bold text-base ${
                  isExporting ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleExport}
                disabled={isExporting || panelsWithImages === 0}
                className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${
                  isExporting || panelsWithImages === 0 ? 'bg-gray-300' : 'bg-blue-600'
                }`}
                style={{ minHeight: 48 }}
              >
                {isExporting ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text className="text-white font-bold text-base ml-2">Exporting...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="download" size={20} color="#FFFFFF" />
                    <Text className="text-white font-bold text-base ml-2">Export PDF</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

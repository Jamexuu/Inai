import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { pdfExportService, ReportType } from '@/services/pdf-export.service';
import { PrimaryButton } from './ui/primary-button';
import { ConfirmationDialog } from './ui/confirmation-dialog';
import { ScalePressable } from './ui/scale-pressable';
import { useTheme } from '@/hooks/use-theme';

interface ExportReportModalProps {
  visible: boolean;
  onClose: () => void;
  initialType?: ReportType;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  visible,
  onClose,
  initialType = 'all',
}) => {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<ReportType>(initialType);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const reportOptions: Array<{
    type: ReportType;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
  }> = [
    {
      type: 'all',
      title: 'Complete Health Report',
      description: 'Blood sugar, blood pressure, and medicine adherence in one unified PDF document.',
      icon: 'document-text',
      iconColor: '#3D5A50',
    },
    {
      type: 'sugar',
      title: 'Blood Sugar Report',
      description: 'Glucose levels, measurement contexts, and weekly/monthly trends for your doctor.',
      icon: 'water',
      iconColor: '#C46849',
    },
    {
      type: 'bp',
      title: 'Blood Pressure Report',
      description: 'Systolic, diastolic, and pulse readings with clinical categories and averages.',
      icon: 'heart',
      iconColor: '#3D5A50',
    },
    {
      type: 'medicines',
      title: 'Medicine Intake Report',
      description: 'Complete log of taken, skipped, and scheduled prescription doses.',
      icon: 'medkit',
      iconColor: '#2E684D',
    },
  ];

  const handleExportShare = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      await pdfExportService.exportReport({
        reportType: selectedType,
        patientName: 'Mom',
      });
      onClose();
    } catch (err) {
      console.error('Export error:', err);
      setExportError("We couldn't generate the PDF file. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        {/* Tap outside backdrop to close */}
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss modal backdrop"
        />

        {/* Bottom sheet wrapped with SafeAreaView to clear the mobile navbar */}
        <SafeAreaView
          edges={['bottom']}
          style={{
            backgroundColor: colors.backgroundCard,
            paddingBottom: insets.bottom === 0 ? 16 : 0,
          }}
          className="rounded-t-3xl border-t-[1.5px] border-x-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark max-h-[92%]">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="p-5 pb-4 gap-4"
            bounces={false}>
            {/* Header */}
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-2">
                <Text className="text-xl font-bold text-charcoal dark:text-charcoal-dark">
                  Export Health Log to PDF
                </Text>
                <Text className="text-sm font-medium text-umber dark:text-umber-dark mt-0.5">
                  Generate a clean, printable PDF report for your doctor or caregiver.
                </Text>
              </View>
              <ScalePressable
                onPress={onClose}
                scaleTo={0.9}
                className="min-w-[44px] min-h-[44px] items-center justify-center -mr-1.5 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel="Close export modal">
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </ScalePressable>
            </View>

            {/* Report Type Options */}
            <View className="gap-2.5">
              {reportOptions.map((opt) => {
                const isSelected = selectedType === opt.type;
                return (
                  <ScalePressable
                    key={opt.type}
                    onPress={() => setSelectedType(opt.type)}
                    scaleTo={0.96}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${opt.title}`}
                    className={`min-h-[58px] p-3.5 rounded-2xl border-[1.5px] flex-row items-center gap-3 active:opacity-85 ${
                      isSelected
                        ? 'border-sage dark:border-sage-dark bg-sage-tint dark:bg-sage-dark-tint'
                        : 'border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark'
                    }`}>
                    <View className="w-10 h-10 rounded-xl bg-card dark:bg-card-dark border border-subtle-border dark:border-subtle-border-dark items-center justify-center">
                      <Ionicons name={opt.icon} size={20} color={opt.iconColor} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark">
                        {opt.title}
                      </Text>
                      <Text className="text-xs font-semibold text-umber dark:text-umber-dark leading-4 mt-0.5">
                        {opt.description}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                  </ScalePressable>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View className="gap-2.5 pt-1">
              <PrimaryButton
                label={isExporting ? 'Generating PDF...' : 'Share / Save PDF File'}
                icon={
                  isExporting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                  )
                }
                variant="primary"
                disabled={isExporting}
                onPress={handleExportShare}
                className="min-h-[52px]"
              />

              <PrimaryButton
                label="Cancel"
                variant="outline"
                disabled={isExporting}
                onPress={onClose}
                className="min-h-[46px]"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* Simple Alert Dialog for Export Errors */}
      <ConfirmationDialog
        visible={!!exportError}
        title="Export failed"
        message={exportError || "Couldn't create the PDF report. Please try again."}
        confirmLabel="OK"
        cancelLabel="Close"
        variant="warning"
        onConfirm={() => setExportError(null)}
        onCancel={() => setExportError(null)}
      />
    </Modal>
  );
};

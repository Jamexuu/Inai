import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { PrimaryButton } from './primary-button';

export interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isSubmitting?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Simple Confirmation Dialog
 * Clean, lightweight, left-aligned typography without icons.
 * Centered non-fluid action buttons with comfortable spacing.
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'danger',
  isSubmitting = false,
  onConfirm,
  onCancel,
}) => {
  const colors = useTheme();

  const buttonVariant: 'danger' | 'secondary' | 'primary' =
    variant === 'warning' ? 'secondary' : variant === 'primary' ? 'primary' : 'danger';

  const resolvedConfirmLabel =
    confirmLabel ?? (variant === 'danger' ? 'Delete' : variant === 'warning' ? 'Skip All' : 'Confirm');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => {
        if (!isSubmitting) onCancel();
      }}>
      <View className="flex-1 bg-black/60 items-center justify-center p-5">
        <Pressable
          className="absolute inset-0"
          onPress={() => {
            if (!isSubmitting) onCancel();
          }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss confirmation dialog"
        />

        <View
          style={{ backgroundColor: colors.backgroundCard }}
          className="w-full max-w-[348px] rounded-3xl border border-subtle-border dark:border-subtle-border-dark p-6 shadow-xl">
          {/* Main Container of the Message with generous vertical separation */}
          <View style={{ marginBottom: 26 }}>
            <Text className="text-[22px] font-bold text-left text-charcoal dark:text-charcoal-dark tracking-tight">
              {title}
            </Text>

            <Text className="text-[14px] font-medium leading-[22px] text-left text-umber dark:text-umber-dark mt-2.5">
              {message}
            </Text>
          </View>

          {/* Action Buttons - Equal width spanning the card row */}
          <View className="flex-row items-center gap-3 w-full">
            <PrimaryButton
              label={cancelLabel}
              variant="outline"
              disabled={isSubmitting}
              onPress={onCancel}
              className="flex-1"
              numberOfLines={1}
            />

            <PrimaryButton
              label={resolvedConfirmLabel}
              variant={buttonVariant}
              disabled={isSubmitting}
              onPress={onConfirm}
              className="flex-1"
              numberOfLines={1}
              icon={isSubmitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

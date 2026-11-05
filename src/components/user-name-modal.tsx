import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton, ScalePressable } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

interface UserNameModalProps {
  visible: boolean;
  initialName?: string;
  canDismiss?: boolean;
  onSave: (name: string) => void | Promise<void>;
  onClose?: () => void;
}

const QUICK_SUGGESTIONS = ['Mom', 'Mama', 'Nanay', 'Papa', 'Dad'];

export const UserNameModal: React.FC<UserNameModalProps> = ({
  visible,
  initialName = '',
  canDismiss = false,
  onSave,
  onClose,
}) => {
  const colors = useTheme();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setError(null);
    }
  }, [visible, initialName]);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required. Please enter what Inai should call you.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(trimmed);
    } catch {
      setError("We couldn't save your name. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectChip = (chip: string) => {
    setName(chip);
    setError(null);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      accessibilityViewIsModal={true}
      statusBarTranslucent={true}
      onRequestClose={canDismiss ? onClose : undefined}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/65 justify-center items-center px-4 py-8">
        {canDismiss && (
          <Pressable
            className="absolute inset-0"
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Dismiss modal backdrop"
          />
        )}

        <View className="w-full max-w-[420px] bg-card dark:bg-card-dark rounded-3xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark p-6 gap-5 shadow-lg">
          {/* Top header with close button if dismissible */}
          <View className="flex-row items-center justify-between">
            <View className="w-12 h-12 rounded-2xl bg-sage-tint dark:bg-sage-dark-tint border border-sage/30 items-center justify-center">
              <Ionicons name="heart" size={24} color={colors.primary} />
            </View>

            {canDismiss && (
              <ScalePressable
                onPress={onClose}
                scaleTo={0.9}
                className="w-10 h-10 rounded-full items-center justify-center bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark"
                accessibilityRole="button"
                accessibilityLabel="Close modal">
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </ScalePressable>
            )}
          </View>

          {/* Title & Description */}
          <View className="gap-1.5">
            <Text className="text-[22px] font-bold text-charcoal dark:text-charcoal-dark leading-[28px]">
              {canDismiss ? 'Update Your Name' : 'Welcome to Inai'}
            </Text>
            <Text className="text-[15px] font-medium text-umber dark:text-umber-dark leading-[22px]">
              What should Inai call you? We’ll use this for your daily routines, reminders, and health logs.
            </Text>
          </View>

          {/* Name Input */}
          <View className="gap-2">
            <Text className="text-xs font-bold uppercase tracking-wider text-umber dark:text-umber-dark">
              Your Name or Title
            </Text>
            <TextInput
              className="min-h-[52px] rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-4 text-[17px] text-charcoal dark:text-charcoal-dark font-medium"
              placeholder="e.g. Mom, Maria, Eleanor"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError(null);
              }}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              accessibilityLabel="Enter your name or preferred title"
            />
            {error && (
              <Text className="text-xs font-semibold text-terracotta dark:text-terracotta-dark">
                {error}
              </Text>
            )}
          </View>

          {/* Quick Suggestions Chips */}
          <View className="gap-2">
            <Text className="text-xs font-semibold text-umber dark:text-umber-dark">
              Quick suggestions:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="flex-row items-center gap-2">
              {QUICK_SUGGESTIONS.map((chip) => {
                const isSelected = name.trim().toLowerCase() === chip.toLowerCase();
                return (
                  <ScalePressable
                    key={chip}
                    onPress={() => handleSelectChip(chip)}
                    scaleTo={0.94}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full border items-center justify-center ${
                      isSelected
                        ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                        : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark'
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${chip}`}>
                    <Text
                      className={`text-sm font-bold ${
                        isSelected
                          ? 'text-white'
                          : 'text-charcoal dark:text-charcoal-dark'
                      }`}>
                      {chip}
                    </Text>
                  </ScalePressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Action Button */}
          <View className="pt-2">
            <PrimaryButton
              label={
                isSubmitting
                  ? 'Saving...'
                  : canDismiss
                  ? 'Save Name'
                  : 'Get Started'
              }
              variant="primary"
              onPress={handleSubmit}
              disabled={isSubmitting || !name.trim()}
              className="min-h-[50px]"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

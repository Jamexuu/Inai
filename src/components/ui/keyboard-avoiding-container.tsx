import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';

interface KeyboardAvoidingContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  keyboardVerticalOffset?: number;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  className?: string;
  contentContainerClassName?: string;
}

/**
 * Universal Keyboard Avoiding Container for screens, forms, and modals.
 * Provides comfortable accessibility and ensures input fields are never covered by the keyboard.
 */
export const KeyboardAvoidingContainer: React.FC<KeyboardAvoidingContainerProps> = ({
  children,
  scrollable = true,
  keyboardVerticalOffset,
  containerStyle,
  contentStyle,
  className,
  contentContainerClassName,
  ...scrollViewProps
}) => {
  const behavior = Platform.OS === 'ios' ? 'padding' : 'height';
  const defaultOffset = Platform.OS === 'ios' ? 0 : 20;
  const offset = keyboardVerticalOffset ?? defaultOffset;

  if (!scrollable) {
    return (
      <KeyboardAvoidingView
        behavior={behavior}
        keyboardVerticalOffset={offset}
        style={containerStyle}
        className={className ?? 'flex-1'}>
        <View style={contentStyle}>{children}</View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={behavior}
      keyboardVerticalOffset={offset}
      style={containerStyle}
      className={className ?? 'flex-1'}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentStyle}
        contentContainerClassName={contentContainerClassName}
        {...scrollViewProps}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';

interface PaginationControlsProps {
  currentPage: number; // 1-indexed
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}) => {
  const colors = useTheme();

  if (totalItems <= pageSize || totalPages <= 1) {
    return (
      <View className={`items-center py-2 ${className}`}>
        <Text className="text-xs font-semibold text-umber dark:text-umber-dark">
          Showing all {totalItems} {totalItems === 1 ? 'record' : 'records'}
        </Text>
      </View>
    );
  }

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Generate page pills if total pages is small (<= 5)
  const showPills = totalPages <= 5;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <View className={`gap-2 pt-2 pb-3 ${className}`}>
      {/* Navigation Buttons Row */}
      <View className="flex-row items-center justify-between gap-2">
        {/* Previous Button */}
        <Pressable
          disabled={!canGoPrev}
          onPress={() => onPageChange(currentPage - 1)}
          className={`min-h-[44px] px-3.5 rounded-xl border flex-row items-center gap-1.5 active:opacity-75 ${
            canGoPrev
              ? 'bg-card dark:bg-card-dark border-subtle-border dark:border-subtle-border-dark'
              : 'bg-surface dark:bg-surface-dark border-transparent opacity-40'
          }`}
          accessibilityRole="button"
          accessibilityLabel="Go to previous page"
          accessibilityState={{ disabled: !canGoPrev }}>
          <Ionicons
            name="chevron-back"
            size={18}
            color={canGoPrev ? colors.primary : colors.textMuted}
          />
          <Text
            className={`text-sm font-bold ${
              canGoPrev ? 'text-charcoal dark:text-charcoal-dark' : 'text-muted-gray dark:text-muted-gray-dark'
            }`}>
            Prev
          </Text>
        </Pressable>

        {/* Page pills or simple summary */}
        {showPills ? (
          <View className="flex-row items-center gap-1.5">
            {pageNumbers.map((p) => {
              const isActive = p === currentPage;
              return (
                <Pressable
                  key={p}
                  onPress={() => onPageChange(p)}
                  className={`min-w-[40px] min-h-[40px] rounded-xl border items-center justify-center active:opacity-80 ${
                    isActive
                      ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                      : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark'
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={`Page ${p}`}
                  accessibilityState={{ selected: isActive }}>
                  <Text
                    className={`text-sm font-bold ${
                      isActive ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                    }`}>
                    {p}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View className="items-center">
            <Text className="text-sm font-bold text-charcoal dark:text-charcoal-dark">
              Page {currentPage} of {totalPages}
            </Text>
          </View>
        )}

        {/* Next Button */}
        <Pressable
          disabled={!canGoNext}
          onPress={() => onPageChange(currentPage + 1)}
          className={`min-h-[44px] px-3.5 rounded-xl border flex-row items-center gap-1.5 active:opacity-75 ${
            canGoNext
              ? 'bg-card dark:bg-card-dark border-subtle-border dark:border-subtle-border-dark'
              : 'bg-surface dark:bg-surface-dark border-transparent opacity-40'
          }`}
          accessibilityRole="button"
          accessibilityLabel="Go to next page"
          accessibilityState={{ disabled: !canGoNext }}>
          <Text
            className={`text-sm font-bold ${
              canGoNext ? 'text-charcoal dark:text-charcoal-dark' : 'text-muted-gray dark:text-muted-gray-dark'
            }`}>
            Next
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={canGoNext ? colors.primary : colors.textMuted}
          />
        </Pressable>
      </View>

      {/* Item Range Summary */}
      <Text className="text-center text-xs font-semibold text-umber dark:text-umber-dark">
        Showing {startIndex}–{endIndex} of {totalItems} records
      </Text>
    </View>
  );
};


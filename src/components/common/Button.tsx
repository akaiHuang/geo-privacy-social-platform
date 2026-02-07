import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../utils/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...styles[`button_${size}`],
    };

    if (disabled || loading) {
      return { ...baseStyle, ...styles.button_disabled };
    }

    switch (variant) {
      case 'primary':
        return { ...baseStyle, backgroundColor: COLORS.primary };
      case 'secondary':
        return { ...baseStyle, backgroundColor: COLORS.secondary };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: COLORS.primary,
        };
      case 'text':
        return { ...baseStyle, backgroundColor: 'transparent' };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...styles.text,
      ...styles[`text_${size}`],
    };

    if (variant === 'outline' || variant === 'text') {
      return { ...baseStyle, color: COLORS.primary };
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : '#fff'} />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  button_small: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  button_medium: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  button_large: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  button_disabled: {
    backgroundColor: COLORS.tertiaryBackground,
    opacity: 0.6,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
  text_small: {
    fontSize: FONT_SIZE.sm,
  },
  text_medium: {
    fontSize: FONT_SIZE.md,
  },
  text_large: {
    fontSize: FONT_SIZE.lg,
  },
});

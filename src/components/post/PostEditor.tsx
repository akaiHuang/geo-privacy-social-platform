import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, POST_CONFIG } from '../../utils/constants';

interface PostEditorProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
}

export const PostEditor: React.FC<PostEditorProps> = ({
  initialContent = '',
  onContentChange,
  placeholder = '分享你的想法...',
}) => {
  const [content, setContent] = useState(initialContent);

  const handleChange = (text: string) => {
    if (text.length <= POST_CONFIG.maxContentLength) {
      setContent(text);
      onContentChange(text);
    }
  };

  const remainingChars = POST_CONFIG.maxContentLength - content.length;
  const isNearLimit = remainingChars < 100;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={content}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholderText}
        multiline
        textAlignVertical="top"
        maxLength={POST_CONFIG.maxContentLength}
      />
      
      {isNearLimit && (
        <View style={styles.footer}>
          <Text
            style={[
              styles.counter,
              remainingChars < 0 && styles.counterError,
            ]}
          >
            {remainingChars}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
  input: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    minHeight: 120,
    padding: SPACING.md,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  footer: {
    alignItems: 'flex-end',
    paddingTop: SPACING.xs,
  },
  counter: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.secondaryText,
  },
  counterError: {
    color: COLORS.danger,
  },
});

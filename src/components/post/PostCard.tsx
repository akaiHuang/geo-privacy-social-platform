import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Post } from '../../types';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../utils/constants';
import { formatRelativeTime, formatCount } from '../../utils/validators';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onUserPress?: () => void;
}

const { width } = Dimensions.get('window');

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onLike,
  onComment,
  onUserPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* 用戶信息 */}
      <TouchableOpacity
        style={styles.header}
        onPress={onUserPress}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: post.user.avatar || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{post.user.displayName}</Text>
          <View style={styles.meta}>
            <Text style={styles.time}>
              {formatRelativeTime(new Date(post.createdAt))}
            </Text>
            {post.location.address && (
              <>
                <Text style={styles.dot}> • </Text>
                <Text style={styles.location}>📍 {post.location.address}</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* 內容 */}
      {post.content && (
        <Text style={styles.content} numberOfLines={5}>
          {post.content}
        </Text>
      )}

      {/* 媒體 */}
      {post.media.length > 0 && (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: post.media[0].uri }}
            style={styles.media}
            resizeMode="cover"
          />
          {post.media.length > 1 && (
            <View style={styles.mediaCountBadge}>
              <Text style={styles.mediaCountText}>+{post.media.length - 1}</Text>
            </View>
          )}
        </View>
      )}

      {/* 操作按鈕 */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <Text style={styles.actionIcon}>{post.isLiked ? '❤️' : '🤍'}</Text>
          <Text style={styles.actionText}>{formatCount(post.likes)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{formatCount(post.comments)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📤</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  time: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.secondaryText,
  },
  dot: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.secondaryText,
  },
  location: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.secondaryText,
    flex: 1,
  },
  content: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  mediaContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  media: {
    width: width - SPACING.md * 4,
    height: width - SPACING.md * 4,
    borderRadius: BORDER_RADIUS.md,
  },
  mediaCountBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  mediaCountText: {
    color: '#fff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  actionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
});

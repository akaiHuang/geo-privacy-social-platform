import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { User } from '../../types';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../utils/constants';
import { formatCount } from '../../utils/validators';

interface ProfileHeaderProps {
  user: User;
  postCount: number;
  onEditPress?: () => void;
  isOwnProfile?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  postCount,
  onEditPress,
  isOwnProfile = false,
}) => {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: user.avatar || 'https://via.placeholder.com/100' }}
        style={styles.avatar}
      />
      
      <Text style={styles.displayName}>{user.displayName}</Text>
      <Text style={styles.username}>@{user.username}</Text>
      
      {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
      
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{formatCount(postCount)}</Text>
          <Text style={styles.statLabel}>貼文</Text>
        </View>
      </View>
      
      {isOwnProfile && (
        <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
          <Text style={styles.editButtonText}>編輯個人資料</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: SPACING.md,
  },
  displayName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  username: {
    fontSize: FONT_SIZE.md,
    color: COLORS.secondaryText,
    marginBottom: SPACING.md,
  },
  bio: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
  },
  statNumber: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.secondaryText,
    marginTop: SPACING.xs,
  },
  editButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
});

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileWall } from '../components/profile/ProfileWall';
import ApiService from '../services/api';
import { User, Post } from '../types';
import { COLORS } from '../utils/constants';

export const ProfileScreen: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userResponse = await ApiService.getCurrentUser();
      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data);
        
        const postsResponse = await ApiService.getUserPosts(userResponse.data.id);
        setPosts(postsResponse.items);
      }
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <ProfileHeader
          user={user}
          postCount={posts.length}
          isOwnProfile={true}
          onEditPress={() => {
            // 打開編輯個人資料畫面
            console.log('Edit profile');
          }}
        />
        <ProfileWall
          posts={posts}
          loading={loading}
          onPostPress={(post) => {
            console.log('Navigate to post:', post.id);
          }}
          onRefresh={loadProfile}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

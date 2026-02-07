import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import AuthService from '../services/auth';
import { COLORS, SPACING, FONT_SIZE } from '../utils/constants';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('提示', '請填寫所有必填欄位');
      return;
    }

    if (!isLogin && (!username || !displayName)) {
      Alert.alert('提示', '請填寫所有必填欄位');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const result = await AuthService.login(email, password);
        if (!result.success) {
          Alert.alert('登入失敗', result.error || '請稍後再試');
        }
      } else {
        const result = await AuthService.register(email, password, username, displayName);
        if (!result.success) {
          Alert.alert('註冊失敗', result.error || '請稍後再試');
        }
      }
    } catch (error) {
      Alert.alert('錯誤', '發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>🗺️ 社交地圖</Text>
            <Text style={styles.subtitle}>
              {isLogin ? '歡迎回來' : '創建新帳號'}
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="電子郵件"
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="密碼"
              value={password}
              onChangeText={setPassword}
              placeholder="至少 6 個字符"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />

            {!isLogin && (
              <>
                <Input
                  label="用戶名"
                  value={username}
                  onChangeText={setUsername}
                  placeholder="username"
                  autoCapitalize="none"
                />

                <Input
                  label="顯示名稱"
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="您的名字"
                />
              </>
            )}

            <Button
              title={isLogin ? '登入' : '註冊'}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            />

            <TouchableOpacity
              onPress={() => setIsLogin(!isLogin)}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {isLogin ? '還沒有帳號？註冊' : '已有帳號？登入'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.secondaryText,
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  switchButton: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    padding: SPACING.sm,
  },
  switchText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

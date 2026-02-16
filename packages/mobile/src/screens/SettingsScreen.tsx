import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon, Button, Modal } from '../components/common';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import type { RootStackParamList } from '../navigation/types';

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SettingsNavigationProp>();
  const { user, signOut, deleteAccount } = useAuth();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      setShowDeleteModal(false);
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to delete account'
      );
    } finally {
      setDeleting(false);
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://proofed.app/privacy');
  };

  const openTerms = () => {
    Linking.openURL('https://proofed.app/terms');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow_back" size="md" color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing[6] }}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Icon name="email" size="sm" color={colors.dustyMauve} />
              <Text style={styles.rowText}>{user?.email || 'Not signed in'}</Text>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('Preferences')}
            >
              <Icon name="tune" size="sm" color={colors.dustyMauve} />
              <Text style={styles.rowText}>Temperature & Units</Text>
              <Icon name="chevron_right" size="sm" color={colors.dustyMauve} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APP</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={openPrivacyPolicy}>
              <Icon name="policy" size="sm" color={colors.dustyMauve} />
              <Text style={styles.rowText}>Privacy Policy</Text>
              <Icon name="chevron_right" size="sm" color={colors.dustyMauve} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={openTerms}>
              <Icon name="description" size="sm" color={colors.dustyMauve} />
              <Text style={styles.rowText}>Terms of Service</Text>
              <Icon name="chevron_right" size="sm" color={colors.dustyMauve} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Icon name="info" size="sm" color={colors.dustyMauve} />
              <Text style={styles.rowText}>Version</Text>
              <Text style={styles.versionText}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onPress={handleSignOut}
            style={styles.signOutButton}
          >
            Sign Out
          </Button>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DANGER ZONE</Text>
          <View style={styles.dangerCard}>
            <Text style={styles.dangerText}>
              Deleting your account will permanently remove all your bakes, recipes, and data.
              This action cannot be undone.
            </Text>
            <Button
              variant="danger"
              size="md"
              fullWidth
              onPress={() => setShowDeleteModal(true)}
            >
              Delete Account
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>
            Are you sure you want to delete your account? This will permanently delete:
          </Text>
          <View style={styles.modalList}>
            <Text style={styles.modalListItem}>All your bakes and attempts</Text>
            <Text style={styles.modalListItem}>All your recipes and variants</Text>
            <Text style={styles.modalListItem}>All your photos</Text>
            <Text style={styles.modalListItem}>Your account information</Text>
          </View>
          <Text style={styles.modalWarning}>This action cannot be undone.</Text>

          <View style={styles.modalButtons}>
            <Button
              variant="secondary"
              size="md"
              onPress={() => setShowDeleteModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={deleting}
              onPress={handleDeleteAccount}
              style={styles.modalButton}
            >
              Delete Account
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backButton: {
    padding: spacing[2],
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    letterSpacing: 1.5,
    color: colors.dustyMauve,
    marginBottom: spacing[3],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
  },
  rowText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  versionText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.dustyMauve,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginLeft: spacing[12],
  },
  signOutButton: {
    backgroundColor: colors.white,
  },
  dangerCard: {
    backgroundColor: '#fef2f2',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: '#991b1b',
    marginBottom: spacing[4],
  },
  modalContent: {
    padding: spacing[4],
  },
  modalText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
    marginBottom: spacing[4],
  },
  modalList: {
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  modalListItem: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    paddingLeft: spacing[4],
  },
  modalWarning: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.error,
    marginBottom: spacing[6],
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  modalButton: {
    flex: 1,
  },
});

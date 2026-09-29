import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  AppButton,
  AppCard,
  ErrorMessage,
  LoadingView,
  SampleImageGallery,
  ScreenContainer,
} from '../../components';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { SilageSample, SilageType } from '../../models/silage';
import { Farm } from '../../models/farm';
import { Animal } from '../../models/animal';
import { TestResult } from '../../models/testResult';
import { SampleImageResponse } from '../../models/sampleImage';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { silageService } from '../../services/silageService';
import { farmService } from '../../services/farmService';
import { animalService } from '../../services/animalService';
import { sampleImageService } from '../../services/sampleImageService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

const SILAGE_TYPE_LABELS: Record<SilageType, string> = {
  MAIZE: 'Maize Silage',
  SORGHUM: 'Sorghum Silage',
  NAPIER: 'Napier Grass Silage',
  MIXED: 'Mixed Crop Silage',
  OTHER: 'Other Silage',
};

export const SilageDetailsScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'SilageDetails'>['route']>();
  const { sampleId } = route.params;
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [sample, setSample] = useState<SilageSample | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [images, setImages] = useState<SampleImageResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isImagesLoading, setIsImagesLoading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSilageData = useCallback(async () => {
    try {
      setErrorMessage(null);
      setIsLoading(true);
      const sampleData = await silageService.getSilageSampleById(sampleId);
      setSample(sampleData);

      const [farmData, animalData, tests, sampleImages] = await Promise.all([
        sampleData.farmId ? farmService.getFarmById(sampleData.farmId).catch(() => null) : null,
        sampleData.animalId ? animalService.getAnimalById(sampleData.animalId).catch(() => null) : null,
        silageService.getTestResultsForSilageSample(sampleId).catch(() => [] as TestResult[]),
        sampleImageService.getSilageImages(sampleId).catch(() => [] as SampleImageResponse[]),
      ]);

      setFarm(farmData);
      setAnimal(animalData);
      setTestResults(tests);
      setImages(sampleImages);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [sampleId]);

  useEffect(() => {
    loadSilageData();
  }, [loadSilageData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSilageData();
    });
    return unsubscribe;
  }, [navigation, loadSilageData]);

  const handleEdit = () => {
    if (!sample) return;
    navigation.navigate('EditSilage', { sampleId: sample.id });
  };

  const handleRecordTestResult = () => {
    if (!sample) return;
    navigation.navigate('AddTestResult', {
      silageSampleId: sample.id,
      sampleCode: sample.sampleCode,
    });
  };

  const handleTestResultPress = (resultId: number) => {
    navigation.navigate('TestResultDetails', { resultId });
  };

  const handleCaptureImage = () => {
    if (!sample) return;
    navigation.navigate('CameraCapture', {
      sampleType: 'SILAGE',
      sampleId: sample.id,
      sampleCode: sample.sampleCode,
    });
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      await sampleImageService.deleteSilageImage(sampleId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      Alert.alert('Error', getFarmerFriendlyErrorMessage(err));
    }
  };

  const executeDelete = async () => {
    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await silageService.deleteSilageSample(sampleId);
      navigation.goBack();
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
      setIsDeleting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Silage Sample',
      `Are you sure you want to delete silage sample "${sample?.sampleCode || 'this sample'}"? Any recorded fermentation test results will also be deleted.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: executeDelete,
        },
      ],
      { cancelable: true }
    );
  };

  if (isLoading) {
    return <LoadingView message="Loading silage sample details..." />;
  }

  if (errorMessage && !sample) {
    return (
      <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
        <ErrorMessage
          testID="silage-details-error"
          message={errorMessage}
          onRetry={loadSilageData}
        />
        <AppButton
          title="Back to Silage List"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
      {errorMessage && (
        <ErrorMessage
          testID="silage-action-error"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Header Profile Card */}
      <AppCard style={styles.card} testID="silage-info-card">
        <View style={styles.heroRow}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>🌽</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.sampleCodeTitle} testID="silage-detail-code">
              {sample?.sampleCode}
            </Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {sample ? SILAGE_TYPE_LABELS[sample.silageType] || sample.silageType : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsTable}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🏡 Farm</Text>
            <Text style={styles.detailValue}>
              {farm ? farm.farmName : (sample?.farmId ? `Farm #${sample.farmId}` : 'Not Available')}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🐄 Designated Animal</Text>
            <Text style={[styles.detailValue, !animal && styles.naText]}>
              {animal
                ? `${animal.animalTag}${animal.name ? ` (${animal.name})` : ''}${animal.breed ? ` • ${animal.breed}` : ''}`
                : 'Not Available (Bunker / Pit Sample)'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Sampling Date</Text>
            <Text style={styles.detailValue}>{sample?.sampleDate || 'Not Available'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📦 Storage / Pit / Bunker</Text>
            <Text style={[styles.detailValue, !sample?.source && styles.naText]}>
              {sample?.source || 'Not Available'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.notesBlock}>
            <Text style={styles.detailLabel}>📝 Observations & Fermentation Notes</Text>
            <Text style={[styles.notesText, !sample?.notes && styles.naText]}>
              {sample?.notes || 'Not Available'}
            </Text>
          </View>
        </View>
      </AppCard>

      {/* Silage Image Attachments (M6.6 Camera / AI Screening Integration) */}
      <SampleImageGallery
        sampleType="SILAGE"
        sampleId={sampleId}
        images={images}
        isLoading={isImagesLoading}
        onCapturePress={handleCaptureImage}
        onPickPress={handleCaptureImage}
        onDeleteImage={handleDeleteImage}
      />

      {/* Historical Test Results Section */}
      <AppCard style={styles.card} testID="silage-tests-card">
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>🧪 Historical Test Results</Text>
            <Text style={styles.sectionSubtitle}>
              {testResults.length} {testResults.length === 1 ? 'test recorded' : 'tests recorded'}
            </Text>
          </View>
          <AppButton
            testID="record-silage-test-button"
            title="+ Test"
            size="small"
            onPress={handleRecordTestResult}
            accessibilityLabel="Record New Test Result"
          />
        </View>

        {testResults.length === 0 ? (
          <View style={styles.emptyTestsBox}>
            <Text style={styles.emptyTestsText}>
              No fermentation test results recorded yet for this silage sample.
            </Text>
            <AppButton
              testID="empty-record-silage-test-button"
              title="Record Fermentation Test"
              variant="outline"
              size="small"
              onPress={handleRecordTestResult}
              style={styles.emptyTestButton}
            />
          </View>
        ) : (
          <View style={styles.testList}>
            {testResults.map((t) => (
              <TouchableOpacity
                key={t.id}
                testID={`silage-test-result-${t.id}`}
                activeOpacity={0.7}
                onPress={() => handleTestResultPress(t.id)}
                style={styles.testItemCard}
              >
                <View style={styles.testItemHeader}>
                  <Text style={styles.testDateText}>
                    📅 {t.testDate || 'Date not recorded'}
                  </Text>
                  {t.overallQuality ? (
                    <View style={styles.qualityBadge}>
                      <Text style={styles.qualityBadgeText}>{t.overallQuality}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.metricsPillsRow}>
                  {t.ph !== null && t.ph !== undefined ? (
                    <Text style={styles.metricPill}>pH: {t.ph.toFixed(2)}</Text>
                  ) : null}
                  {t.moisture !== null && t.moisture !== undefined ? (
                    <Text style={styles.metricPill}>Moisture: {t.moisture}%</Text>
                  ) : null}
                  {t.crudeProtein !== null && t.crudeProtein !== undefined ? (
                    <Text style={styles.metricPill}>CP: {t.crudeProtein}%</Text>
                  ) : null}
                  {t.fiber !== null && t.fiber !== undefined ? (
                    <Text style={styles.metricPill}>CF: {t.fiber}%</Text>
                  ) : null}
                  {t.mouldDetected !== null && t.mouldDetected !== undefined ? (
                    <Text style={styles.metricPill}>
                      Mould: {t.mouldDetected ? '⚠️ Yes' : '✓ No'}
                    </Text>
                  ) : null}
                  {t.spoilageDetected !== null && t.spoilageDetected !== undefined ? (
                    <Text style={styles.metricPill}>
                      Spoilage: {t.spoilageDetected ? '⚠️ Yes' : '✓ No'}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.viewDetailLink}>View Complete Measurements ›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </AppCard>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <AppButton
          testID="edit-silage-button"
          title="✏️ Edit Silage Sample"
          variant="secondary"
          onPress={handleEdit}
          disabled={isDeleting}
          style={styles.actionButton}
        />

        <AppButton
          testID="delete-silage-button"
          title="🗑️ Delete Silage Sample"
          variant="outline"
          onPress={handleDelete}
          loading={isDeleting}
          disabled={isDeleting}
          style={[styles.actionButton, styles.deleteButton]}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: 840,
    width: '100%',
    alignSelf: 'center',
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 28,
  },
  heroInfo: {
    flex: 1,
  },
  sampleCodeTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  typeBadgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
    color: colors.primaryDark,
  },
  detailsTable: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  detailValue: {
    fontSize: typography.fontSize.small,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  naText: {
    color: colors.textMuted,
    fontStyle: 'italic',
    fontWeight: 'normal',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 4,
  },
  notesBlock: {
    paddingVertical: 6,
  },
  notesText: {
    fontSize: typography.fontSize.small,
    color: colors.textPrimary,
    marginTop: 4,
    lineHeight: typography.lineHeight.small,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyTestsBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  emptyTestsText: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyTestButton: {
    minWidth: 180,
  },
  testList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  testItemCard: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  testItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  testDateText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  qualityBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  qualityBadgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryDark,
  },
  metricsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  metricPill: {
    fontSize: typography.fontSize.caption,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textSecondary,
  },
  viewDetailLink: {
    fontSize: typography.fontSize.caption,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 4,
  },
  actionSection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
  deleteButton: {
    borderColor: colors.error,
  },
  backButton: {
    marginTop: spacing.md,
  },
});

export default SilageDetailsScreen;

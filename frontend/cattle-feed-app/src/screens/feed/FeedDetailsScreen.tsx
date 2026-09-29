import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
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
import { FeedSample, FeedType } from '../../models/feed';
import { Farm } from '../../models/farm';
import { Animal } from '../../models/animal';
import { TestResult } from '../../models/testResult';
import { SampleImageResponse } from '../../models/sampleImage';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { feedService } from '../../services/feedService';
import { farmService } from '../../services/farmService';
import { animalService } from '../../services/animalService';
import { sampleImageService } from '../../services/sampleImageService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

const FEED_TYPE_LABELS: Record<FeedType, string> = {
  CATTLE_FEED_PELLET: 'Cattle Feed Pellet',
  FEED_MASH: 'Feed Mash',
  MINERAL_MIXTURE: 'Mineral Mixture',
  GREEN_FODDER: 'Green Fodder',
  DRY_FODDER: 'Dry Fodder',
  OTHER: 'Other Feed',
};

export const FeedDetailsScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'FeedDetails'>['route']>();
  const { sampleId } = route.params;

  const [sample, setSample] = useState<FeedSample | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [images, setImages] = useState<SampleImageResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isImagesLoading, setIsImagesLoading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadFeedData = useCallback(async () => {
    try {
      setErrorMessage(null);
      setIsLoading(true);
      const sampleData = await feedService.getFeedSampleById(sampleId);
      setSample(sampleData);

      const [farmData, animalData, tests, sampleImages] = await Promise.all([
        sampleData.farmId ? farmService.getFarmById(sampleData.farmId).catch(() => null) : null,
        sampleData.animalId ? animalService.getAnimalById(sampleData.animalId).catch(() => null) : null,
        feedService.getTestResultsForFeedSample(sampleId).catch(() => [] as TestResult[]),
        sampleImageService.getFeedImages(sampleId).catch(() => [] as SampleImageResponse[]),
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
    loadFeedData();
  }, [loadFeedData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFeedData();
    });
    return unsubscribe;
  }, [navigation, loadFeedData]);

  const handleEdit = () => {
    if (!sample) return;
    navigation.navigate('EditFeed', { sampleId: sample.id });
  };

  const handleRecordTestResult = () => {
    if (!sample) return;
    navigation.navigate('AddTestResult', {
      feedSampleId: sample.id,
      sampleCode: sample.sampleCode,
    });
  };

  const handleTestResultPress = (resultId: number) => {
    navigation.navigate('TestResultDetails', { resultId });
  };

  const handleCaptureImage = () => {
    if (!sample) return;
    navigation.navigate('CameraCapture', {
      sampleType: 'FEED',
      sampleId: sample.id,
      sampleCode: sample.sampleCode,
    });
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      await sampleImageService.deleteFeedImage(sampleId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      Alert.alert('Error', getFarmerFriendlyErrorMessage(err));
    }
  };

  const executeDelete = async () => {
    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await feedService.deleteFeedSample(sampleId);
      navigation.goBack();
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
      setIsDeleting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Feed Sample',
      `Are you sure you want to delete feed sample "${sample?.sampleCode || 'this sample'}"? Any recorded test results will also be deleted.`,
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
    return <LoadingView message="Loading feed sample details..." />;
  }

  if (errorMessage && !sample) {
    return (
      <ScreenContainer contentContainerStyle={styles.container}>
        <ErrorMessage
          testID="feed-details-error"
          message={errorMessage}
          onRetry={loadFeedData}
        />
        <AppButton
          title="Back to Feed List"
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
          testID="feed-action-error"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Header Profile Card */}
      <AppCard style={styles.card} testID="feed-info-card">
        <View style={styles.heroRow}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>🌾</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.sampleCodeTitle} testID="feed-detail-code">
              {sample?.sampleCode}
            </Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {sample ? FEED_TYPE_LABELS[sample.feedType] : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsTable}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🏡 Farm</Text>
            <Text style={styles.detailValue}>
              {farm ? farm.farmName : `Farm #${sample?.farmId}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🐄 Linked Animal</Text>
            <Text style={styles.detailValue}>
              {animal ? `${animal.animalTag} (${animal.breed || 'Unknown'})` : 'Not linked to specific animal'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Collection Date</Text>
            <Text style={styles.detailValue}>{sample?.sampleDate}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📦 Source / Vendor</Text>
            <Text style={styles.detailValue}>
              {sample?.source || 'Not specified'}
            </Text>
          </View>

          {sample?.notes ? (
            <>
              <View style={styles.divider} />
              <View style={styles.notesBlock}>
                <Text style={styles.detailLabel}>📝 Notes</Text>
                <Text style={styles.notesText}>{sample.notes}</Text>
              </View>
            </>
          ) : null}
        </View>
      </AppCard>

      {/* Feed Image Attachments (M6.6) */}
      <SampleImageGallery
        sampleType="FEED"
        sampleId={sampleId}
        images={images}
        isLoading={isImagesLoading}
        onCapturePress={handleCaptureImage}
        onPickPress={handleCaptureImage}
        onDeleteImage={handleDeleteImage}
      />

      {/* Historical Test Results Section */}
      <AppCard style={styles.card} testID="feed-tests-card">
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>🧪 Historical Test Results</Text>
            <Text style={styles.sectionSubtitle}>
              {testResults.length} {testResults.length === 1 ? 'test recorded' : 'tests recorded'}
            </Text>
          </View>
          <AppButton
            testID="record-test-button"
            title="+ Test"
            size="small"
            onPress={handleRecordTestResult}
            accessibilityLabel="Record New Test Result"
          />
        </View>

        {testResults.length === 0 ? (
          <View style={styles.emptyTestsBox}>
            <Text style={styles.emptyTestsText}>
              No test results recorded yet for this sample.
            </Text>
            <AppButton
              testID="empty-record-test-button"
              title="Record First Test Result"
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
                testID={`test-result-item-${t.id}`}
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
                  {t.moisture !== null && t.moisture !== undefined ? (
                    <Text style={styles.metricPill}>Moisture: {t.moisture}%</Text>
                  ) : null}
                  {t.crudeProtein !== null && t.crudeProtein !== undefined ? (
                    <Text style={styles.metricPill}>Protein: {t.crudeProtein}%</Text>
                  ) : null}
                  {t.aflatoxin !== null && t.aflatoxin !== undefined ? (
                    <Text style={styles.metricPill}>Aflatoxin: {t.aflatoxin} ppb</Text>
                  ) : null}
                  {t.ph !== null && t.ph !== undefined ? (
                    <Text style={styles.metricPill}>pH: {t.ph}</Text>
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
          testID="edit-feed-button"
          title="✏️ Edit Feed Sample"
          variant="secondary"
          onPress={handleEdit}
          disabled={isDeleting}
          style={styles.actionButton}
        />

        <AppButton
          testID="delete-feed-button"
          title="🗑️ Delete Feed Sample"
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

export default FeedDetailsScreen;

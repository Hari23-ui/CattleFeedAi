import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { borderRadius, colors, spacing, typography } from '../constants/theme';
import { SampleImageResponse } from '../models/sampleImage';
import { VisualAnalysisResponse } from '../models/visualAnalysis';
import { sampleImageService } from '../services/sampleImageService';
import { visualAnalysisService } from '../services/visualAnalysisService';
import { getToken } from '../storage/tokenStorage';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';

interface SampleImageGalleryProps {
  sampleType: 'FEED' | 'SILAGE';
  sampleId: number;
  images: SampleImageResponse[];
  isLoading: boolean;
  onCapturePress: () => void;
  onPickPress: () => void;
  onDeleteImage?: (imageId: number) => Promise<void>;
}

export const SampleImageGallery: React.FC<SampleImageGalleryProps> = ({
  sampleType,
  sampleId,
  images,
  isLoading,
  onCapturePress,
  onPickPress,
  onDeleteImage,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<SampleImageResponse | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [analysisResult, setAnalysisResult] = useState<VisualAnalysisResponse | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);

  useEffect(() => {
    getToken().then((t) => setToken(t));
  }, []);

  const handleAnalyzePress = async (image: SampleImageResponse) => {
    try {
      setAnalyzingId(image.id);
      let result: VisualAnalysisResponse;
      if (sampleType === 'FEED') {
        result = await visualAnalysisService.analyzeFeedSampleImage(sampleId, image.id);
      } else {
        result = await visualAnalysisService.analyzeSilageSampleImage(sampleId, image.id);
      }
      setAnalysisResult(result);
      setShowAnalysisModal(true);
    } catch (err: any) {
      Alert.alert(
        'Visual Screening Error',
        err.message || 'Failed to communicate with AI visual screening service.'
      );
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDeletePress = (image: SampleImageResponse) => {
    if (!onDeleteImage) return;

    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this photo attachment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(image.id);
              await onDeleteImage(image.id);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return colors.success;
      case 'POSSIBLE_CONCERN':
        return colors.warning;
      case 'ABNORMAL':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return colors.error;
      case 'MEDIUM':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>
            📷 {sampleType === 'FEED' ? 'Feed' : 'Silage'} Images ({images.length})
          </Text>
          <Text style={styles.subtitle}>Visual documentation & AI screening records</Text>
        </View>
      </View>

      <View style={styles.actionButtonsRow}>
        <View style={styles.buttonWrapper}>
          <AppButton
            title="📸 Take Photo"
            variant="primary"
            onPress={onCapturePress}
            size="small"
          />
        </View>
        <View style={styles.buttonWrapper}>
          <AppButton
            title="🖼️ Gallery"
            variant="outline"
            onPress={onPickPress}
            size="small"
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading image attachments...</Text>
        </View>
      ) : images.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyText}>No photos attached yet</Text>
          <Text style={styles.emptySubtext}>
            Capture a photo using your camera or choose from gallery to attach visual records for this batch.
          </Text>
        </View>
      ) : (
        <View style={styles.galleryGrid}>
          {images.map((img) => {
            const fileUrl = sampleImageService.getImageFileUrl(sampleType, sampleId, img.id);
            const isDeleting = deletingId === img.id;
            const isAnalyzing = analyzingId === img.id;

            return (
              <View key={img.id} style={styles.thumbnailCard}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedImage(img)}
                  style={styles.imageWrapper}
                >
                  <Image
                    source={{
                      uri: fileUrl,
                      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.expandOverlay}>
                    <Text style={styles.expandText}>🔍 Tap to view</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.imageInfo}>
                  <Text style={styles.filename} numberOfLines={1}>
                    {img.originalFilename}
                  </Text>
                  <Text style={styles.metaText}>
                    {formatDate(img.createdAt)} • {formatSize(img.fileSize)}
                  </Text>
                  {img.caption ? (
                    <Text style={styles.captionText} numberOfLines={2}>
                      "{img.caption}"
                    </Text>
                  ) : null}

                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      onPress={() => handleAnalyzePress(img)}
                      disabled={isAnalyzing || isDeleting}
                      style={[styles.actionBtn, styles.screenBtn]}
                    >
                      {isAnalyzing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.screenBtnText}>🔍 AI Screen</Text>
                      )}
                    </TouchableOpacity>

                    {onDeleteImage ? (
                      <TouchableOpacity
                        onPress={() => handleDeletePress(img)}
                        disabled={isDeleting || isAnalyzing}
                        style={[styles.actionBtn, styles.deleteBtn]}
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color={colors.error} />
                        ) : (
                          <Text style={styles.deleteBtnText}>🗑️ Remove</Text>
                        )}
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Full Screen Image Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedImage?.originalFilename}
              </Text>
              <View style={styles.modalHeaderActions}>
                {selectedImage ? (
                  <TouchableOpacity
                    onPress={() => handleAnalyzePress(selectedImage)}
                    disabled={analyzingId === selectedImage.id}
                    style={styles.modalScreenBtn}
                  >
                    {analyzingId === selectedImage.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalScreenBtnText}>🔍 Screen</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕ Close</Text>
                </TouchableOpacity>
              </View>
            </View>

            {selectedImage ? (
              <Image
                source={{
                  uri: sampleImageService.getImageFileUrl(
                    sampleType,
                    sampleId,
                    selectedImage.id
                  ),
                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            ) : null}

            {selectedImage?.caption ? (
              <View style={styles.modalCaptionContainer}>
                <Text style={styles.modalCaptionText}>
                  "{selectedImage.caption}"
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Visual Screening Results Modal */}
      <Modal
        visible={showAnalysisModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAnalysisModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.analysisModalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.analysisHeaderTitle}>🔍 AI Visual Screening</Text>
                <Text style={styles.analysisHeaderSubtitle}>Physical surface inspection</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAnalysisModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕ Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.analysisBody} contentContainerStyle={styles.analysisScroll}>
              {analysisResult ? (
                <>
                  {/* Analysis Source & Model Version Badge */}
                  <View style={styles.sourceBannerRow}>
                    <View style={[styles.sourceBadge, { backgroundColor: analysisResult.analysis_source === 'ML_VISUAL_SCREENING' ? colors.primary : '#e2e8f0' }]}>
                      <Text style={[styles.sourceBadgeText, { color: analysisResult.analysis_source === 'ML_VISUAL_SCREENING' ? '#fff' : colors.textPrimary }]}>
                        {analysisResult.analysis_source === 'ML_VISUAL_SCREENING'
                          ? '🤖 ML Visual Screening'
                          : '🔍 Visual Screening Baseline'}
                      </Text>
                    </View>
                    {analysisResult.model_version ? (
                      <View style={styles.modelBadge}>
                        <Text style={styles.modelBadgeText}>v: {analysisResult.model_version}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Overall Verdict Card */}
                  <View style={[styles.verdictCard, { borderColor: getStatusColor(analysisResult.overall_screening.status) }]}>
                    <View style={styles.verdictTopRow}>
                      <Text style={styles.verdictLabel}>SCREENING STATUS</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(analysisResult.overall_screening.status) }]}>
                        <Text style={styles.statusBadgeText}>
                          {analysisResult.overall_screening.status.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.verdictSummary}>{analysisResult.overall_screening.summary}</Text>
                  </View>

                  {/* Image Quality Card */}
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionHeading}>📸 Physical Image Quality</Text>
                    <View style={styles.qualityRow}>
                      <Text style={styles.qualityLabel}>Quality Grade:</Text>
                      <Text style={[styles.qualityStatus, { color: analysisResult.image_quality.status === 'SUFFICIENT' ? colors.success : colors.warning }]}>
                        {analysisResult.image_quality.status}
                      </Text>
                    </View>
                    {analysisResult.image_quality.metrics ? (
                      <Text style={styles.qualityMetricsText}>
                        Resolution: {analysisResult.image_quality.metrics.width}x{analysisResult.image_quality.metrics.height} • Luminance: {analysisResult.image_quality.metrics.mean_luminance}/255 • Contrast: {analysisResult.image_quality.metrics.contrast_std}
                      </Text>
                    ) : null}
                    {analysisResult.image_quality.issues.length > 0 ? (
                      <View style={styles.issuesList}>
                        {analysisResult.image_quality.issues.map((issue, idx) => (
                          <Text key={idx} style={styles.issueItem}>• {issue}</Text>
                        ))}
                      </View>
                    ) : null}
                  </View>

                  {/* Visual Indicators */}
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionHeading}>
                      🔬 Surface Indicators ({analysisResult.visual_indicators.length})
                    </Text>

                    {analysisResult.visual_indicators.length === 0 ? (
                      <View style={styles.noIndicatorsBox}>
                        <Text style={styles.noIndicatorsText}>
                          ✅ No abnormal surface discolouration, mould growth, or foreign material detected.
                        </Text>
                      </View>
                    ) : (
                      analysisResult.visual_indicators.map((ind, idx) => (
                        <View key={idx} style={styles.indicatorCard}>
                          <View style={styles.indicatorTopRow}>
                            <Text style={styles.indicatorLabel}>{ind.label}</Text>
                            <View style={[styles.severityPill, { backgroundColor: getSeverityBadgeColor(ind.severity) }]}>
                              <Text style={styles.severityText}>{ind.severity}</Text>
                            </View>
                          </View>
                          <Text style={styles.indicatorEvidence}>{ind.evidence}</Text>
                          <Text style={styles.confidenceText}>
                            Visual Confidence: {Math.round(ind.confidence * 100)}%
                          </Text>
                        </View>
                      ))
                    )}
                  </View>

                  {/* Scientific Boundary & Disclaimer */}
                  <View style={styles.disclaimerCard}>
                    <Text style={styles.disclaimerHeading}>⚖️ Scientific Boundary Notice</Text>
                    <Text style={styles.disclaimerText}>{analysisResult.disclaimer}</Text>
                    <View style={styles.boundaryBadgeRow}>
                      <Text style={styles.boundaryBadge}>🚫 No Chemical Prediction</Text>
                      <Text style={styles.boundaryBadge}>🚫 No Disease Diagnosis</Text>
                    </View>
                  </View>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.md,
    padding: spacing.md,
  },
  headerRow: {
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  buttonWrapper: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  loadingText: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  emptySubtext: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 260,
  },
  galleryGrid: {
    gap: spacing.md,
  },
  thumbnailCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    backgroundColor: '#000',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  expandOverlay: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  expandText: {
    color: '#fff',
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
  },
  imageInfo: {
    padding: spacing.sm,
  },
  filename: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  metaText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  captionText: {
    fontSize: typography.fontSize.caption,
    color: colors.primaryDark,
    fontStyle: 'italic',
    marginTop: 4,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenBtn: {
    backgroundColor: colors.primary,
  },
  screenBtnText: {
    color: '#fff',
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
  },
  deleteBtn: {
    backgroundColor: colors.background,
  },
  deleteBtnText: {
    fontSize: typography.fontSize.caption,
    color: colors.error,
    fontWeight: typography.fontWeight.semibold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    height: '85%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  modalScreenBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  modalScreenBtnText: {
    color: '#fff',
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
  },
  closeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
  },
  closeButtonText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  modalImage: {
    flex: 1,
    width: '100%',
    backgroundColor: '#111',
  },
  modalCaptionContainer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalCaptionText: {
    fontSize: typography.fontSize.small,
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  analysisModalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  analysisHeaderTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  analysisHeaderSubtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  analysisBody: {
    padding: spacing.md,
  },
  analysisScroll: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  sourceBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  sourceBadgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
  },
  modelBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modelBadgeText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  verdictCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    backgroundColor: colors.background,
  },
  verdictTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  verdictLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
  },
  verdictSummary: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  sectionCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeading: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  qualityLabel: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
  },
  qualityStatus: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
  },
  qualityMetricsText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  issuesList: {
    marginTop: spacing.xs,
    paddingLeft: spacing.xs,
  },
  issueItem: {
    fontSize: typography.fontSize.caption,
    color: colors.warning,
    marginTop: 2,
  },
  noIndicatorsBox: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  noIndicatorsText: {
    fontSize: typography.fontSize.caption,
    color: colors.success,
  },
  indicatorCard: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  indicatorTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicatorLabel: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  severityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  indicatorEvidence: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  confidenceText: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: typography.fontWeight.medium,
    marginTop: 4,
  },
  disclaimerCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  disclaimerHeading: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: '#8D6E63',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#5D4037',
    lineHeight: 16,
  },
  boundaryBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  boundaryBadge: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: '#B71C1C',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
});

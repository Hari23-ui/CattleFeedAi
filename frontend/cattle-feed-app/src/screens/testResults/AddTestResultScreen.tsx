import React, { useEffect, useState } from 'react';
import {
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
  AppInput,
  ErrorMessage,
  LoadingView,
  OptionSelector,
  ScreenContainer,
} from '../../components';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { AnalysisSource, CreateTestResultRequest } from '../../models/testResult';
import { FeedSample } from '../../models/feed';
import { SilageSample } from '../../models/silage';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { testResultService } from '../../services/testResultService';
import { feedService } from '../../services/feedService';
import { silageService } from '../../services/silageService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';
import { validateTestResultForm } from '../../utils/validation';

/**
 * Backend-supported Analysis Sources for manual/lab test measurement entry.
 * Note: NIR Spectroscopy and IoT Sensors are future-scope and NOT implemented in backend.
 * AI Visual Screening is handled separately via dedicated camera visual screening and
 * does NOT measure chemical values.
 */
const ANALYSIS_SOURCE_OPTIONS: { label: string; value: AnalysisSource; description: string }[] = [
  { label: 'Certified Lab Test', value: 'LAB', description: 'Accredited wet chemistry laboratory analysis' },
  { label: 'Manual Field Test', value: 'MANUAL', description: 'On-farm rapid field test kit or physical inspection' },
];

export const AddTestResultScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'AddTestResult'>['route']>();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const paramFeedId = route.params?.feedSampleId;
  const paramSilageId = route.params?.silageSampleId;
  const paramSampleCode = route.params?.sampleCode;

  const [sampleType, setSampleType] = useState<'FEED' | 'SILAGE'>(
    paramSilageId ? 'SILAGE' : 'FEED'
  );
  const [selectedFeedId, setSelectedFeedId] = useState<number | undefined>(paramFeedId);
  const [selectedSilageId, setSelectedSilageId] = useState<number | undefined>(paramSilageId);

  const [feedSamples, setFeedSamples] = useState<FeedSample[]>([]);
  const [silageSamples, setSilageSamples] = useState<SilageSample[]>([]);
  const [isLoadingSamples, setIsLoadingSamples] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Section 1: Associated Sample & Meta
  const [testDate, setTestDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [analysisSource, setAnalysisSource] = useState<AnalysisSource>('LAB');

  // Section 2: Nutritional & Physical Metrics
  const [moisture, setMoisture] = useState<string>('');
  const [crudeProtein, setCrudeProtein] = useState<string>('');
  const [fiber, setFiber] = useState<string>('');
  const [energyValue, setEnergyValue] = useState<string>('');

  // Section 3: Safety & Contamination
  const [aflatoxin, setAflatoxin] = useState<string>('');
  const [mycotoxin, setMycotoxin] = useState<string>('');
  const [mouldDetected, setMouldDetected] = useState<boolean | null>(null);
  const [spoilageDetected, setSpoilageDetected] = useState<boolean | null>(null);
  const [adulterationStatus, setAdulterationStatus] = useState<'NONE' | 'YES' | null>(null);
  const [adulterationDetail, setAdulterationDetail] = useState<string>('');

  // Section 4: Other Measurements
  const [ph, setPh] = useState<string>('');
  const [mineralStatus, setMineralStatus] = useState<string>('');

  // Section 5: Additional Information
  const [confidenceScore, setConfidenceScore] = useState<string>('');

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // If no parent was passed in route params, load user's feed & silage samples
  useEffect(() => {
    if (!paramFeedId && !paramSilageId) {
      const loadSamples = async () => {
        setIsLoadingSamples(true);
        try {
          const [feeds, silages] = await Promise.all([
            feedService.getAllFeedSamples().catch(() => [] as FeedSample[]),
            silageService.getAllSilageSamples().catch(() => [] as SilageSample[]),
          ]);
          setFeedSamples(feeds);
          setSilageSamples(silages);
          if (feeds.length > 0 && !selectedFeedId) {
            setSelectedFeedId(feeds[0].id);
          } else if (silages.length > 0 && !selectedSilageId) {
            setSampleType('SILAGE');
            setSelectedSilageId(silages[0].id);
          }
        } finally {
          setIsLoadingSamples(false);
        }
      };
      loadSamples();
    }
  }, [paramFeedId, paramSilageId, selectedFeedId, selectedSilageId]);

  const handleSubmit = async () => {
    const feedId = sampleType === 'FEED' ? (paramFeedId || selectedFeedId) : undefined;
    const silageId = sampleType === 'SILAGE' ? (paramSilageId || selectedSilageId) : undefined;

    const parseNum = (val: string): number | null => {
      const trimmed = val.trim();
      if (!trimmed) return null;
      const num = parseFloat(trimmed);
      return isNaN(num) ? null : num;
    };

    let adulterationVal: string | null = null;
    if (adulterationStatus === 'NONE') {
      adulterationVal = 'NONE';
    } else if (adulterationStatus === 'YES') {
      adulterationVal = adulterationDetail.trim() || 'ADULTERATION_DETECTED';
    }

    const rawForm: Partial<CreateTestResultRequest> = {
      feedSampleId: feedId,
      silageSampleId: silageId,
      testDate: testDate.trim() || undefined,
      moisture: parseNum(moisture),
      crudeProtein: parseNum(crudeProtein),
      fiber: parseNum(fiber),
      energyValue: parseNum(energyValue),
      aflatoxin: parseNum(aflatoxin),
      mycotoxin: parseNum(mycotoxin),
      ph: parseNum(ph),
      confidenceScore: parseNum(confidenceScore),
      mineralStatus: mineralStatus.trim() ? mineralStatus.trim() : null,
      adulteration: adulterationVal,
      mouldDetected,
      spoilageDetected,
      analysisSource,
    };

    const validation = validateTestResultForm(rawForm);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      // Null handling is critical: unprovided measurements MUST be sent as null,
      // not 0, 0.0, false, or fabricated values.
      const payload: CreateTestResultRequest = {
        feedSampleId: feedId ?? null,
        silageSampleId: silageId ?? null,
        testDate: testDate.trim() || undefined,
        moisture: parseNum(moisture),
        crudeProtein: parseNum(crudeProtein),
        fiber: parseNum(fiber),
        energyValue: parseNum(energyValue),
        aflatoxin: parseNum(aflatoxin),
        mycotoxin: parseNum(mycotoxin),
        ph: parseNum(ph),
        confidenceScore: parseNum(confidenceScore),
        mineralStatus: mineralStatus.trim() ? mineralStatus.trim() : null,
        adulteration: adulterationVal,
        mouldDetected,
        spoilageDetected,
        analysisSource,
      };

      const result = await testResultService.createTestResult(payload);
      navigation.replace('TestResultDetails', { resultId: result.id });
    } catch (err) {
      setApiError(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSamples) {
    return <LoadingView message="Loading available samples..." />;
  }

  const isLockedParent = Boolean(paramFeedId || paramSilageId);

  const feedOptions = feedSamples.map((f) => ({
    label: `${f.sampleCode} (${f.feedType})`,
    value: f.id,
    description: `Sampled: ${f.sampleDate}`,
  }));

  const silageOptions = silageSamples.map((s) => ({
    label: `${s.sampleCode} (${s.silageType})`,
    value: s.id,
    description: `Sampled: ${s.sampleDate}`,
  }));

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>Record Test Result</Text>
      <Text style={styles.screenSubtitle}>
        Record laboratory, field, or sensory analysis measurements for nutritional and safety assessment
      </Text>

      {apiError && (
        <ErrorMessage
          testID="add-test-error"
          message={apiError}
          onDismiss={() => setApiError(null)}
        />
      )}

      {/* ──────────────────────────────────────────────────────────
          1. Associated Sample
          ────────────────────────────────────────────────────────── */}
      <AppCard style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>1. Associated Sample</Text>
        <Text style={styles.sectionHint}>
          Specify the feed or silage sample tested, sample analysis date, and testing source.
        </Text>

        {isLockedParent ? (
          <View style={styles.lockedParentBox}>
            <Text style={styles.lockedParentLabel}>Testing Target:</Text>
            <Text style={styles.lockedParentValue}>
              {paramSilageId ? 'Silage Sample' : 'Feed Sample'} — {paramSampleCode || `#${paramSilageId || paramFeedId}`}
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.typeToggleRow}>
              <TouchableOpacity
                style={[styles.typeButton, sampleType === 'FEED' && styles.typeButtonActive]}
                onPress={() => setSampleType('FEED')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    sampleType === 'FEED' && styles.typeButtonTextActive,
                  ]}
                >
                  🌾 Feed Sample
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, sampleType === 'SILAGE' && styles.typeButtonActive]}
                onPress={() => setSampleType('SILAGE')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    sampleType === 'SILAGE' && styles.typeButtonTextActive,
                  ]}
                >
                  🌿 Silage Sample
                </Text>
              </TouchableOpacity>
            </View>

            {sampleType === 'FEED' ? (
              feedSamples.length > 0 ? (
                <OptionSelector
                  testID="test-feed-selector"
                  label="Select Feed Sample"
                  required={true}
                  options={feedOptions}
                  selectedValue={selectedFeedId}
                  onSelect={(val) => {
                    setSelectedFeedId(val);
                    setErrors((prev) => ({ ...prev, feedSampleId: undefined }));
                  }}
                  error={errors.feedSampleId}
                />
              ) : (
                <Text style={styles.noSamplesWarning}>
                  No feed samples registered. Please create a feed sample first.
                </Text>
              )
            ) : silageSamples.length > 0 ? (
              <OptionSelector
                testID="test-silage-selector"
                label="Select Silage Sample"
                required={true}
                options={silageOptions}
                selectedValue={selectedSilageId}
                onSelect={(val) => {
                  setSelectedSilageId(val);
                  setErrors((prev) => ({ ...prev, feedSampleId: undefined }));
                }}
                error={errors.feedSampleId}
              />
            ) : (
              <Text style={styles.noSamplesWarning}>
                No silage samples registered. Please create a silage sample first.
              </Text>
            )}
          </View>
        )}

        <View style={isWide ? styles.gridRow : styles.gridColLayout}>
          <View style={isWide ? styles.gridCol : styles.gridColFull}>
            <AppInput
              testID="test-date-input"
              label="Test Date (YYYY-MM-DD)"
              placeholder="e.g. 2026-09-29"
              value={testDate}
              onChangeText={(text) => {
                setTestDate(text);
                if (errors.testDate) setErrors((prev) => ({ ...prev, testDate: undefined }));
              }}
              error={errors.testDate}
              accessibilityLabel="Test Date"
            />
          </View>
          <View style={isWide ? styles.gridCol : styles.gridColFull}>
            <OptionSelector
              testID="analysis-source-selector"
              label="Analysis Source"
              options={ANALYSIS_SOURCE_OPTIONS}
              selectedValue={analysisSource}
              onSelect={(val) => setAnalysisSource(val)}
            />
          </View>
        </View>
      </AppCard>

      {/* ──────────────────────────────────────────────────────────
          2. Nutritional & Physical Metrics
          ────────────────────────────────────────────────────────── */}
      <AppCard style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>2. Nutritional & Physical Metrics</Text>
        <Text style={styles.sectionHint}>
          Enter measured laboratory or field metrics. Leave blank if not tested (will be recorded as Not Available).
        </Text>

        <View style={isWide ? styles.gridRow : styles.gridColLayout}>
          <View style={isWide ? styles.gridCol : styles.gridColFull}>
            <AppInput
              testID="test-moisture-input"
              label="Moisture (%)"
              placeholder="e.g. 12.5"
              value={moisture}
              onChangeText={(text) => {
                setMoisture(text);
                if (errors.moisture) setErrors((prev) => ({ ...prev, moisture: undefined }));
              }}
              error={errors.moisture}
              keyboardType="decimal-pad"
              accessibilityLabel="Moisture Percentage"
            />
          </View>
          <View style={isWide ? styles.gridCol : styles.gridColFull}>
            <AppInput
              testID="test-protein-input"
              label="Crude Protein (%)"
              placeholder="e.g. 18.0"
              value={crudeProtein}
              onChangeText={(text) => {
                setCrudeProtein(text);
                if (errors.crudeProtein) setErrors((prev) => ({ ...prev, crudeProtein: undefined }));
              }}
              error={errors.crudeProtein}
              keyboardType="decimal-pad"
              accessibilityLabel="Crude Protein"
            />
          </View>
        </View>

        <View style={isWide ? styles.gridRow : styles.gridColLayout}>
          <View style={isWide ? styles.gridCol : styles.gridColFull}>
            <AppInput
              testID="test-fiber-input"
              label="Crude Fiber (%)"
              placeholder="e.g. 10.2"
              value={fiber}
              onChangeText={(text) => {
                setFiber(text);
                if (errors.fiber) setErrors((prev) => ({ ...prev, fiber: undefined }));
              }}
              error={errors.fiber}
              keyboardType="decimal-pad"
              accessibilityLabel="Crude Fiber"
            />
          </View>
          <View style={isWide ? styles.gridCol : styles.gridColFull}>
            <AppInput
              testID="test-energy-input"
              label="Energy (MJ/kg)"
              placeholder="e.g. 11.4"
              value={energyValue}
              onChangeText={(text) => {
                setEnergyValue(text);
                if (errors.energyValue) setErrors((prev) => ({ ...prev, energyValue: undefined }));
              }}
              error={errors.energyValue}
              keyboardType="decimal-pad"
              accessibilityLabel="Energy Value"
            />
          </View>
        </View>
      </AppCard>

      {/* ──────────────────────────────────────────────────────────
          3. Safety & Contamination
          ────────────────────────────────────────────────────────── */}
      <AppCard style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>3. Safety & Contamination</Text>
        <Text style={styles.sectionHint}>
          Enter toxin screening values and sensory observations. Leave blank or Not Tested if unknown.
        </Text>

        <View style={isWide ? styles.gridRow : styles.gridColLayout}>
          <View style={isWide ? styles.gridCol : styles.gridColFull}>
            <AppInput
              testID="test-aflatoxin-input"
              label="Aflatoxin (ppb)"
              placeholder="e.g. 15.0"
              value={aflatoxin}
              onChangeText={(text) => {
                setAflatoxin(text);
                if (errors.aflatoxin) setErrors((prev) => ({ ...prev, aflatoxin: undefined }));
              }}
              error={errors.aflatoxin}
              keyboardType="decimal-pad"
              accessibilityLabel="Aflatoxin Level in ppb"
            />
          </View>
          <View style={isWide ? styles.gridCol : styles.gridColFull}>
            <AppInput
              testID="test-mycotoxin-input"
              label="Mycotoxin (ppb)"
              placeholder="e.g. 12.0"
              value={mycotoxin}
              onChangeText={(text) => {
                setMycotoxin(text);
                if (errors.mycotoxin) setErrors((prev) => ({ ...prev, mycotoxin: undefined }));
              }}
              error={errors.mycotoxin}
              keyboardType="decimal-pad"
              accessibilityLabel="Mycotoxin Level in ppb"
            />
          </View>
        </View>

        {/* Mould Detected */}
        <View style={styles.triControlSection}>
          <Text style={styles.controlLabel}>Mould Detected</Text>
          <View style={styles.triButtonRow}>
            <TouchableOpacity
              style={[styles.triButton, mouldDetected === null && styles.triButtonNeutralActive]}
              onPress={() => setMouldDetected(null)}
              testID="mould-not-tested-btn"
            >
              <Text
                style={[
                  styles.triButtonText,
                  mouldDetected === null && styles.triButtonTextNeutralActive,
                ]}
              >
                Not Tested
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.triButton, mouldDetected === false && styles.triButtonSafeActive]}
              onPress={() => setMouldDetected(false)}
              testID="mould-no-btn"
            >
              <Text
                style={[
                  styles.triButtonText,
                  mouldDetected === false && styles.triButtonTextSafeActive,
                ]}
              >
                No Mould ✓
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.triButton, mouldDetected === true && styles.triButtonDangerActive]}
              onPress={() => setMouldDetected(true)}
              testID="mould-yes-btn"
            >
              <Text
                style={[
                  styles.triButtonText,
                  mouldDetected === true && styles.triButtonTextDangerActive,
                ]}
              >
                Mould Present ⚠️
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spoilage Detected */}
        <View style={styles.triControlSection}>
          <Text style={styles.controlLabel}>Spoilage Detected</Text>
          <View style={styles.triButtonRow}>
            <TouchableOpacity
              style={[styles.triButton, spoilageDetected === null && styles.triButtonNeutralActive]}
              onPress={() => setSpoilageDetected(null)}
              testID="spoilage-not-tested-btn"
            >
              <Text
                style={[
                  styles.triButtonText,
                  spoilageDetected === null && styles.triButtonTextNeutralActive,
                ]}
              >
                Not Tested
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.triButton, spoilageDetected === false && styles.triButtonSafeActive]}
              onPress={() => setSpoilageDetected(false)}
              testID="spoilage-no-btn"
            >
              <Text
                style={[
                  styles.triButtonText,
                  spoilageDetected === false && styles.triButtonTextSafeActive,
                ]}
              >
                No Spoilage ✓
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.triButton, spoilageDetected === true && styles.triButtonDangerActive]}
              onPress={() => setSpoilageDetected(true)}
              testID="spoilage-yes-btn"
            >
              <Text
                style={[
                  styles.triButtonText,
                  spoilageDetected === true && styles.triButtonTextDangerActive,
                ]}
              >
                Spoilage Present ⚠️
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Adulteration */}
        <View style={styles.triControlSection}>
          <Text style={styles.controlLabel}>Adulteration Detected</Text>
          <View style={styles.triButtonRow}>
            <TouchableOpacity
              style={[styles.triButton, adulterationStatus === null && styles.triButtonNeutralActive]}
              onPress={() => setAdulterationStatus(null)}
              testID="adulteration-not-tested-btn"
            >
              <Text
                style={[
                  styles.triButtonText,
                  adulterationStatus === null && styles.triButtonTextNeutralActive,
                ]}
              >
                Not Tested
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.triButton, adulterationStatus === 'NONE' && styles.triButtonSafeActive]}
              onPress={() => setAdulterationStatus('NONE')}
              testID="adulteration-no-btn"
            >
              <Text
                style={[
                  styles.triButtonText,
                  adulterationStatus === 'NONE' && styles.triButtonTextSafeActive,
                ]}
              >
                No Adulteration ✓
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.triButton, adulterationStatus === 'YES' && styles.triButtonDangerActive]}
              onPress={() => setAdulterationStatus('YES')}
              testID="adulteration-yes-btn"
            >
              <Text
                style={[
                  styles.triButtonText,
                  adulterationStatus === 'YES' && styles.triButtonTextDangerActive,
                ]}
              >
                Adulteration Present ⚠️
              </Text>
            </TouchableOpacity>
          </View>

          {adulterationStatus === 'YES' && (
            <View style={styles.adulterationDetailsBox}>
              <AppInput
                testID="test-adulteration-detail-input"
                label="Adulterant Details / Findings"
                placeholder="e.g. Urea, starch, foreign silica (max 100 characters)"
                value={adulterationDetail}
                onChangeText={(text) => {
                  setAdulterationDetail(text);
                  if (errors.adulteration) setErrors((prev) => ({ ...prev, adulteration: undefined }));
                }}
                error={errors.adulteration}
                accessibilityLabel="Adulterant Details"
              />
            </View>
          )}
        </View>
      </AppCard>

      {/* ──────────────────────────────────────────────────────────
          4. Other Measurements
          ────────────────────────────────────────────────────────── */}
      <AppCard style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>4. Other Measurements</Text>
        <Text style={styles.sectionHint}>
          Fermentation pH level and qualitative mineral composition assessments.
        </Text>

        <View style={isWide ? styles.gridRow : styles.gridColLayout}>
          <View style={isWide ? styles.gridCol : styles.gridColFull}>
            <AppInput
              testID="test-ph-input"
              label="pH Level (0.0 - 14.0)"
              placeholder="e.g. 4.2"
              value={ph}
              onChangeText={(text) => {
                setPh(text);
                if (errors.ph) setErrors((prev) => ({ ...prev, ph: undefined }));
              }}
              error={errors.ph}
              keyboardType="decimal-pad"
              accessibilityLabel="Fermentation pH Level"
            />
          </View>
          <View style={isWide ? styles.gridCol : styles.gridColFull}>
            <AppInput
              testID="test-mineral-input"
              label="Mineral Status Assessment"
              placeholder="e.g. NORMAL, or specific mineral profile (max 100 chars)"
              value={mineralStatus}
              onChangeText={(text) => {
                setMineralStatus(text);
                if (errors.mineralStatus) setErrors((prev) => ({ ...prev, mineralStatus: undefined }));
              }}
              error={errors.mineralStatus}
              accessibilityLabel="Mineral Status Assessment"
            />
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={styles.chip}
                onPress={() => setMineralStatus('NORMAL')}
              >
                <Text style={styles.chipText}>+ Set &ldquo;NORMAL&rdquo;</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chip}
                onPress={() => setMineralStatus('ADEQUATE')}
              >
                <Text style={styles.chipText}>+ Set &ldquo;ADEQUATE&rdquo;</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </AppCard>

      {/* ──────────────────────────────────────────────────────────
          5. Additional Information
          ────────────────────────────────────────────────────────── */}
      <AppCard style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>5. Additional Information</Text>
        <Text style={styles.sectionHint}>
          Optional analytical confidence score supported by the backend model.
        </Text>

        <View style={isWide ? styles.gridRow : styles.gridColLayout}>
          <View style={isWide ? styles.gridCol : styles.gridColFull}>
            <AppInput
              testID="test-confidence-input"
              label="Confidence Score (0.0 - 1.0)"
              placeholder="e.g. 0.95"
              value={confidenceScore}
              onChangeText={(text) => {
                setConfidenceScore(text);
                if (errors.confidenceScore) setErrors((prev) => ({ ...prev, confidenceScore: undefined }));
              }}
              error={errors.confidenceScore}
              keyboardType="decimal-pad"
              accessibilityLabel="Analytical Confidence Score"
            />
          </View>
          <View style={[isWide ? styles.gridCol : styles.gridColFull, styles.fieldNoticeBox]}>
            <Text style={styles.fieldNoticeText}>
              ℹ️ Quality and risk evaluations are computed authoritatively by the Spring Boot assessment engine based on these measurements.
            </Text>
          </View>
        </View>
      </AppCard>

      {/* ──────────────────────────────────────────────────────────
          6. Submit
          ────────────────────────────────────────────────────────── */}
      <View style={styles.buttonSection}>
        <AppButton
          testID="test-submit-button"
          title={isSubmitting ? 'Saving Test Result...' : 'Save Test Result'}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.submitButton}
        />
        <AppButton
          testID="test-cancel-button"
          title="Cancel"
          variant="outline"
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
          style={styles.cancelButton}
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
  screenTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  sectionCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  lockedParentBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  lockedParentLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semibold,
  },
  lockedParentValue: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  typeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeButtonText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  typeButtonTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  noSamplesWarning: {
    fontSize: typography.fontSize.caption,
    color: colors.warning,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gridColLayout: {
    flexDirection: 'column',
    gap: spacing.xs,
  },
  gridCol: {
    flex: 1,
  },
  gridColFull: {
    width: '100%',
  },
  triControlSection: {
    marginBottom: spacing.md,
  },
  controlLabel: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  triButtonRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  triButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  triButtonNeutralActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  triButtonSafeActive: {
    borderColor: colors.success,
    backgroundColor: '#E8F5E9',
  },
  triButtonDangerActive: {
    borderColor: colors.error,
    backgroundColor: '#FFEBEE',
  },
  triButtonText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semibold,
  },
  triButtonTextNeutralActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  triButtonTextSafeActive: {
    color: colors.success,
    fontWeight: typography.fontWeight.bold,
  },
  triButtonTextDangerActive: {
    color: colors.error,
    fontWeight: typography.fontWeight.bold,
  },
  adulterationDetailsBox: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.fontSize.caption - 1,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  fieldNoticeBox: {
    justifyContent: 'center',
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  fieldNoticeText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  buttonSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  submitButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
});

export default AddTestResultScreen;

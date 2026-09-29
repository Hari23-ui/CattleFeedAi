import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AppButton,
  ErrorMessage,
  EvidenceSectionCard,
  EvidenceSourceBadge,
  QualityStatusBadge,
  ScreenContainer,
} from '../../components';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { EvidenceSummary } from '../../models/evidence';
import { QualityStatus } from '../../models/assessment';
import { RiskIndicatorDto } from '../../models/risk';
import { ScreenProps } from '../../navigation/types';
import { evidenceService } from '../../services/evidenceService';

export const EvidenceSummaryScreen: React.FC<ScreenProps<'EvidenceSummary'>> = ({
  route,
  navigation,
}) => {
  const { animalId, consultationId, title } = route.params || {};

  const [evidence, setEvidence] = useState<EvidenceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvidence = useCallback(async () => {
    try {
      setError(null);
      let data: EvidenceSummary;
      if (consultationId) {
        data = await evidenceService.getEvidenceForConsultation(consultationId);
      } else if (animalId) {
        data = await evidenceService.getEvidenceForAnimal(animalId);
      } else {
        setError('No animal or consultation specified for evidence review.');
        setLoading(false);
        return;
      }
      setEvidence(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (status === 403) {
        setError('Access denied: You are not authorized to view this evidence summary.');
      } else if (status === 404) {
        setError('The requested animal or consultation evidence could not be found.');
      } else {
        setError(err?.message || 'Failed to load evidence summary. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [animalId, consultationId]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvidence();
  };

  if (loading && !refreshing) {
    return (
      <ScreenContainer style={styles.centerContainer} testID="evidence-loading">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Aggregating evidence...</Text>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer style={styles.centerContainer} testID="evidence-error">
        <ErrorMessage message={error} />
        <AppButton
          title="Retry"
          onPress={() => {
            setLoading(true);
            fetchEvidence();
          }}
          style={styles.retryButton}
        />
      </ScreenContainer>
    );
  }

  if (!evidence) {
    return (
      <ScreenContainer style={styles.centerContainer} testID="evidence-empty">
        <Text style={styles.emptyText}>No evidence records available.</Text>
      </ScreenContainer>
    );
  }

  const {
    animal,
    consultation,
    feedEvidence = [],
    silageEvidence = [],
    testEvidence = [],
    qualityEvidence,
    riskEvidence,
    visualScreeningEvidence,
    healthScreeningEvidence,
    feedPlans = [],
    advisories = [],
    historicalSummary,
    disclaimer,
  } = evidence;

  return (
    <ScreenContainer scrollable={false} testID="evidence-summary-screen">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header / Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>
            {title || (consultation ? 'Consultation Evidence Review' : 'Animal Decision-Support Evidence')}
          </Text>
          <Text style={styles.bannerSubtitle}>
            Unified evidence connecting laboratory data, physical visual screening, and expert review.
          </Text>
        </View>

        {/* 1. CONSULTATION CONTEXT (if present) */}
        {consultation ? (
          <EvidenceSectionCard
            title={`Consultation #${consultation.id}: ${consultation.subject || 'Inquiry'}`}
            subtitle={`Status: ${consultation.status || 'PENDING'} • Requested: ${consultation.requestDate || 'Not Available'}`}
            source={consultation.evidenceSource || 'FARMER_RECORDED_INFORMATION'}
            testID="evidence-section-consultation"
          >
            <View style={styles.detailRow}>
              <Text style={styles.label}>Farmer Inquiry:</Text>
              <Text style={styles.value}>{consultation.question || 'Not Available'}</Text>
            </View>
            {consultation.additionalContext ? (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Additional Context:</Text>
                <Text style={styles.value}>{consultation.additionalContext}</Text>
              </View>
            ) : null}
            {consultation.expertName ? (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Assigned Professional:</Text>
                <Text style={styles.value}>
                  {consultation.expertName}
                  {consultation.expertSpecialization ? ` (${consultation.expertSpecialization})` : ''}
                </Text>
              </View>
            ) : null}
          </EvidenceSectionCard>
        ) : null}

        {/* 2. ANIMAL PROFILE */}
        <EvidenceSectionCard
          title={animal ? `Animal Profile: ${animal.name || animal.animalTag}` : 'Animal Profile'}
          subtitle={animal ? `Tag: ${animal.animalTag} • Breed: ${animal.breed || 'Not Available'}` : undefined}
          source="FARMER_RECORDED_INFORMATION"
          isEmpty={!animal}
          emptyMessage="No animal profile linked to this record."
          testID="evidence-section-animal"
        >
          {animal ? (
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Lactation Stage</Text>
                <Text style={styles.value}>{animal.lactationStage || 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Weight</Text>
                <Text style={styles.value}>{animal.weight ? `${animal.weight} kg` : 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Daily Milk Yield</Text>
                <Text style={styles.value}>
                  {animal.milkProductionPerDay ? `${animal.milkProductionPerDay} L/day` : 'Not Available'}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Pregnancy Status</Text>
                <Text style={styles.value}>{animal.pregnancyStatus || 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Feed Intake Status</Text>
                <Text style={styles.value}>{animal.feedIntakeStatus || 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Days in Milk</Text>
                <Text style={styles.value}>{animal.daysInMilk ?? 'Not Available'}</Text>
              </View>
            </View>
          ) : null}
        </EvidenceSectionCard>

        {/* 3. FEED & SILAGE INFORMATION */}
        <EvidenceSectionCard
          title="Feed & Silage Information"
          subtitle={`${feedEvidence.length} Feed Sample(s), ${silageEvidence.length} Silage Sample(s)`}
          source="RECORDED_DATA"
          isEmpty={feedEvidence.length === 0 && silageEvidence.length === 0}
          emptyMessage="No feed or silage sample records recorded for this animal."
          testID="evidence-section-feed"
        >
          {feedEvidence.map((feed) => (
            <TouchableOpacity
              key={`feed-${feed.feedSampleId}`}
              style={styles.sampleItem}
              onPress={() => navigation.navigate('FeedDetails', { sampleId: feed.feedSampleId })}
            >
              <View style={styles.sampleHeader}>
                <Text style={styles.sampleCode}>Feed: {feed.sampleCode}</Text>
                <Text style={styles.qualityTag}>{feed.latestQuality || 'Not Available'}</Text>
              </View>
              <Text style={styles.sampleSubtext}>
                Type: {feed.feedType || 'Not Available'} • Date: {feed.sampleDate || 'Not Available'}
              </Text>
              <Text style={styles.sampleSubtext}>
                Images: {feed.imageCount} attached • Source: {feed.source || 'Not Available'}
              </Text>
            </TouchableOpacity>
          ))}

          {silageEvidence.map((silage) => (
            <TouchableOpacity
              key={`silage-${silage.silageSampleId}`}
              style={styles.sampleItem}
              onPress={() => navigation.navigate('SilageDetails', { sampleId: silage.silageSampleId })}
            >
              <View style={styles.sampleHeader}>
                <Text style={styles.sampleCode}>Silage: {silage.sampleCode}</Text>
                <Text style={styles.qualityTag}>{silage.latestQuality || 'Not Available'}</Text>
              </View>
              <Text style={styles.sampleSubtext}>
                Type: {silage.silageType || 'Not Available'} • Date: {silage.sampleDate || 'Not Available'}
              </Text>
              <Text style={styles.sampleSubtext}>
                Images: {silage.imageCount} attached • Source: {silage.source || 'Not Available'}
              </Text>
            </TouchableOpacity>
          ))}
        </EvidenceSectionCard>

        {/* 4. LAB TEST RESULTS */}
        <EvidenceSectionCard
          title="Laboratory & Chemical Tests"
          subtitle={`${testEvidence.length} test result record(s)`}
          source="LABORATORY_DATA"
          isEmpty={testEvidence.length === 0}
          emptyMessage="No chemical laboratory test results recorded."
          testID="evidence-section-test"
        >
          {testEvidence.map((test) => (
            <TouchableOpacity
              key={`test-${test.testResultId}`}
              style={styles.testItem}
              onPress={() => navigation.navigate('TestResultDetails', { resultId: test.testResultId })}
            >
              <View style={styles.sampleHeader}>
                <Text style={styles.sampleCode}>
                  Test #{test.testResultId} ({test.sampleType})
                </Text>
                <EvidenceSourceBadge source={test.evidenceSource} />
              </View>
              <Text style={styles.sampleSubtext}>Date: {test.testDate || 'Not Available'}</Text>

              <View style={styles.paramGrid}>
                <Text style={styles.paramText}>
                  Crude Protein: {test.crudeProtein != null ? `${test.crudeProtein}%` : 'Not Available'}
                </Text>
                <Text style={styles.paramText}>
                  Moisture: {test.moisture != null ? `${test.moisture}%` : 'Not Available'}
                </Text>
                <Text style={styles.paramText}>
                  Fiber: {test.fiber != null ? `${test.fiber}%` : 'Not Available'}
                </Text>
                <Text style={styles.paramText}>
                  pH: {test.ph != null ? test.ph : 'Not Available'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </EvidenceSectionCard>

        {/* 5. QUALITY & RISK ASSESSMENT */}
        <EvidenceSectionCard
          title="Quality & Risk Evaluation"
          subtitle="Rule-based nutritional and risk screening"
          source="RULE_BASED_QUALITY_ASSESSMENT"
          statusBadge={
            qualityEvidence?.qualityStatus ? (
              <QualityStatusBadge status={qualityEvidence.qualityStatus as QualityStatus} />
            ) : null
          }
          isEmpty={!qualityEvidence && !riskEvidence}
          emptyMessage="No quality or risk assessments available for latest measurements."
          testID="evidence-section-quality-risk"
        >
          {qualityEvidence ? (
            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>Quality Assessment:</Text>
              <Text style={styles.bodyText}>
                Quality Status: <Text style={styles.boldText}>{qualityEvidence.qualityStatus || 'Not Available'}</Text>
              </Text>
              <Text style={styles.bodyText}>
                Triggered Rules: {qualityEvidence.triggeredRulesCount ?? 0}
              </Text>
              {qualityEvidence.explanation ? (
                <Text style={styles.bodyText}>{qualityEvidence.explanation}</Text>
              ) : null}
            </View>
          ) : null}

          {riskEvidence ? (
            <View style={styles.subSection}>
              <View style={styles.riskHeader}>
                <Text style={styles.subSectionTitle}>Risk Screening:</Text>
                <EvidenceSourceBadge source="RISK_SCREENING" />
              </View>
              <Text style={styles.bodyText}>
                Overall Risk Level: <Text style={styles.boldText}>{riskEvidence.overallRiskLevel || 'Not Available'}</Text>
              </Text>
              {riskEvidence.allRisks && riskEvidence.allRisks.length > 0 ? (
                <View style={styles.bulletList}>
                  {riskEvidence.allRisks.map((risk: RiskIndicatorDto, index: number) => (
                    <Text key={`risk-${index}`} style={styles.bulletItem}>
                      • [{risk.severity || 'RISK'}] {risk.riskTitle || risk.detectedParameter || 'Indicator'}: {risk.description || ''}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.safeText}>No immediate risk indicators triggered by baseline parameters.</Text>
              )}
            </View>
          ) : null}
        </EvidenceSectionCard>

        {/* 6. AI VISUAL SCREENING */}
        <EvidenceSectionCard
          title="AI Visual Screening"
          subtitle="Evaluates surface physical characteristics only (mould, spoilage, discoloration)"
          source={visualScreeningEvidence?.analysisSource || 'AI_VISUAL_SCREENING'}
          isEmpty={!visualScreeningEvidence || !visualScreeningEvidence.evidenceAvailable}
          emptyMessage="No visual screening analysis recorded. Visual screening is performed via camera capture."
          testID="evidence-section-visual"
        >
          {visualScreeningEvidence && visualScreeningEvidence.evidenceAvailable ? (
            <View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Analysis Source:</Text>
                <Text style={styles.value}>
                  {visualScreeningEvidence.analysisSource === 'ML_VISUAL_SCREENING'
                    ? `ML Visual Screening${visualScreeningEvidence.modelVersion ? ` (v${visualScreeningEvidence.modelVersion})` : ''}`
                    : 'Rule-Based Deterministic Visual Screening'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Visual Status:</Text>
                <Text style={[styles.value, styles.boldText]}>
                  {visualScreeningEvidence.visualStatus || 'Not Available'}
                </Text>
              </View>

              <View style={styles.paramGrid}>
                <Text style={styles.paramText}>
                  Surface Mould: {visualScreeningEvidence.mouldDetected ? '⚠️ Detected' : 'Not Detected'}
                </Text>
                <Text style={styles.paramText}>
                  Spoilage / Discoloration: {visualScreeningEvidence.spoilageDetected ? '⚠️ Detected' : 'Not Detected'}
                </Text>
                <Text style={styles.paramText}>
                  Foreign Material: {visualScreeningEvidence.foreignMaterialDetected ? '⚠️ Detected' : 'Not Detected'}
                </Text>
                <Text style={styles.paramText}>
                  Confidence: {visualScreeningEvidence.confidenceScore != null ? `${visualScreeningEvidence.confidenceScore}%` : 'Not Available'}
                </Text>
              </View>

              {visualScreeningEvidence.identifiedVisualRisks && visualScreeningEvidence.identifiedVisualRisks.length > 0 ? (
                <View style={styles.bulletList}>
                  {visualScreeningEvidence.identifiedVisualRisks.map((vr, i) => (
                    <Text key={`vr-${i}`} style={styles.bulletItem}>• {vr}</Text>
                  ))}
                </View>
              ) : null}

              {/* Surface-only disclaimer */}
              <View style={styles.microDisclaimerBox}>
                <Text style={styles.microDisclaimerText}>
                  {visualScreeningEvidence.disclaimer ||
                    'Physical surface characteristics only. Does not measure protein, moisture, fiber, minerals, or toxins.'}
                </Text>
              </View>
            </View>
          ) : null}
        </EvidenceSectionCard>

        {/* 7. ANIMAL HEALTH SCREENING */}
        <EvidenceSectionCard
          title="Animal Health Screening"
          subtitle="Non-diagnostic nutritional demand and observation correlation"
          source="ANIMAL_HEALTH_SCREENING"
          isEmpty={!healthScreeningEvidence}
          emptyMessage="No animal health risk screening records available."
          testID="evidence-section-health"
        >
          {healthScreeningEvidence ? (
            <View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Screening Status:</Text>
                <Text style={[styles.value, styles.boldText]}>
                  {healthScreeningEvidence.screeningStatus || 'Not Available'}
                </Text>
              </View>

              <Text style={styles.bodyText}>
                {healthScreeningEvidence.dietaryAndHealthSummary || 'No summary available.'}
              </Text>

              {healthScreeningEvidence.recommendationSummary ? (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Screening Recommendation:</Text>
                  <Text style={styles.value}>{healthScreeningEvidence.recommendationSummary}</Text>
                </View>
              ) : null}

              {healthScreeningEvidence.missingInformation && healthScreeningEvidence.missingInformation.length > 0 ? (
                <View style={styles.bulletList}>
                  <Text style={styles.subSectionTitle}>Missing Information:</Text>
                  {healthScreeningEvidence.missingInformation.map((item, idx) => (
                    <Text key={`miss-${idx}`} style={styles.bulletItem}>• {item}</Text>
                  ))}
                </View>
              ) : null}

              {animal ? (
                <AppButton
                  title="View Full Health Screening"
                  variant="outline"
                  onPress={() => navigation.navigate('AnimalHealthScreening', { animalId: animal.id })}
                  style={styles.inlineButton}
                />
              ) : null}
            </View>
          ) : null}
        </EvidenceSectionCard>

        {/* 8. ACTIVE / RECENT FEED PLANS */}
        <EvidenceSectionCard
          title="Feed Planning Records"
          subtitle={`${feedPlans.length} feed plan record(s)`}
          source="FARMER_RECORDED_INFORMATION"
          isEmpty={feedPlans.length === 0}
          emptyMessage="No feed plans created for this animal."
          testID="evidence-section-plans"
        >
          {feedPlans.map((plan) => (
            <TouchableOpacity
              key={`plan-${plan.id}`}
              style={styles.planItem}
              onPress={() => navigation.navigate('FeedPlanDetails', { planId: plan.id })}
            >
              <View style={styles.sampleHeader}>
                <Text style={styles.sampleCode}>{plan.planName}</Text>
                <Text style={styles.planStatusTag}>{plan.status || 'ACTIVE'}</Text>
              </View>
              <Text style={styles.sampleSubtext}>
                Quantity: {plan.plannedQuantity ? `${plan.plannedQuantity} kg` : 'Not Available'} • Frequency: {plan.frequency || 'Not Available'}
              </Text>
            </TouchableOpacity>
          ))}
        </EvidenceSectionCard>

        {/* 9. RECENT ADVISORIES */}
        <EvidenceSectionCard
          title="Recent Advisories"
          subtitle={`${advisories.length} advisory notification(s)`}
          source="RULE_BASED_QUALITY_ASSESSMENT"
          isEmpty={advisories.length === 0}
          emptyMessage="No active advisories generated for this animal."
          testID="evidence-section-advisories"
        >
          {advisories.map((advisory) => (
            <TouchableOpacity
              key={`adv-${advisory.id ?? Math.random()}`}
              style={styles.advisoryItem}
              onPress={() => {
                if (advisory.id != null) {
                  navigation.navigate('AdvisoryDetails', { advisoryId: advisory.id });
                }
              }}
            >
              <Text style={styles.advisoryTitle}>{advisory.title}</Text>
              <Text style={styles.advisoryMessage} numberOfLines={2}>
                {advisory.message}
              </Text>
              <Text style={styles.sampleSubtext}>
                Priority: {advisory.priority || 'MEDIUM'} • Category: {advisory.category || 'NUTRITION'}
              </Text>
            </TouchableOpacity>
          ))}
        </EvidenceSectionCard>

        {/* 10. HISTORICAL SUMMARY */}
        <EvidenceSectionCard
          title="Historical Analytics Summary"
          subtitle="Non-causal historical test trends"
          source="HISTORICAL_ANALYTICS"
          isEmpty={!historicalSummary || historicalSummary.totalTestResults === 0}
          emptyMessage="No historical test records found."
          testID="evidence-section-historical"
        >
          {historicalSummary ? (
            <View>
              <View style={styles.analyticsStatsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{historicalSummary.totalTestResults ?? 0}</Text>
                  <Text style={styles.statLabel}>Total Tests</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{historicalSummary.totalFeedTests ?? 0}</Text>
                  <Text style={styles.statLabel}>Feed Tests</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{historicalSummary.totalSilageTests ?? 0}</Text>
                  <Text style={styles.statLabel}>Silage Tests</Text>
                </View>
              </View>

              <Text style={styles.bodyText}>
                {historicalSummary.descriptiveSummary || 'No descriptive trends available.'}
              </Text>

              {animal ? (
                <AppButton
                  title="View Historical Analytics"
                  variant="outline"
                  onPress={() => navigation.navigate('AnimalAnalytics', { animalId: animal.id, animalTag: animal.animalTag })}
                  style={styles.inlineButton}
                />
              ) : null}
            </View>
          ) : null}
        </EvidenceSectionCard>

        {/* 11. EXPERT RESPONSE (if consultation context) */}
        {consultation && consultation.expertRecommendation ? (
          <EvidenceSectionCard
            title="Professional Expert Response"
            subtitle={`Responded by: ${consultation.expertName || 'Veterinarian / Animal Nutrition Expert'}`}
            source="EXPERT_RESPONSE"
            testID="evidence-section-expert-response"
          >
            <View style={styles.expertResponseBox}>
              <Text style={styles.expertResponseTitle}>Professional Recommendation:</Text>
              <Text style={styles.expertResponseText}>{consultation.expertRecommendation}</Text>
              {consultation.expertNotes ? (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Clinical / Observational Notes:</Text>
                  <Text style={styles.value}>{consultation.expertNotes}</Text>
                </View>
              ) : null}
            </View>
          </EvidenceSectionCard>
        ) : null}

        {/* Action Button for Experts reviewing an active consultation */}
        {consultation && (consultation.status === 'REQUESTED' || consultation.status === 'IN_PROGRESS') ? (
          <AppButton
            title="Respond to Consultation"
            onPress={() =>
              navigation.navigate('ExpertResponse', {
                consultationId: consultation.id,
                subject: consultation.subject,
              })
            }
            style={styles.actionButton}
          />
        ) : null}

        {/* MANDATORY SCIENTIFIC DISCLAIMER */}
        <View style={styles.disclaimerContainer} testID="evidence-disclaimer">
          <Text style={styles.disclaimerTitle}>Scientific Decision Support Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            {disclaimer ||
              'This evidence summary combines available recorded, laboratory, screening, and historical information for decision support. AI visual screening evaluates image characteristics only and does not measure chemical composition or provide veterinary diagnosis. Professional interpretation should be obtained from a qualified Veterinarian or Veterinary Nutritionist.'}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
  },
  banner: {
    backgroundColor: '#1E3A8A',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerTitle: {
    fontSize: typography.fontSize.title,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  bannerSubtitle: {
    fontSize: typography.fontSize.caption,
    color: '#E0E7FF',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    padding: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: '#F8F9FA',
    borderRadius: borderRadius.sm,
  },
  label: {
    fontSize: typography.fontSize.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  value: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.textPrimary,
    marginTop: 2,
  },
  detailRow: {
    marginVertical: 4,
  },
  sampleItem: {
    padding: spacing.sm,
    backgroundColor: '#F8F9FA',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sampleCode: {
    fontSize: typography.fontSize.body,
    fontWeight: '700',
    color: colors.primary,
  },
  qualityTag: {
    fontSize: typography.fontSize.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sampleSubtext: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  testItem: {
    padding: spacing.sm,
    backgroundColor: '#F0F9FF',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  paramGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  paramText: {
    fontSize: typography.fontSize.caption,
    width: '50%',
    color: colors.textPrimary,
    marginVertical: 2,
  },
  subSection: {
    marginVertical: spacing.xs,
  },
  subSectionTitle: {
    fontSize: typography.fontSize.small,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bodyText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    marginVertical: 2,
  },
  boldText: {
    fontWeight: '700',
  },
  safeText: {
    fontSize: typography.fontSize.caption,
    color: '#2E7D32',
    fontStyle: 'italic',
  },
  bulletList: {
    marginTop: spacing.xs,
  },
  bulletItem: {
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
    marginVertical: 2,
  },
  microDisclaimerBox: {
    marginTop: spacing.sm,
    padding: spacing.xs,
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.xs,
  },
  microDisclaimerText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  planItem: {
    padding: spacing.sm,
    backgroundColor: '#F0FDF4',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  planStatusTag: {
    fontSize: typography.fontSize.caption,
    fontWeight: '700',
    color: '#15803D',
  },
  advisoryItem: {
    padding: spacing.sm,
    backgroundColor: '#FFFBEB',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  advisoryTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '700',
    color: '#92400E',
  },
  advisoryMessage: {
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
    marginVertical: 2,
  },
  analyticsStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xs,
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.sm,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNumber: {
    fontSize: typography.fontSize.title,
    color: colors.primary,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  expertResponseBox: {
    padding: spacing.sm,
    backgroundColor: '#EEF2FF',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  expertResponseTitle: {
    fontSize: typography.fontSize.small,
    fontWeight: '700',
    color: '#3730A3',
    marginBottom: 4,
  },
  expertResponseText: {
    fontSize: typography.fontSize.body,
    color: '#1E1B4B',
    lineHeight: 20,
  },
  inlineButton: {
    marginTop: spacing.sm,
  },
  actionButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  disclaimerContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: spacing.md,
    marginTop: spacing.md,
  },
  disclaimerTitle: {
    fontSize: typography.fontSize.caption,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#64748B',
  },
});

export default EvidenceSummaryScreen;

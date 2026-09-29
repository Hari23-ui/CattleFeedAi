import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { ErrorMessage } from '../../components/ErrorMessage';
import { consultationService } from '../../services/consultationService';
import { ConsultationResponse } from '../../models/consultation';

export const ExpertConsultationReviewScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'ExpertConsultationReview'>['route']>();
  const consultationId = route.params.consultationId;

  const [consultation, setConsultation] = useState<ConsultationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await consultationService.getConsultationById(consultationId);
      setConsultation(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load consultation details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [consultationId]);

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      const updated = await consultationService.acceptConsultation(consultationId);
      setConsultation(updated);
    } catch (err: any) {
      setError(err?.message || 'Failed to accept consultation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartReview = async () => {
    try {
      setActionLoading(true);
      const updated = await consultationService.startReview(consultationId);
      setConsultation(updated);
    } catch (err: any) {
      setError(err?.message || 'Failed to move to review.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    Alert.alert(
      'Complete Consultation',
      'Confirm that professional advisory is finalized and mark this consultation as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              setActionLoading(true);
              const updated = await consultationService.completeConsultation(consultationId);
              setConsultation(updated);
            } catch (err: any) {
              setError(err?.message || 'Failed to complete consultation.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      </ScreenContainer>
    );
  }

  if (!consultation) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Consultation not found.</Text>
          <AppButton title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

        {/* Safety Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            This system provides decision support and does not replace professional veterinary diagnosis or treatment.
          </Text>
        </View>

        {/* Status Header */}
        <AppCard style={styles.headerCard}>
          <View style={styles.statusRow}>
            <Text style={styles.subjectText}>{consultation.subject}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{consultation.status.replace('_', ' ')}</Text>
            </View>
          </View>
          <Text style={styles.subtext}>
            Farmer: {consultation.farmerName || 'Not Available'} ({consultation.farmerEmail || 'Not Available'})
          </Text>
          <Text style={styles.subtext}>
            Requested Date: {consultation.requestDate || 'Not Available'}
          </Text>
        </AppCard>

        {/* Action Controls for Expert */}
        <View style={styles.actionSection}>
          {/* M12: View Full Integrated Decision-Support Evidence */}
          <AppButton
            testID="expert-view-evidence-summary-button"
            title="🔬 View Unified Decision-Support Evidence →"
            variant="secondary"
            onPress={() =>
              navigation.navigate('EvidenceSummary', {
                consultationId: consultation.id,
                title: `Evidence Review: Consultation #${consultation.id}`,
              })
            }
            style={{ marginBottom: spacing.sm }}
          />

          {consultation.status === 'REQUESTED' && (
            <AppButton
              title={actionLoading ? 'Accepting...' : 'Accept Consultation'}
              onPress={handleAccept}
              disabled={actionLoading}
            />
          )}

          {consultation.status === 'ACCEPTED' && (
            <AppButton
              title={actionLoading ? 'Starting...' : 'Start Review (Move to In-Review)'}
              onPress={handleStartReview}
              disabled={actionLoading}
            />
          )}

          {consultation.status === 'IN_REVIEW' && (
            <AppButton
              title="Provide Expert Recommendation"
              onPress={() =>
                navigation.navigate('ExpertResponse', {
                  consultationId: consultation.id,
                  subject: consultation.subject,
                })
              }
            />
          )}

          {consultation.status === 'RESPONDED' && (
            <View style={{ gap: spacing.sm }}>
              <AppButton
                title={actionLoading ? 'Completing...' : 'Mark Consultation Completed'}
                onPress={handleComplete}
                disabled={actionLoading}
              />
              <AppButton
                title="Edit Recommendation"
                variant="outline"
                onPress={() =>
                  navigation.navigate('ExpertResponse', {
                    consultationId: consultation.id,
                    subject: consultation.subject,
                  })
                }
              />
            </View>
          )}

          {consultation.status === 'COMPLETED' && (
            <View style={styles.completedBanner}>
              <Text style={styles.completedText}>
                Consultation Completed on {consultation.completedAt?.substring(0, 10) || 'Record'}
              </Text>
            </View>
          )}
        </View>

        {/* Farmer's Inquiry */}
        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Farmer Concern</Text>
          <Text style={styles.label}>Question / Observation:</Text>
          <Text style={styles.body}>{consultation.question}</Text>

          {consultation.additionalContext && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={styles.label}>Additional Context:</Text>
              <Text style={styles.body}>{consultation.additionalContext}</Text>
            </View>
          )}
        </AppCard>

        {/* Animal Details */}
        {consultation.animal && (
          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Animal Profile</Text>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Tag:</Text>
                <Text style={styles.value}>{consultation.animal.animalTag || 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Breed / Species:</Text>
                <Text style={styles.value}>
                  {consultation.animal.breed || 'Not Available'} ({consultation.animal.species || 'Cattle'})
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Gender:</Text>
                <Text style={styles.value}>{consultation.animal.gender || 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Age:</Text>
                <Text style={styles.value}>{consultation.animal.age || 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Lactation Stage:</Text>
                <Text style={styles.value}>{consultation.animal.lactationStage || 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Days in Milk:</Text>
                <Text style={styles.value}>
                  {consultation.animal.daysInMilk !== null && consultation.animal.daysInMilk !== undefined
                    ? `${consultation.animal.daysInMilk} days`
                    : 'Not Available'}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Milk Yield:</Text>
                <Text style={styles.value}>
                  {consultation.animal.milkProductionPerDay !== null && consultation.animal.milkProductionPerDay !== undefined
                    ? `${consultation.animal.milkProductionPerDay} L/day`
                    : 'Not Available'}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Pregnancy:</Text>
                <Text style={styles.value}>{consultation.animal.pregnancyStatus || 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Feed Intake:</Text>
                <Text style={styles.value}>{consultation.animal.feedIntakeStatus || 'Not Available'}</Text>
              </View>
            </View>

            {/* Health Risks */}
            {consultation.healthRisks && consultation.healthRisks.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={styles.subSectionTitle}>Recorded Health Risks</Text>
                {consultation.healthRisks.map((hr) => (
                  <View key={hr.id} style={styles.nestedCard}>
                    <Text style={styles.nestedCardTitle}>
                      {hr.riskType} [{hr.riskLevel}]
                    </Text>
                    <Text style={styles.body}>{hr.description || 'Not Available'}</Text>
                    {hr.recommendation && (
                      <Text style={[styles.subtext, { marginTop: 2 }]}>
                        Rec: {hr.recommendation}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Advisories */}
            {consultation.advisories && consultation.advisories.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={styles.subSectionTitle}>Active Herd Advisories</Text>
                {consultation.advisories.map((adv) => (
                  <View key={adv.id} style={styles.nestedCard}>
                    <Text style={styles.nestedCardTitle}>{adv.title}</Text>
                    <Text style={styles.body}>{adv.message}</Text>
                  </View>
                ))}
              </View>
            )}
          </AppCard>
        )}

        {/* Feed Sample Details */}
        {consultation.feedSample && (
          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Feed Sample Analysis</Text>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Sample Code:</Text>
                <Text style={styles.value}>{consultation.feedSample.sampleCode || 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Feed Type:</Text>
                <Text style={styles.value}>{consultation.feedSample.feedType || 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Source:</Text>
                <Text style={styles.value}>{consultation.feedSample.source || 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Sample Date:</Text>
                <Text style={styles.value}>{consultation.feedSample.sampleDate || 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Quality Assessment:</Text>
                <Text style={styles.value}>{consultation.feedSample.latestQuality || 'Not Available'}</Text>
              </View>
            </View>

            {/* Test Results */}
            {consultation.feedSample.testResults && consultation.feedSample.testResults.length > 0 && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={styles.subSectionTitle}>Laboratory Test Results</Text>
                {consultation.feedSample.testResults.map((tr) => (
                  <View key={tr.id} style={styles.nestedCard}>
                    <Text style={styles.nestedCardTitle}>
                      Test Date: {tr.testDate} | Quality: {tr.overallQuality || 'Not Available'}
                    </Text>
                    <Text style={styles.body}>
                      Moisture: {tr.moisture !== undefined ? `${tr.moisture}%` : 'Not Available'},{' '}
                      Crude Protein: {tr.crudeProtein !== undefined ? `${tr.crudeProtein}%` : 'Not Available'},{' '}
                      Fiber: {tr.fiber !== undefined ? `${tr.fiber}%` : 'Not Available'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Images */}
            {consultation.feedSample.images && consultation.feedSample.images.length > 0 && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={styles.subSectionTitle}>Attached Sample Images</Text>
                <Text style={styles.subtext}>
                  {consultation.feedSample.images.length} image attachment(s) available on record.
                </Text>
              </View>
            )}
          </AppCard>
        )}

        {/* Silage Sample Details */}
        {consultation.silageSample && (
          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Silage Sample Analysis</Text>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Sample Code:</Text>
                <Text style={styles.value}>{consultation.silageSample.sampleCode || 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Silage Type:</Text>
                <Text style={styles.value}>{consultation.silageSample.silageType || 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Source:</Text>
                <Text style={styles.value}>{consultation.silageSample.source || 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Sample Date:</Text>
                <Text style={styles.value}>{consultation.silageSample.sampleDate || 'Not Available'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Quality Assessment:</Text>
                <Text style={styles.value}>{consultation.silageSample.latestQuality || 'Not Available'}</Text>
              </View>
            </View>

            {/* Test Results */}
            {consultation.silageSample.testResults && consultation.silageSample.testResults.length > 0 && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={styles.subSectionTitle}>Laboratory Test Results</Text>
                {consultation.silageSample.testResults.map((tr) => (
                  <View key={tr.id} style={styles.nestedCard}>
                    <Text style={styles.nestedCardTitle}>
                      Test Date: {tr.testDate} | Quality: {tr.overallQuality || 'Not Available'}
                    </Text>
                    <Text style={styles.body}>
                      pH: {tr.ph !== undefined ? tr.ph : 'Not Available'},{' '}
                      Moisture: {tr.moisture !== undefined ? `${tr.moisture}%` : 'Not Available'},{' '}
                      Crude Protein: {tr.crudeProtein !== undefined ? `${tr.crudeProtein}%` : 'Not Available'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </AppCard>
        )}

        {/* Existing Expert Response if any */}
        {consultation.expertRecommendation && (
          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Submitted Expert Advisory</Text>
            <View style={styles.recommendationBox}>
              <Text style={styles.recommendationText}>{consultation.expertRecommendation}</Text>
            </View>
            {consultation.expertNotes && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={styles.label}>Advisory Notes:</Text>
                <Text style={styles.body}>{consultation.expertNotes}</Text>
              </View>
            )}
          </AppCard>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  disclaimerBox: {
    backgroundColor: '#FFFBEA',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 16,
  },
  headerCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  subjectText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  subtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionSection: {
    marginVertical: spacing.sm,
  },
  completedBanner: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  completedText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 4,
    marginBottom: spacing.xs,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  value: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
    marginTop: 1,
  },
  body: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%',
    marginVertical: 4,
  },
  nestedCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nestedCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recommendationBox: {
    backgroundColor: colors.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  recommendationText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  centerContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: spacing.md,
  },
});

export default ExpertConsultationReviewScreen;

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
import { useAuth } from '../../hooks/useAuth';

export const ConsultationDetailsScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'ConsultationDetails'>['route']>();
  const consultationId = route.params.consultationId;
  const { user } = useAuth();
  const isFarmer = user?.role === 'FARMER';

  const [consultation, setConsultation] = useState<ConsultationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
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

  const handleCancel = () => {
    Alert.alert(
      'Cancel Consultation',
      'Are you sure you want to cancel this consultation request?',
      [
        { text: 'Keep Consultation', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              const updated = await consultationService.cancelConsultation(consultationId);
              setConsultation(updated);
            } catch (err: any) {
              setError(err?.message || 'Failed to cancel consultation.');
            } finally {
              setCancelling(false);
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
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Consultation Not Found</Text>
          <AppButton title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </ScreenContainer>
    );
  }

  const isEligibleForCancel =
    isFarmer &&
    (consultation.status === 'REQUESTED' || consultation.status === 'ACCEPTED');

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

        {/* Disclaimer Notice */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            This system provides decision support and does not replace professional veterinary diagnosis or treatment.
          </Text>
        </View>

        {/* Header Card */}
        <AppCard style={styles.headerCard}>
          <View style={styles.statusRow}>
            <Text style={styles.subjectText}>{consultation.subject}</Text>
            <View style={[styles.statusBadge, getStatusStyle(consultation.status)]}>
              <Text style={styles.statusText}>{consultation.status.replace('_', ' ')}</Text>
            </View>
          </View>
          <Text style={styles.dateText}>
            Requested on: {consultation.requestDate || consultation.createdAt?.substring(0, 10)}
          </Text>
          {consultation.completedAt && (
            <Text style={styles.completedDateText}>
              Completed on: {consultation.completedAt.replace('T', ' ').substring(0, 16)}
            </Text>
          )}

          {/* Unified Decision-Support Evidence Action (M12) */}
          <AppButton
            testID="view-evidence-summary-button"
            title="🔬 View Unified Decision-Support Evidence →"
            onPress={() =>
              navigation.navigate('EvidenceSummary', {
                consultationId: consultation.id,
                title: `Evidence: Consultation #${consultation.id}`,
              })
            }
            style={{ marginTop: spacing.md }}
          />
        </AppCard>

        {/* Farmer Inquiry Section */}
        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Farmer Inquiry</Text>
          <Text style={styles.fieldLabel}>Question / Concern:</Text>
          <Text style={styles.bodyText}>{consultation.question}</Text>

          {consultation.additionalContext && (
            <>
              <Text style={[styles.fieldLabel, { marginTop: spacing.sm }]}>Additional Context:</Text>
              <Text style={styles.bodyText}>{consultation.additionalContext}</Text>
            </>
          )}
        </AppCard>

        {/* Linked Entity Summary Card */}
        {(consultation.animalTag || consultation.feedSampleCode || consultation.silageSampleCode) && (
          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Linked Information</Text>

            {consultation.animal && (
              <View style={styles.linkedRow}>
                <Text style={styles.linkedTitle}>Animal:</Text>
                <Text style={styles.linkedValue}>
                  {consultation.animal.animalTag} ({consultation.animal.breed || 'Breed Not Available'}),{' '}
                  Lactation: {consultation.animal.lactationStage || 'Not Available'},{' '}
                  Yield: {consultation.animal.milkProductionPerDay ? `${consultation.animal.milkProductionPerDay} L/day` : 'Not Available'}
                </Text>
              </View>
            )}

            {consultation.feedSample && (
              <View style={styles.linkedRow}>
                <Text style={styles.linkedTitle}>Feed Sample:</Text>
                <Text style={styles.linkedValue}>
                  {consultation.feedSample.sampleCode} ({consultation.feedSample.feedType || 'Type Not Available'}),{' '}
                  Quality: {consultation.feedSample.latestQuality || 'Not Available'}
                </Text>
              </View>
            )}

            {consultation.silageSample && (
              <View style={styles.linkedRow}>
                <Text style={styles.linkedTitle}>Silage Sample:</Text>
                <Text style={styles.linkedValue}>
                  {consultation.silageSample.sampleCode} ({consultation.silageSample.silageType || 'Type Not Available'}),{' '}
                  Quality: {consultation.silageSample.latestQuality || 'Not Available'}
                </Text>
              </View>
            )}
          </AppCard>
        )}

        {/* Expert Information Card */}
        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Assigned Expert</Text>
          {consultation.expertName ? (
            <View>
              <Text style={styles.expertName}>{consultation.expertName}</Text>
              <Text style={styles.expertRole}>
                {consultation.expertSpecialization
                  ? consultation.expertSpecialization.replace('_', ' ')
                  : 'Veterinarian / Animal Nutrition Expert'}
              </Text>
              {consultation.expertQualification && (
                <Text style={styles.expertSubtext}>{consultation.expertQualification}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.pendingText}>Expert assignment pending.</Text>
          )}
        </AppCard>

        {/* Expert Response Section */}
        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Expert Recommendation</Text>
          {consultation.expertRecommendation ? (
            <View>
              <View style={styles.recommendationBox}>
                <Text style={styles.recommendationText}>{consultation.expertRecommendation}</Text>
              </View>

              {consultation.expertNotes && (
                <View style={{ marginTop: spacing.md }}>
                  <Text style={styles.fieldLabel}>Expert Advisory Notes:</Text>
                  <Text style={styles.notesText}>{consultation.expertNotes}</Text>
                </View>
              )}

              {consultation.responseDate && (
                <Text style={styles.responseDateText}>
                  Responded on: {consultation.responseDate}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.pendingText}>Expert response pending.</Text>
          )}
        </AppCard>

        {/* Cancel Button for Farmer */}
        {isEligibleForCancel && (
          <AppButton
            title={cancelling ? 'Cancelling...' : 'Cancel Consultation'}
            onPress={handleCancel}
            disabled={cancelling}
            variant="outline"
            style={{ marginTop: spacing.md, marginBottom: spacing.xl, borderColor: colors.error }}
            textStyle={{ color: colors.error }}
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'REQUESTED':
      return { backgroundColor: colors.accentLight, borderColor: colors.accent };
    case 'ACCEPTED':
    case 'IN_REVIEW':
      return { backgroundColor: colors.infoLight, borderColor: colors.info };
    case 'RESPONDED':
    case 'COMPLETED':
      return { backgroundColor: colors.primaryLight, borderColor: colors.primary };
    default:
      return { backgroundColor: colors.border, borderColor: colors.border };
  }
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
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  completedDateText: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  linkedRow: {
    marginVertical: 4,
  },
  linkedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  linkedValue: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  expertName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  expertRole: {
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  expertSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recommendationBox: {
    backgroundColor: colors.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  recommendationText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    fontWeight: '500',
  },
  notesText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  responseDateText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'right',
  },
  pendingText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
  errorContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 16,
    color: colors.error,
    marginBottom: spacing.md,
  },
});

export default ConsultationDetailsScreen;

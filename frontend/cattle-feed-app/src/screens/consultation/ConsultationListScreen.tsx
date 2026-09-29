import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AppNavigationProp } from '../../navigation/types';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { ErrorMessage } from '../../components/ErrorMessage';
import { consultationService } from '../../services/consultationService';
import { ConsultationResponse, ConsultationStatus } from '../../models/consultation';
import { useAuth } from '../../hooks/useAuth';

export const ConsultationListScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const { user } = useAuth();
  const isExpert = user?.role === 'EXPERT';

  const [consultations, setConsultations] = useState<ConsultationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConsultations = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await consultationService.getConsultations();
      setConsultations(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load consultations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConsultations();
    }, [])
  );

  const getStatusColor = (status: ConsultationStatus) => {
    switch (status) {
      case 'REQUESTED':
        return colors.accent;
      case 'ACCEPTED':
      case 'IN_REVIEW':
        return colors.info;
      case 'RESPONDED':
      case 'COMPLETED':
        return colors.primary;
      case 'CANCELLED':
      case 'CLOSED':
        return colors.textMuted;
      default:
        return colors.textSecondary;
    }
  };

  const handleItemPress = (item: ConsultationResponse) => {
    if (isExpert) {
      navigation.navigate('ExpertConsultationReview', { consultationId: item.id });
    } else {
      navigation.navigate('ConsultationDetails', { consultationId: item.id });
    }
  };

  const renderItem = ({ item }: { item: ConsultationResponse }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity onPress={() => handleItemPress(item)} activeOpacity={0.8}>
        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.subjectText} numberOfLines={1}>
              {item.subject}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {item.status.replace('_', ' ')}
              </Text>
            </View>
          </View>

          <Text style={styles.questionText} numberOfLines={2}>
            {item.question}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.dateText}>
              {item.requestDate ? `Date: ${item.requestDate}` : ''}
            </Text>

            {item.expertName && (
              <Text style={styles.expertText}>
                Expert: {item.expertName}
              </Text>
            )}
          </View>

          {/* Related Tags */}
          <View style={styles.tagRow}>
            {item.animalTag && (
              <View style={styles.referenceTag}>
                <Text style={styles.referenceTagText}>Animal: {item.animalTag}</Text>
              </View>
            )}
            {item.feedSampleCode && (
              <View style={styles.referenceTag}>
                <Text style={styles.referenceTagText}>Feed: {item.feedSampleCode}</Text>
              </View>
            )}
            {item.silageSampleCode && (
              <View style={styles.referenceTag}>
                <Text style={styles.referenceTagText}>Silage: {item.silageSampleCode}</Text>
              </View>
            )}
          </View>

          {item.expertRecommendation && (
            <View style={styles.responsePreview}>
              <Text style={styles.responsePreviewLabel}>Recommendation Preview:</Text>
              <Text style={styles.responsePreviewText} numberOfLines={2}>
                {item.expertRecommendation}
              </Text>
            </View>
          )}
        </AppCard>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Banner */}
        <View style={styles.banner}>
          <View>
            <Text style={styles.bannerTitle}>
              {isExpert ? 'Consultation Requests' : 'Expert Consultations'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {isExpert
                ? 'Review farmer requests & provide professional guidance'
                : 'Direct professional advisory from certified veterinarians'}
            </Text>
          </View>
          {!isExpert && (
            <AppButton
              title="+ Request"
              onPress={() => navigation.navigate('RequestConsultation')}
              variant="primary"
              size="small"
            />
          )}
        </View>

        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <FlatList
            data={consultations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchConsultations(true)}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No Consultations Found</Text>
                <Text style={styles.emptySubtitle}>
                  {isExpert
                    ? 'There are currently no assigned or open consultation requests.'
                    : 'You have not submitted any consultation requests yet.'}
                </Text>
                {!isExpert && (
                  <AppButton
                    title="Request Consultation"
                    onPress={() => navigation.navigate('RequestConsultation')}
                    style={{ marginTop: spacing.md }}
                  />
                )}
              </View>
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 240,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  expertText: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  referenceTag: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
    marginTop: 4,
  },
  referenceTagText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  responsePreview: {
    backgroundColor: colors.primaryLight + '50',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    marginTop: spacing.sm,
  },
  responsePreviewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 2,
  },
  responsePreviewText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default ConsultationListScreen;

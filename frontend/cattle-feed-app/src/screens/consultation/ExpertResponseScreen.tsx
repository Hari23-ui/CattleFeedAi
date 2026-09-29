import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { ErrorMessage } from '../../components/ErrorMessage';
import { consultationService } from '../../services/consultationService';

export const ExpertResponseScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'ExpertResponse'>['route']>();
  const { consultationId, subject } = route.params;

  const [recommendation, setRecommendation] = useState('');
  const [expertNotes, setExpertNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!recommendation.trim()) {
      setError('Please provide a professional recommendation.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await consultationService.respondConsultation(consultationId, {
        recommendation: recommendation.trim(),
        expertNotes: expertNotes.trim() ? expertNotes.trim() : undefined,
      });

      navigation.replace('ExpertConsultationReview', { consultationId });
    } catch (err: any) {
      setError(err?.message || 'Failed to submit expert recommendation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Safety Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>Professional Advisory Guidance</Text>
          <Text style={styles.disclaimerText}>
            This system provides decision support and does not replace professional veterinary diagnosis or treatment.
            Please formulate actionable nutritional and animal health management guidance.
          </Text>
        </View>

        {subject && (
          <View style={styles.subjectBox}>
            <Text style={styles.subjectLabel}>Consultation Subject:</Text>
            <Text style={styles.subjectText}>{subject}</Text>
          </View>
        )}

        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

        {/* Expert Recommendation */}
        <AppInput
          label="Professional Recommendation *"
          placeholder="State your clear, actionable nutritional or veterinary advisory recommendation for the farmer..."
          value={recommendation}
          onChangeText={setRecommendation}
          multiline
          numberOfLines={6}
        />

        {/* Expert Notes */}
        <AppInput
          label="Expert Internal / Advisory Notes (Optional)"
          placeholder="Add any monitoring instructions, follow-up timelines, or dosage guidance notes..."
          value={expertNotes}
          onChangeText={setExpertNotes}
          multiline
          numberOfLines={4}
        />

        {/* Submit Button */}
        <AppButton
          title={submitting ? 'Submitting Recommendation...' : 'Submit Expert Recommendation'}
          onPress={handleSubmit}
          disabled={submitting}
          style={{ marginTop: spacing.lg }}
        />
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
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  subjectBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  subjectLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
});

export default ExpertResponseScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { ErrorMessage } from '../../components/ErrorMessage';
import { consultationService } from '../../services/consultationService';
import { animalService } from '../../services/animalService';
import { feedService } from '../../services/feedService';
import { silageService } from '../../services/silageService';
import { Animal } from '../../models/animal';
import { FeedSample } from '../../models/feed';
import { SilageSample } from '../../models/silage';

export const RequestConsultationScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'RequestConsultation'>['route']>();

  const initialAnimalId = route.params?.animalId;
  const initialFeedId = route.params?.feedSampleId;
  const initialSilageId = route.params?.silageSampleId;

  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  const [selectedAnimalId, setSelectedAnimalId] = useState<number | undefined>(initialAnimalId);
  const [selectedFeedId, setSelectedFeedId] = useState<number | undefined>(initialFeedId);
  const [selectedSilageId, setSelectedSilageId] = useState<number | undefined>(initialSilageId);

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [feedSamples, setFeedSamples] = useState<FeedSample[]>([]);
  const [silageSamples, setSilageSamples] = useState<SilageSample[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const [animalList, feedList, silageList] = await Promise.all([
        animalService.getAllAnimals().catch(() => [] as Animal[]),
        feedService.getAllFeedSamples().catch(() => [] as FeedSample[]),
        silageService.getAllSilageSamples().catch(() => [] as SilageSample[]),
      ]);
      setAnimals(animalList);
      setFeedSamples(feedList);
      setSilageSamples(silageList);
    } catch {
      // Non-fatal if options fail to load; farmer can still submit general inquiry
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSubmit = async () => {
    if (!subject.trim()) {
      setError('Please provide a subject for the consultation.');
      return;
    }
    if (!question.trim()) {
      setError('Please enter your question or concern for the expert.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await consultationService.createConsultation({
        subject: subject.trim(),
        question: question.trim(),
        additionalContext: additionalContext.trim() ? additionalContext.trim() : undefined,
        animalId: selectedAnimalId,
        feedSampleId: selectedFeedId,
        silageSampleId: selectedSilageId,
      });

      navigation.replace('ConsultationDetails', { consultationId: res.id });
    } catch (err: any) {
      setError(err?.message || 'Failed to submit consultation request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header Notice */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>Professional Advisory Support</Text>
          <Text style={styles.disclaimerText}>
            Connect with certified veterinarians and animal nutritionists. This system provides
            decision support and does not replace professional veterinary diagnosis or treatment.
          </Text>
        </View>

        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

        {/* Consultation Subject */}
        <AppInput
          label="Subject *"
          placeholder="e.g. Reduced feed intake / Silage quality concern"
          value={subject}
          onChangeText={setSubject}
        />

        {/* Farmer Question */}
        <AppInput
          label="Question / Concern *"
          placeholder="Describe your observation, changes in animal behavior, or feed quality concerns in detail..."
          value={question}
          onChangeText={setQuestion}
          multiline
          numberOfLines={4}
        />

        {/* Additional Context */}
        <AppInput
          label="Additional Context (Optional)"
          placeholder="e.g. Recent weather changes, barn conditions, diet changes..."
          value={additionalContext}
          onChangeText={setAdditionalContext}
          multiline
          numberOfLines={3}
        />

        {/* Optional References Selection */}
        <Text style={styles.sectionTitle}>Link Related Information (Optional)</Text>

        {loadingOptions ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
        ) : (
          <>
            {/* Animal Selection */}
            {animals.length > 0 && (
              <View style={styles.selectorGroup}>
                <Text style={styles.selectorLabel}>Related Animal:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, selectedAnimalId === undefined && styles.chipActive]}
                    onPress={() => setSelectedAnimalId(undefined)}
                  >
                    <Text style={[styles.chipText, selectedAnimalId === undefined && styles.chipTextActive]}>
                      None
                    </Text>
                  </TouchableOpacity>
                  {animals.map((a) => (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.chip, selectedAnimalId === a.id && styles.chipActive]}
                      onPress={() => setSelectedAnimalId(a.id)}
                    >
                      <Text style={[styles.chipText, selectedAnimalId === a.id && styles.chipTextActive]}>
                        {a.animalTag} {a.name ? `(${a.name})` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Feed Sample Selection */}
            {feedSamples.length > 0 && (
              <View style={styles.selectorGroup}>
                <Text style={styles.selectorLabel}>Related Feed Sample:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, selectedFeedId === undefined && styles.chipActive]}
                    onPress={() => setSelectedFeedId(undefined)}
                  >
                    <Text style={[styles.chipText, selectedFeedId === undefined && styles.chipTextActive]}>
                      None
                    </Text>
                  </TouchableOpacity>
                  {feedSamples.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.chip, selectedFeedId === f.id && styles.chipActive]}
                      onPress={() => setSelectedFeedId(f.id)}
                    >
                      <Text style={[styles.chipText, selectedFeedId === f.id && styles.chipTextActive]}>
                        {f.sampleCode} ({f.feedType})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Silage Sample Selection */}
            {silageSamples.length > 0 && (
              <View style={styles.selectorGroup}>
                <Text style={styles.selectorLabel}>Related Silage Sample:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, selectedSilageId === undefined && styles.chipActive]}
                    onPress={() => setSelectedSilageId(undefined)}
                  >
                    <Text style={[styles.chipText, selectedSilageId === undefined && styles.chipTextActive]}>
                      None
                    </Text>
                  </TouchableOpacity>
                  {silageSamples.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.chip, selectedSilageId === s.id && styles.chipActive]}
                      onPress={() => setSelectedSilageId(s.id)}
                    >
                      <Text style={[styles.chipText, selectedSilageId === s.id && styles.chipTextActive]}>
                        {s.sampleCode} ({s.silageType})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}

        {/* Submit Button */}
        <AppButton
          title={submitting ? 'Submitting Request...' : 'Submit Consultation Request'}
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
  disclaimerCard: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  disclaimerTitle: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  disclaimerText: {
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  selectorGroup: {
    marginVertical: spacing.xs,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginRight: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
});

export default RequestConsultationScreen;

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { AppButton, AppCard, ErrorMessage, ScreenContainer } from '../../components';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { sampleImageService } from '../../services/sampleImageService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

type CaptureMode = 'CAMERA' | 'PREVIEW' | 'UPLOADING';

export const CameraCaptureScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'CameraCapture'>['route']>();
  const { sampleType, sampleId, sampleCode } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [mode, setMode] = useState<CaptureMode>('CAMERA');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedMimeType, setCapturedMimeType] = useState<string>('image/jpeg');
  const [caption, setCaption] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Native camera ref
  const cameraRef = useRef<CameraView>(null);

  // Web webcam refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webStreamRef = useRef<MediaStream | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);

  // Setup web webcam when on web platform
  useEffect(() => {
    if (Platform.OS === 'web' && mode === 'CAMERA') {
      let isMounted = true;

      const startWebcam = async () => {
        try {
          if (navigator?.mediaDevices?.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: facing === 'front' ? 'user' : 'environment' },
              audio: false,
            });
            if (isMounted) {
              webStreamRef.current = stream;
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setIsWebcamActive(true);
              }
            }
          }
        } catch (err) {
          console.warn('Webcam access error:', err);
        }
      };

      startWebcam();

      return () => {
        isMounted = false;
        if (webStreamRef.current) {
          webStreamRef.current.getTracks().forEach((track) => track.stop());
          webStreamRef.current = null;
        }
        setIsWebcamActive(false);
      };
    }
  }, [mode, facing]);

  // Clean up web stream on unmount
  useEffect(() => {
    return () => {
      if (webStreamRef.current) {
        webStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = async () => {
    try {
      setErrorMessage(null);

      if (Platform.OS === 'web') {
        if (!videoRef.current) {
          throw new Error('Webcam video feed is not available.');
        }
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not initialize image capture canvas.');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        // Stop video stream during preview
        if (webStreamRef.current) {
          webStreamRef.current.getTracks().forEach((track) => track.stop());
          webStreamRef.current = null;
        }
        setIsWebcamActive(false);

        setCapturedUri(dataUrl);
        setCapturedMimeType('image/jpeg');
        setMode('PREVIEW');
        return;
      }

      // Native mobile capture
      if (!cameraRef.current) {
        throw new Error('Camera preview is not ready.');
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });

      if (!photo || !photo.uri) {
        throw new Error('Failed to capture photo from camera.');
      }

      setCapturedUri(photo.uri);
      setCapturedMimeType('image/jpeg');
      setMode('PREVIEW');
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    }
  };

  const handlePickFromGallery = async () => {
    try {
      setErrorMessage(null);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setCapturedUri(asset.uri);
        setCapturedMimeType(asset.mimeType || 'image/jpeg');
        setMode('PREVIEW');
      }
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
    setErrorMessage(null);
    setMode('CAMERA');
  };

  const handleConfirmAndUpload = async () => {
    if (!capturedUri) return;

    try {
      setIsUploading(true);
      setErrorMessage(null);
      setMode('UPLOADING');

      const filename = `${sampleType.toLowerCase()}_${sampleCode}_${Date.now()}.jpg`;

      if (sampleType === 'FEED') {
        await sampleImageService.uploadFeedImage(
          sampleId,
          capturedUri,
          caption,
          filename,
          capturedMimeType
        );
      } else {
        await sampleImageService.uploadSilageImage(
          sampleId,
          capturedUri,
          caption,
          filename,
          capturedMimeType
        );
      }

      Alert.alert(
        'Upload Successful',
        'Photo attachment has been saved for this sample.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
      setMode('PREVIEW');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <ScreenContainer scrollable={mode !== 'CAMERA'}>
      {/* Header Banner */}
      <View style={styles.header}>
        <Text style={styles.sampleBadge}>
          {sampleType === 'FEED' ? '🌾 FEED SAMPLE' : '🌽 SILAGE SAMPLE'}
        </Text>
        <Text style={styles.sampleCode}>{sampleCode}</Text>
        <Text style={styles.headerSubtitle}>
          Attach visual documentation photos for inspection & records
        </Text>
      </View>

      {errorMessage && (
        <ErrorMessage
          message={errorMessage}
          onRetry={mode === 'PREVIEW' ? handleConfirmAndUpload : undefined}
        />
      )}

      {/* ── STATE: CAMERA CAPTURE ── */}
      {mode === 'CAMERA' && (
        <View style={styles.cameraContainer}>
          {/* Permission Not Granted State */}
          {!permission?.granted && Platform.OS !== 'web' ? (
            <AppCard style={styles.permissionCard}>
              <Text style={styles.permissionIcon}>📷</Text>
              <Text style={styles.permissionTitle}>Camera Permission Required</Text>
              <Text style={styles.permissionText}>
                We need access to your device camera to capture feed and silage sample photos.
              </Text>

              <View style={styles.permissionButtonRow}>
                <AppButton
                  title="Grant Camera Access"
                  variant="primary"
                  onPress={requestPermission}
                />
                <AppButton
                  title="🖼️ Choose from Gallery Instead"
                  variant="outline"
                  onPress={handlePickFromGallery}
                />
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={() => navigation.goBack()}
                />
              </View>
            </AppCard>
          ) : (
            <View style={styles.cameraWrapper}>
              {/* Native Mobile Camera View */}
              {Platform.OS !== 'web' ? (
                <CameraView
                  ref={cameraRef}
                  style={styles.cameraView}
                  facing={facing}
                />
              ) : (
                /* Web Browser Webcam Feed */
                <View style={styles.webcamContainer}>
                  {/* @ts-ignore Web specific element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: borderRadius.md,
                      backgroundColor: '#000',
                    }}
                  />
                  {!isWebcamActive && (
                    <View style={styles.webcamPlaceholder}>
                      <ActivityIndicator size="large" color={colors.primary} />
                      <Text style={styles.webcamPlaceholderText}>
                        Starting webcam feed...
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Viewfinder Overlay Guides */}
              <View style={styles.viewfinderOverlay}>
                <View style={styles.viewfinderBox} />
                <Text style={styles.guideText}>
                  Center the feed/silage sample within the frame
                </Text>
              </View>

              {/* Camera Action Controls Bar */}
              <View style={styles.controlsBar}>
                <TouchableOpacity
                  style={styles.controlIconBtn}
                  onPress={handlePickFromGallery}
                >
                  <Text style={styles.controlIcon}>🖼️</Text>
                  <Text style={styles.controlLabel}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleCapture}
                >
                  <View style={styles.captureInnerCircle} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlIconBtn}
                  onPress={toggleCameraFacing}
                >
                  <Text style={styles.controlIcon}>🔄</Text>
                  <Text style={styles.controlLabel}>Flip</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── STATE: PREVIEW CAPTURED IMAGE ── */}
      {mode === 'PREVIEW' && capturedUri && (
        <View style={styles.previewContainer}>
          <AppCard style={styles.previewCard}>
            <Text style={styles.previewTitle}>Image Preview</Text>
            <Text style={styles.previewSubtitle}>
              Review your photo before attaching it to sample {sampleCode}
            </Text>

            <View style={styles.previewImageWrapper}>
              <Image
                source={{ uri: capturedUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.captionInputContainer}>
              <Text style={styles.inputLabel}>Optional Caption / Notes</Text>
              <TextInput
                style={styles.captionInput}
                placeholder="e.g. Surface discoloration, texture check, trench #2"
                placeholderTextColor={colors.textSecondary}
                value={caption}
                onChangeText={setCaption}
                maxLength={200}
              />
            </View>

            <View style={styles.previewButtonsRow}>
              <View style={styles.previewBtnWrapper}>
                <AppButton
                  title="🔄 Retake"
                  variant="outline"
                  onPress={handleRetake}
                  disabled={isUploading}
                />
              </View>
              <View style={styles.previewBtnWrapper}>
                <AppButton
                  title="✅ Confirm & Upload"
                  variant="primary"
                  onPress={handleConfirmAndUpload}
                  disabled={isUploading}
                />
              </View>
            </View>
          </AppCard>

          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerText}>
              ℹ️ Photos are securely stored for visual sample documentation and audit records.
            </Text>
          </View>
        </View>
      )}

      {/* ── STATE: UPLOADING ── */}
      {mode === 'UPLOADING' && (
        <AppCard style={styles.uploadingCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.uploadingTitle}>Uploading Sample Image...</Text>
          <Text style={styles.uploadingSubtitle}>
            Compressing and sending photo attachment to server
          </Text>
        </AppCard>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  sampleBadge: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 1,
  },
  sampleCode: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cameraContainer: {
    flex: 1,
    minHeight: 480,
  },
  permissionCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  permissionIcon: {
    fontSize: 48,
  },
  permissionTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  permissionText: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButtonRow: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cameraWrapper: {
    width: '100%',
    height: 460,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  cameraView: {
    flex: 1,
    width: '100%',
  },
  webcamContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
    backgroundColor: '#000',
  },
  webcamPlaceholder: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    gap: spacing.sm,
  },
  webcamPlaceholderText: {
    color: '#fff',
    fontSize: typography.fontSize.small,
  },
  viewfinderOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  viewfinderBox: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: borderRadius.md,
    backgroundColor: 'transparent',
  },
  guideText: {
    color: '#fff',
    fontSize: typography.fontSize.caption,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  controlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  controlIconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  controlIcon: {
    fontSize: 24,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  captureButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInnerCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
  },
  previewContainer: {
    gap: spacing.md,
  },
  previewCard: {
    padding: spacing.md,
  },
  previewTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  previewSubtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  previewImageWrapper: {
    width: '100%',
    height: 260,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  captionInputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.small,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  previewButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  previewBtnWrapper: {
    flex: 1,
  },
  uploadingCard: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  uploadingTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  uploadingSubtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  disclaimerContainer: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

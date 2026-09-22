import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors } from '../theme';
import UiIcon from './UiIcon';

interface RemoteProductImageProps {
  uri: string | null | undefined;
  accessibilityLabel: string;
  containerStyle: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export default function RemoteProductImage({
  uri,
  accessibilityLabel,
  containerStyle,
  imageStyle,
}: RemoteProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(uri));
  const showImage = Boolean(uri) && !hasError;

  return (
    <View style={[styles.container, containerStyle]}>
      {showImage ? (
        <Image
          accessibilityLabel={accessibilityLabel}
          accessible
          onError={() => setHasError(true)}
          onLoadEnd={() => setIsLoading(false)}
          onLoadStart={() => setIsLoading(true)}
          resizeMode="cover"
          source={{ uri: uri ?? undefined }}
          style={[styles.image, imageStyle]}
        />
      ) : (
        <View accessibilityLabel={`${accessibilityLabel} no disponible`} accessible style={styles.placeholder}>
          <UiIcon color={colors.textSecondary} name="products" size={28} />
          <Text style={styles.placeholderText}>Sin imagen</Text>
        </View>
      )}
      {showImage && isLoading ? (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    opacity: 0.72,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  placeholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
});

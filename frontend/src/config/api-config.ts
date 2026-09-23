export interface ApiConfiguration {
  baseUrl: string;
  error: string | null;
}

export function getApiConfiguration(
  value = process.env.EXPO_PUBLIC_API_URL,
): ApiConfiguration {
  const baseUrl = value?.trim() ?? '';

  if (!baseUrl) {
    return {
      baseUrl,
      error:
        'Falta configurar EXPO_PUBLIC_API_URL. Revisá el archivo .env y reiniciá Expo.',
    };
  }

  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('protocol');
    }
  } catch {
    return {
      baseUrl,
      error:
        'La URL del servidor no es válida. Debe comenzar con http:// o https://.',
    };
  }

  return { baseUrl, error: null };
}

export const apiConfiguration = getApiConfiguration();
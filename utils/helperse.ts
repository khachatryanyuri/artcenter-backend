function parseContent(content: Record<string, string>): Record<string, any> {
  const parsedContent: Record<string, any> = {};

  for (const [language, data] of Object.entries(content)) {
    try {
      parsedContent[language] = JSON.parse(data); // Safely parse each language's content
    } catch (error) {
      throw new Error(`Invalid JSON format in content for language: ${language}`);
    }
  }

  return parsedContent;
}

function parseSubType(rawType: any[]): { key: string; name: { ru: string; en: string } }[] {
  if (!Array.isArray(rawType)) return [];

  return rawType
    .map((item) => {
      try {
        const parsed = typeof item === 'string' ? JSON.parse(item) : item;

        return {
          key: parsed.key,
          name: {
            ru: parsed.name?.ru ?? '',
            en: parsed.name?.en ?? '',
          },
        };
      } catch (e) {
        console.warn('Ошибка парсинга type:', item);
        return null;
      }
    })
    .filter((item): item is { key: string; name: { ru: string; en: string } } => item !== null);
}

function getImagePaths(urls: string | string[]) {
  if (Array.isArray(urls)) {
    return urls.map((url) => `/images/${url.split('/').pop()}`);
  } else if (typeof urls === 'string') {
    const fileName = urls.split('/').pop();
    return fileName ? `/images/${fileName}` : null;
  }
}

export { parseContent, getImagePaths, parseSubType };

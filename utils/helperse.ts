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

function getImagePaths(urls: string | string[]) {
  if (Array.isArray(urls)) {
    return urls.map((url) => `/images/${url.split('/').pop()}`);
  } else if (typeof urls === 'string') {
    const fileName = urls.split('/').pop();
    return fileName ? `/images/${fileName}` : null;
  }
}

export { parseContent, getImagePaths };

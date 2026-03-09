export default {
  query(obj, path) {
    if (!obj || typeof obj !== 'object') return [];
    const key = path.replace(/^\$\./, '');
    const parts = key.split('.');
    let current = obj;
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return [];
      current = current[part];
    }
    return current !== undefined ? [current] : [];
  },
};

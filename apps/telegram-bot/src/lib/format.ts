/**
 * Telegram Formatting Helpers
 * Converts standard Markdown syntax to Telegram-safe HTML tags.
 */
export function markdownToHtml(text: string): string {
  if (!text) return '';

  return text
    // Replace bold **text** with <b>text</b>
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    // Replace italic *text* with <i>text</i>
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    // Replace inline code `code` with <code>code</code>
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Replace links [text](url) with <a href="url">text</a>
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // Clean up any remaining unresolved Markdown characters
    .trim();
}

/**
 * Formats order status nicely.
 */
export function formatStatusEmoji(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
      return '⏳ PENDING';
    case 'processing':
      return '⚙️ PROCESSING';
    case 'shipped':
      return '🛸 SHIPPED (IN TRANSIT)';
    case 'delivered':
      return '✅ DELIVERED';
    case 'cancelled':
      return '❌ CANCELLED';
    default:
      return status.toUpperCase();
  }
}

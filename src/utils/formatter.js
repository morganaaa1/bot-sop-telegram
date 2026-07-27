/**
 * Helper untuk merender SOP menjadi HTML yang aman dikirim ke Telegram
 * Menggunakan <pre><code> agar teks memiliki format code block.
 */
const formatSopDetail = (sop) => {
  // Escape HTML characters untuk mencegah tag HTML berantakan di Telegram
  const escapeHtml = (unsafe) => {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  };

  const title = escapeHtml(sop.title);
  const category = escapeHtml(sop.category || 'General');
  const description = escapeHtml(sop.description || '-');
  const codeContent = escapeHtml(sop.code_content || '');

  return `<b>SOP: ${title}</b>
Kategori: ${category}

${description}

<i>Command/Query:</i>
<pre><code>${codeContent}</code></pre>`;
};

module.exports = {
  formatSopDetail
};

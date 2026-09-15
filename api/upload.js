const { put } = require('@vercel/blob');
const { respondError, respondSuccess, applyCors } = require('./lib/auth');

const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4MB - stays under Vercel's serverless request body limit

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return respondError(res, 405, 'Method not allowed');
  }

  try {
    const { filename, contentType, dataBase64 } = req.body;

    if (!filename || !dataBase64) {
      return respondError(res, 400, 'filename and dataBase64 are required');
    }

    const buffer = Buffer.from(dataBase64, 'base64');

    if (buffer.length > MAX_SIZE_BYTES) {
      return respondError(res, 400, 'File is too large. Please upload a file under 4MB.');
    }

    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: contentType || 'application/octet-stream',
      addRandomSuffix: true,
    });

    respondSuccess(res, 200, { url: blob.url });
  } catch (error) {
    console.error(error);
    respondError(res, 500, 'File upload failed');
  }
};

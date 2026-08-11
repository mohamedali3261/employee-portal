const generateQRCode = (data) => {
  const qrData = typeof data === 'string' ? data : JSON.stringify(data);
  const encodedData = encodeURIComponent(qrData);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}`;
};

const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toISOString().split('T')[0];
};

const validateEmployeeId = (id) => {
  return /^\d+$/.test(id);
};

const paginate = (total, page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;
  const pages = Math.ceil(total / limitNum);

  return {
    page: pageNum,
    limit: limitNum,
    offset,
    pages,
    total
  };
};

module.exports = {
  generateQRCode,
  formatDate,
  validateEmployeeId,
  paginate
};
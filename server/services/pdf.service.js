const PDFDocument = require('pdfkit');
const path = require('path');
const https = require('https');
const http = require('http');

const FONT_REGULAR = path.join(__dirname, '..', 'fonts', 'SegoeUI-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '..', 'fonts', 'SegoeUI-Bold.ttf');

const ALLOWED_IMAGE_HOSTS = ['res.cloudinary.com'];

const fetchImage = (url) => {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return reject(new Error('Invalid image URL'));
    }

    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return reject(new Error('Invalid image protocol'));
    }

    if (!ALLOWED_IMAGE_HOSTS.some((host) => parsed.hostname.endsWith(host))) {
      return reject(new Error('Image host not allowed'));
    }

    const client = parsed.protocol === 'https:' ? https : http;
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Image fetch failed: ${response.statusCode}`));
      }
      const chunks = [];
      let size = 0;
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      response.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_SIZE) {
          response.destroy();
          return reject(new Error('Image too large'));
        }
        chunks.push(chunk);
      });
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
};

const generateCertificatePDF = async (employee, exam, user) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const buffers = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  doc.registerFont('Georgian', FONT_REGULAR);
  doc.registerFont('Georgian-Bold', FONT_BOLD);

  const pageW = doc.page.width;
  const margin = 40;
  const cardW = pageW - margin * 2;

  // Colors
  const primary = '#1a365d';
  const accent = '#2b6cb0';
  const lightBg = '#ebf4ff';
  const borderColor = '#bee3f8';
  const textDark = '#1a202c';
  const textMuted = '#4a5568';

  // === Outer border / card frame ===
  doc.roundedRect(margin, margin, cardW, doc.page.height - margin * 2, 12)
    .lineWidth(2)
    .strokeColor(accent)
    .stroke();

  // Inner decorative border
  doc.roundedRect(margin + 8, margin + 8, cardW - 16, doc.page.height - margin * 2 - 16, 8)
    .lineWidth(0.5)
    .strokeColor(borderColor)
    .stroke();

  let y = margin + 30;

  // === Header background ===
  doc.save();
  doc.roundedRect(margin + 12, y, cardW - 24, 80, 6)
    .fill(primary);
  doc.restore();

  // Header text
  doc.font('Georgian-Bold').fontSize(22).fillColor('#ffffff')
    .text('ენერგო პრო', margin + 12, y + 15, { width: cardW - 24, align: 'center' });
  doc.font('Georgian').fontSize(13).fillColor('#bee3f8')
    .text('სერტიფიკატი', margin + 12, y + 48, { width: cardW - 24, align: 'center' });

  y += 100;

  // === Decorative line ===
  doc.moveTo(margin + 60, y).lineTo(pageW - margin - 60, y)
    .lineWidth(1).strokeColor(accent).stroke();
  y += 20;

  // === Employee photo (centered) ===
  if (employee.photo) {
    try {
      const imgBuffer = await fetchImage(employee.photo);
      const imgSize = 100;
      const imgX = pageW / 2 - imgSize / 2;

      // Photo border circle
      doc.save();
      doc.roundedRect(imgX - 4, y - 4, imgSize + 8, imgSize + 8, 8)
        .lineWidth(2).strokeColor(accent).stroke();
      doc.restore();

      doc.image(imgBuffer, imgX, y, { width: imgSize, height: imgSize, fit: [imgSize, imgSize] });
      y += imgSize + 20;
    } catch {
      y += 10;
    }
  }

  // === Employee name (large, centered) ===
  doc.font('Georgian-Bold').fontSize(18).fillColor(primary)
    .text(employee.fullName, margin + 20, y, { width: cardW - 40, align: 'center' });
  y += 30;

  doc.fontSize(11).fillColor(textMuted)
    .text(`პირადი ნომერი: ${employee.personalId}`, margin + 20, y, { width: cardW - 40, align: 'center' });
  y += 18;

  if (employee.birthDate) {
    doc.fontSize(11).fillColor(textMuted)
      .text(`დაბადების თარიღი: ${new Date(employee.birthDate).toLocaleDateString('ka-GE')}`, margin + 20, y, { width: cardW - 40, align: 'center' });
    y += 18;
  }

  y += 7;

  // === Info card section ===
  const infoCardX = margin + 30;
  const infoCardW = cardW - 60;

  // Employee info card
  doc.save();
  doc.roundedRect(infoCardX, y, infoCardW, 110, 6).fill(lightBg);
  doc.restore();

  doc.roundedRect(infoCardX, y, infoCardW, 110, 6)
    .lineWidth(0.5).strokeColor(borderColor).stroke();

  y += 12;
  const col1X = infoCardX + 15;
  const col2X = infoCardX + infoCardW / 2 + 10;
  const labelStyle = { continued: false };

  const drawField = (label, value, x, yPos) => {
    doc.font('Georgian').fontSize(9).fillColor(textMuted).text(label, x, yPos, labelStyle);
    doc.font('Georgian').fontSize(11).fillColor(textDark).text(value || '-', x, yPos + 13, labelStyle);
  };

  drawField('დეპარტამენტი', employee.department, col1X, y);
  drawField('თანამდებობა', employee.position, col2X, y);
  drawField('სამუშაო ადგილი', employee.workplace, col1X, y + 38);
  drawField('კვალიფიკაციის ჯგუფი', employee.qualificationGroup, col2X, y + 38);

  if (employee.specialPermissions?.length > 0) {
    drawField('სპეციალური ნებართვები', employee.specialPermissions.join(', '), col1X, y + 76);
  }

  y += 125;

  // === Exam details card ===
  doc.save();
  doc.roundedRect(infoCardX, y, infoCardW, 6, 6).fill(accent);
  doc.restore();

  y += 10;
  doc.font('Georgian-Bold').fontSize(14).fillColor(primary)
    .text('გამოცდის დეტალები', infoCardX, y, { width: infoCardW, align: 'center' });
  y += 25;

  doc.save();
  doc.roundedRect(infoCardX, y, infoCardW, 130, 6).fill(lightBg);
  doc.restore();
  doc.roundedRect(infoCardX, y, infoCardW, 130, 6)
    .lineWidth(0.5).strokeColor(borderColor).stroke();

  y += 12;

  drawField('დისციპლინა', exam.discipline, col1X, y);
  drawField('მიზეზი', exam.reason, col2X, y);
  drawField('გამოცდის თარიღი', new Date(exam.examDate).toLocaleDateString('ka-GE'), col1X, y + 38);
  drawField('შემდეგი გამოცდის თარიღი', new Date(exam.nextExamDate).toLocaleDateString('ka-GE'), col2X, y + 38);
  drawField('შეფასება', exam.grade, col1X, y + 76);

  // Status with color
  const statusMap = {
    passed: { label: 'წარმატებული', color: '#38a169' },
    failed: { label: 'ჩაჭრილი', color: '#e53e3e' },
    pending: { label: 'მოლოდინში', color: '#d69e2e' },
    expired: { label: 'ვადაგასული', color: '#718096' },
  };
  const statusInfo = statusMap[exam.status] || { label: exam.status, color: textDark };

  doc.font('Georgian').fontSize(9).fillColor(textMuted).text('სტატუსი', col2X, y + 76);
  doc.font('Georgian').fontSize(11).fillColor(statusInfo.color).text(statusInfo.label, col2X, y + 89);

  y += 145;

  if (exam.notes) {
    doc.font('Georgian').fontSize(9).fillColor(textMuted).text('შენიშვნა:', col1X, y);
    doc.font('Georgian').fontSize(10).fillColor(textDark).text(exam.notes, col1X, y + 14, { width: infoCardW - 30 });
    y += 35;
  }

  // === Footer section ===
  const footerY = doc.page.height - margin - 60;

  doc.moveTo(margin + 60, footerY).lineTo(pageW - margin - 60, footerY)
    .lineWidth(0.5).strokeColor(borderColor).stroke();

  doc.font('Georgian').fontSize(8).fillColor(textMuted)
    .text(`გენერირებულია: ${new Date().toLocaleDateString('ka-GE')}`, margin + 20, footerY + 10, { width: cardW - 40, align: 'left' });

  if (user) {
    doc.font('Georgian').fontSize(8).fillColor(textMuted)
      .text(`მომხმარებელი: ${user.fullName} (${user.email})`, margin + 20, footerY + 10, { width: cardW - 40, align: 'right' });
  }

  doc.font('Georgian').fontSize(7).fillColor(textMuted)
    .text('ენერგო პრო - სერტიფიკაციის სისტემა', margin + 20, footerY + 28, { width: cardW - 40, align: 'center' });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
};

module.exports = { generateCertificatePDF };

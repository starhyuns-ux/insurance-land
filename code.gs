function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('리드') || ss.getSheets()[0];

    // JSON으로 받기
    const data = e.postData && e.postData.contents
      ? JSON.parse(e.postData.contents)
      : {};

    const timestamp = new Date();
    const name = String(data.name || '');
    const phone = String(data.phone || '');
    const birth = String(data.birth || '');
    const budget = String(data.budget || '');
    const ua = String(data.ua || '');
    const referrer = String(data.referrer || '');

    sheet.appendRow([timestamp, name, phone, birth, budget, ua, referrer]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
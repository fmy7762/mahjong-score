/*
 * 共有経費管理アプリ用 API (v3: 立替精算対応版)
 * シート名：「シート1」
 * カラム： A:ID, B:日時, C:種別, D:用途, E:金額, F:立替者
 */

const SHEET_NAME = 'シート1';

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  const transactions = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    let dateStr = row[1];
    if (typeof row[1] === 'object') {
      dateStr = Utilities.formatDate(row[1], Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm");
    }

    transactions.push({
      id:     row[0],
      date:   dateStr,
      type:   row[2],
      memo:   row[3],
      amount: Number(row[4]),
      payer:  row[5] || ''   // ← 立替者（新規追加）
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify(transactions))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    if (data.action === 'create') {
      sheet.appendRow([data.id, data.date, data.type, data.memo, data.amount, data.payer || '']);

    } else if (data.action === 'update') {
      const row = findRowById(sheet, data.id);
      if (!row) throw new Error('Row not found');
      sheet.getRange(row, 1, 1, 6).setValues([[data.id, data.date, data.type, data.memo, data.amount, data.payer || '']]);

    } else if (data.action === 'delete') {
      const row = findRowById(sheet, data.id);
      if (row) sheet.deleteRow(row);

    } else if (data.action === 'settle') {
      // 元の立替レコードを削除
      const row = findRowById(sheet, data.originalId);
      if (row) sheet.deleteRow(row);
      // 精算済みレコードを追加
      sheet.appendRow([data.id, data.date, 'settled', data.memo, data.amount, data.payer || '']);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function findRowById(sheet, id) {
  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat().map(String);
  const index = ids.indexOf(String(id));
  return index === -1 ? null : index + 2;
}
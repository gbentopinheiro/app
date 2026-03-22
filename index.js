const XLSX = require('xlsx');

// Check if file path is provided
if (process.argv.length < 3) {
  console.log('Usage: node index.js <path to xlsx file>');
  process.exit(1);
}

const filePath = process.argv[2];

try {
  // Read the Excel file
  const workbook = XLSX.readFile(filePath);

  // Assume the first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert sheet to array of arrays (rows)
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log('Processing Excel file:', filePath);
  console.log('Sheet:', sheetName);
  console.log('---');

  // Skip header row (assume row 0 is header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const name = row[2]; // Column C (0-indexed: A=0, B=1, C=2)
    const hourlyPrice = row[35]; // Column AJ (AJ=35)
    const monthlyPrice = row[36]; // Column AK (AK=36)

    // Check if name exists and at least one price is present
    if (name && (hourlyPrice !== undefined || monthlyPrice !== undefined)) {
      console.log(`Nome: ${name}`);
      if (hourlyPrice !== undefined) {
        console.log(`Preço à hora (AJ): ${hourlyPrice}`);
      }
      if (monthlyPrice !== undefined) {
        console.log(`Preço mensal (AK): ${monthlyPrice}`);
      }
      console.log('---');
    }
  }

  console.log('Processamento concluído.');

} catch (error) {
  console.error('Erro ao processar o arquivo:', error.message);
  process.exit(1);
}
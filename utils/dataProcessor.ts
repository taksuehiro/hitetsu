import * as XLSX from 'xlsx'

export interface ProcessedData {
  priceData: any
  qtyData: any
  dateStart: string
  dateEnd: string
  error?: string
}

export function processExcelData(workbook: XLSX.WorkBook): ProcessedData {
  // シート名を取得
  const sheetNames = workbook.SheetNames

  // 価格シートと数量シートを検出
  let priceSheet: string | null = null
  let qtySheet: string | null = null

  for (const sheet of sheetNames) {
    if (sheet.includes('価格') || sheet.toLowerCase().includes('price')) {
      priceSheet = sheet
    }
    if (sheet.includes('数量') || sheet.toLowerCase().includes('qty') || sheet.toLowerCase().includes('quantity')) {
      qtySheet = sheet
    }
  }

  // デフォルトで最初の2つのシートを使用
  if (!priceSheet && sheetNames.length >= 1) {
    priceSheet = sheetNames[0]
  }
  if (!qtySheet && sheetNames.length >= 2) {
    qtySheet = sheetNames[1]
  } else if (!qtySheet && sheetNames.length >= 1) {
    qtySheet = sheetNames[0]
  }

  if (!priceSheet || !qtySheet) {
    return {
      priceData: null,
      qtyData: null,
      dateStart: '',
      dateEnd: '',
      error: '価格または数量のシートが見つかりません。'
    }
  }

  // シートを読み込み
  const priceSheetData = workbook.Sheets[priceSheet]
  const qtySheetData = workbook.Sheets[qtySheet]

  // JSONに変換（最初の列をインデックスとして使用）
  const priceJson = XLSX.utils.sheet_to_json(priceSheetData, { header: 1 })
  const qtyJson = XLSX.utils.sheet_to_json(qtySheetData, { header: 1 })

  if (priceJson.length === 0 || qtyJson.length === 0) {
    return {
      priceData: null,
      qtyData: null,
      dateStart: '',
      dateEnd: '',
      error: 'データが空です。'
    }
  }

  // 最初の行を列名として使用
  const priceHeaders = priceJson[0] as string[]
  const qtyHeaders = qtyJson[0] as string[]

  // データをオブジェクトに変換
  const priceData: any = {}
  const qtyData: any = {}

  // 価格データ
  for (let i = 1; i < priceJson.length; i++) {
    const row = priceJson[i] as any[]
    if (row.length === 0) continue
    
    const prompt = String(row[0] || '')
    if (!prompt) continue

    priceData[prompt] = {}
    for (let j = 1; j < priceHeaders.length; j++) {
      const colName = String(priceHeaders[j] || '')
      if (colName && row[j] !== undefined) {
        const value = row[j]
        priceData[prompt][colName] = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '')) || 0
      }
    }
  }

  // 数量データ
  for (let i = 1; i < qtyJson.length; i++) {
    const row = qtyJson[i] as any[]
    if (row.length === 0) continue
    
    const prompt = String(row[0] || '')
    if (!prompt) continue

    qtyData[prompt] = {}
    for (let j = 1; j < qtyHeaders.length; j++) {
      const colName = String(qtyHeaders[j] || '')
      if (colName && row[j] !== undefined) {
        const value = row[j]
        qtyData[prompt][colName] = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '')) || 0
      }
    }
  }

  // 共通の日付列を取得
  const priceCols = priceHeaders.slice(1).filter(col => col && !String(col).startsWith('Unnamed'))
  const qtyCols = qtyHeaders.slice(1).filter(col => col && !String(col).startsWith('Unnamed'))
  
  const commonCols = priceCols.filter(col => qtyCols.includes(col))
  
  if (commonCols.length < 2) {
    return {
      priceData: null,
      qtyData: null,
      dateStart: '',
      dateEnd: '',
      error: '価格と数量のデータに共通の日付列が2つ以上必要です。'
    }
  }

  // 最初の2つの日付列を使用
  const sortedCols = [...commonCols].sort()
  const dateStart = sortedCols[0]
  const dateEnd = sortedCols[1]

  return {
    priceData,
    qtyData,
    dateStart,
    dateEnd
  }
}


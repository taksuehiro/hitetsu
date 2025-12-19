export interface PLData {
  prompt: string
  qtyStart: number
  qtyEnd: number
  priceStart: number
  priceEnd: number
  priceChange: number
  holdPL: number
  actualPL: number
}

export function safeGetValue(data: any, prompt: string, col: string, defaultVal: number = 0): number {
  try {
    if (!data[prompt] || data[prompt][col] === undefined) {
      return defaultVal
    }
    const value = data[prompt][col]
    if (value === null || value === undefined || isNaN(value)) {
      return defaultVal
    }
    return typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '')) || defaultVal
  } catch {
    return defaultVal
  }
}

export function calculatePLData(
  priceData: any,
  qtyData: any,
  dateStart: string,
  dateEnd: string
): PLData[] {
  const prompts = Object.keys(priceData).filter(p => priceData[p] && qtyData[p])
  const plData: PLData[] = []

  for (const prompt of prompts) {
    const qtyStart = safeGetValue(qtyData, prompt, dateStart, 0)
    const qtyEnd = safeGetValue(qtyData, prompt, dateEnd, 0)
    const priceStart = safeGetValue(priceData, prompt, dateStart, 0)
    const priceEnd = safeGetValue(priceData, prompt, dateEnd, 0)

    const priceChange = priceEnd - priceStart
    const holdPL = qtyStart * priceChange
    const actualPL = qtyEnd * priceChange

    plData.push({
      prompt,
      qtyStart,
      qtyEnd,
      priceStart,
      priceEnd,
      priceChange,
      holdPL,
      actualPL
    })
  }

  return plData
}


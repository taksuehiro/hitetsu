'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { safeGetValue } from '@/utils/calculations'

interface Tab2Props {
  priceData: any
  qtyData: any
  dateStart: string
  dateEnd: string
}

export default function Tab2({ priceData, qtyData, dateStart, dateEnd }: Tab2Props) {
  const spreadData = useMemo(() => {
    const prompts = Object.keys(priceData).filter(p => priceData[p] && qtyData[p])
    
    // Cashと3Mを検出
    let cashPrompt: string | null = null
    let m3Prompt: string | null = null

    for (const prompt of prompts) {
      if (prompt.includes('Cash') || prompt.toLowerCase().includes('cash')) {
        cashPrompt = prompt
      }
      if (prompt.includes('3M') || prompt.toLowerCase().includes('3m')) {
        m3Prompt = prompt
      }
    }

    if (!cashPrompt || !m3Prompt) {
      return null
    }

    // 価格データ
    const cashPriceStart = safeGetValue(priceData, cashPrompt, dateStart, 0)
    const cashPriceEnd = safeGetValue(priceData, cashPrompt, dateEnd, 0)
    const m3PriceStart = safeGetValue(priceData, m3Prompt, dateStart, 0)
    const m3PriceEnd = safeGetValue(priceData, m3Prompt, dateEnd, 0)

    // 数量データ
    const cashQtyStart = safeGetValue(qtyData, cashPrompt, dateStart, 0)
    const cashQtyEnd = safeGetValue(qtyData, cashPrompt, dateEnd, 0)
    const m3QtyStart = safeGetValue(qtyData, m3Prompt, dateStart, 0)
    const m3QtyEnd = safeGetValue(qtyData, m3Prompt, dateEnd, 0)

    // Spread計算
    const spreadStart = cashPriceStart - m3PriceStart
    const spreadEnd = cashPriceEnd - m3PriceEnd
    const spreadChange = spreadEnd - spreadStart

    // Spread Qty計算
    const spreadQtyStart = cashQtyStart * m3QtyStart < 0 
      ? Math.min(Math.abs(cashQtyStart), Math.abs(m3QtyStart)) 
      : 0
    const spreadQtyEnd = cashQtyEnd * m3QtyEnd < 0 
      ? Math.min(Math.abs(cashQtyEnd), Math.abs(m3QtyEnd)) 
      : 0

    // Spread P/L計算
    const spreadPLHold = spreadQtyStart * spreadChange
    const spreadPLActual = spreadQtyEnd * spreadChange

    return {
      cashPrompt,
      m3Prompt,
      spreadStart,
      spreadEnd,
      spreadChange,
      spreadQtyStart,
      spreadQtyEnd,
      spreadPLHold,
      spreadPLActual
    }
  }, [priceData, qtyData, dateStart, dateEnd])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(num))
  }

  if (!spreadData) {
    return (
      <div>
        <h2 style={{ 
          marginBottom: '1.5rem', 
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#262730'
        }}>
          Cash-3M Spread分析
        </h2>
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: '0.5rem',
          color: '#92400e',
          fontSize: '0.875rem'
        }}>
          Cashまたは3Mのデータが見つかりません。Prompt名を確認してください。
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ 
        marginBottom: '1.5rem', 
        fontSize: '1.5rem',
        fontWeight: 600,
        color: '#262730'
      }}>
        Cash-3M Spread分析
      </h2>

      {/* テーブル - Streamlit風 */}
      <div style={{ 
        marginBottom: '2rem', 
        overflowX: 'auto',
        border: '1px solid #e0e0e0',
        borderRadius: '0.5rem'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: '0.875rem',
          backgroundColor: '#ffffff'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#fafafa' }}>
              <th style={{ 
                padding: '0.75rem', 
                borderBottom: '1px solid #e0e0e0', 
                textAlign: 'left',
                fontWeight: 600,
                color: '#262730'
              }}>
                項目
              </th>
              <th style={{ 
                padding: '0.75rem', 
                borderBottom: '1px solid #e0e0e0', 
                textAlign: 'right',
                fontWeight: 600,
                color: '#262730'
              }}>
                値
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '0.75rem', color: '#262730' }}>Spread({dateStart})</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(spreadData.spreadStart)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '0.75rem', color: '#262730' }}>Spread({dateEnd})</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(spreadData.spreadEnd)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '0.75rem', color: '#262730' }}>Spread変動</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(spreadData.spreadChange)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '0.75rem', color: '#262730' }}>Spread Qty({dateStart})</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(spreadData.spreadQtyStart)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '0.75rem', color: '#262730' }}>Spread Qty({dateEnd})</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(spreadData.spreadQtyEnd)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '0.75rem', color: '#262730' }}>Spread P/L(Hold)</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(spreadData.spreadPLHold)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '0.75rem', color: '#262730' }}>Spread P/L(Actual)</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(spreadData.spreadPLActual)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Spread推移グラフ */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ 
          marginBottom: '1rem', 
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#262730'
        }}>
          Spread推移
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={[
              { date: dateStart, Spread: spreadData.spreadStart },
              { date: dateEnd, Spread: spreadData.spreadEnd }
            ]}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => formatNumber(value)}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Spread" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { calculatePLData, safeGetValue } from '@/utils/calculations'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

interface Tab1Props {
  priceData: any
  qtyData: any
  dateStart: string
  dateEnd: string
}

export default function Tab1({ priceData, qtyData, dateStart, dateEnd }: Tab1Props) {
  const plData = useMemo(() => {
    return calculatePLData(priceData, qtyData, dateStart, dateEnd)
  }, [priceData, qtyData, dateStart, dateEnd])

  const totalHoldPL = plData.reduce((sum, d) => sum + d.holdPL, 0)
  const totalActualPL = plData.reduce((sum, d) => sum + d.actualPL, 0)

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(num))
  }

  return (
    <div>
      <h2 style={{ 
        marginBottom: '1.5rem', 
        fontSize: '1.5rem',
        fontWeight: 600,
        color: '#262730'
      }}>
        限月別損益
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
                Prompt
              </th>
              <th style={{ 
                padding: '0.75rem', 
                borderBottom: '1px solid #e0e0e0', 
                textAlign: 'right',
                fontWeight: 600,
                color: '#262730'
              }}>
                数量({dateStart})
              </th>
              <th style={{ 
                padding: '0.75rem', 
                borderBottom: '1px solid #e0e0e0', 
                textAlign: 'right',
                fontWeight: 600,
                color: '#262730'
              }}>
                数量({dateEnd})
              </th>
              <th style={{ 
                padding: '0.75rem', 
                borderBottom: '1px solid #e0e0e0', 
                textAlign: 'right',
                fontWeight: 600,
                color: '#262730'
              }}>
                価格({dateStart})
              </th>
              <th style={{ 
                padding: '0.75rem', 
                borderBottom: '1px solid #e0e0e0', 
                textAlign: 'right',
                fontWeight: 600,
                color: '#262730'
              }}>
                価格({dateEnd})
              </th>
              <th style={{ 
                padding: '0.75rem', 
                borderBottom: '1px solid #e0e0e0', 
                textAlign: 'right',
                fontWeight: 600,
                color: '#262730'
              }}>
                価格変動
              </th>
              <th style={{ 
                padding: '0.75rem', 
                borderBottom: '1px solid #e0e0e0', 
                textAlign: 'right',
                fontWeight: 600,
                color: '#262730'
              }}>
                Hold P/L
              </th>
              <th style={{ 
                padding: '0.75rem', 
                borderBottom: '1px solid #e0e0e0', 
                textAlign: 'right',
                fontWeight: 600,
                color: '#262730'
              }}>
                Actual P/L
              </th>
            </tr>
          </thead>
          <tbody>
            {plData.map((d, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '0.75rem', color: '#262730' }}>{d.prompt}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(d.qtyStart)}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(d.qtyEnd)}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(d.priceStart)}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(d.priceEnd)}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(d.priceChange)}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(d.holdPL)}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(d.actualPL)}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#f9fafb', fontWeight: 600, borderTop: '2px solid #e0e0e0' }}>
              <td style={{ padding: '0.75rem', color: '#262730' }}>合計</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>
                {formatNumber(plData.reduce((sum, d) => sum + d.qtyStart, 0))}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>
                {formatNumber(plData.reduce((sum, d) => sum + d.qtyEnd, 0))}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#808495' }}>-</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#808495' }}>-</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#808495' }}>-</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(totalHoldPL)}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(totalActualPL)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* グラフ */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ 
          marginBottom: '1rem', 
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#262730'
        }}>
          限月別P/L比較
        </h3>
        <Plot
          data={[
            {
              x: plData.map(d => d.prompt),
              y: plData.map(d => d.holdPL),
              name: 'Hold P/L',
              type: 'bar',
              marker: { color: 'lightblue' }
            },
            {
              x: plData.map(d => d.prompt),
              y: plData.map(d => d.actualPL),
              name: 'Actual P/L',
              type: 'bar',
              marker: { color: 'lightcoral' }
            }
          ]}
          layout={{
            title: '限月別P/L比較（USD）',
            xaxis: { title: '限月' },
            yaxis: { title: 'P/L (USD)' },
            barmode: 'group',
            height: 500
          }}
          style={{ width: '100%', height: '500px' }}
        />
      </div>
    </div>
  )
}


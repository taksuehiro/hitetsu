'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { calculatePLData } from '@/utils/calculations'

interface Tab3Props {
  priceData: any
  qtyData: any
  dateStart: string
  dateEnd: string
}

export default function Tab3({ priceData, qtyData, dateStart, dateEnd }: Tab3Props) {
  const plData = useMemo(() => {
    return calculatePLData(priceData, qtyData, dateStart, dateEnd)
  }, [priceData, qtyData, dateStart, dateEnd])

  const totalHoldPL = plData.reduce((sum, d) => sum + d.holdPL, 0)
  const totalActualPL = plData.reduce((sum, d) => sum + d.actualPL, 0)
  const strategyEffect = totalActualPL - totalHoldPL

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
        戦略比較: Hold vs Actual
      </h2>

      {/* 戦略比較テーブル - Streamlit風 */}
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
                戦略
              </th>
              <th style={{ 
                padding: '0.75rem', 
                borderBottom: '1px solid #e0e0e0', 
                textAlign: 'right',
                fontWeight: 600,
                color: '#262730'
              }}>
                Total P/L
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '0.75rem', color: '#262730' }}>Hold</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(totalHoldPL)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '0.75rem', color: '#262730' }}>Actual</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(totalActualPL)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '0.75rem', color: '#262730' }}>Strategy Effect</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(strategyEffect)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* P/L分解（BarChartで代替） */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ 
          marginBottom: '1rem', 
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#262730'
        }}>
          P/L分解
        </h3>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={[
              { name: 'Hold P/L', value: totalHoldPL },
              { name: 'ポジション変更効果', value: strategyEffect },
              { name: 'Actual P/L', value: totalActualPL }
            ]}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => formatNumber(value)}
            />
            <Legend />
            <Bar dataKey="value">
              {[
                { value: totalHoldPL },
                { value: strategyEffect },
                { value: totalActualPL }
              ].map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={
                    index === 0 ? '#3b82f6' : // Hold P/L: 青
                    index === 1 ? (strategyEffect >= 0 ? '#10b981' : '#ef4444') : // 効果: 緑/赤
                    '#8b5cf6' // Actual P/L: 紫
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 限月別内訳 */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ 
          marginBottom: '1rem', 
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#262730'
        }}>
          限月別内訳
        </h3>
        <div style={{ 
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
                  限月
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
                <th style={{ 
                  padding: '0.75rem', 
                  borderBottom: '1px solid #e0e0e0', 
                  textAlign: 'right',
                  fontWeight: 600,
                  color: '#262730'
                }}>
                  差分
                </th>
              </tr>
            </thead>
            <tbody>
              {plData.map((d, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '0.75rem', color: '#262730' }}>{d.prompt}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(d.holdPL)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>{formatNumber(d.actualPL)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#262730' }}>
                    {formatNumber(d.actualPL - d.holdPL)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


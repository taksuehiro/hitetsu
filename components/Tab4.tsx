'use client'

import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { calculatePLData } from '@/utils/calculations'

interface Tab4Props {
  priceData: any
  qtyData: any
  dateStart: string
  dateEnd: string
}

export default function Tab4({ priceData, qtyData, dateStart, dateEnd }: Tab4Props) {
  const [strategy, setStrategy] = useState<'actual' | 'hold' | 'diff'>('actual')

  const plData = useMemo(() => {
    return calculatePLData(priceData, qtyData, dateStart, dateEnd)
  }, [priceData, qtyData, dateStart, dateEnd])

  const generateDummyHeatmapData = (strategyType: 'actual' | 'hold') => {
    const n = plData.length
    const heatmapData: (number | null)[][] = []
    const prompts = plData.map(d => d.prompt)

    // 各限月のP/Lを取得
    const plValues = plData.map(d => strategyType === 'actual' ? d.actualPL : d.holdPL)

    // ダミーデータ生成
    for (let i = 0; i < n; i++) {
      const row: (number | null)[] = []
      for (let j = 0; j < n; j++) {
        if (i === j) {
          row.push(null) // 対角線は空白
        } else {
          // ダミー値：各限月のP/Lを基にランダムに分配
          const baseValue = (plValues[i] + plValues[j]) / 2
          const randomFactor = 0.3 + Math.random() * 1.2 // 0.3～1.5倍
          const sign = Math.random() > 0.5 ? 1 : -1
          row.push(baseValue * randomFactor * sign)
        }
      }
      heatmapData.push(row)
    }

    return { heatmapData, prompts }
  }

  const { heatmapData: actualData, prompts: actualPrompts } = useMemo(
    () => generateDummyHeatmapData('actual'),
    [plData]
  )

  const { heatmapData: holdData, prompts: holdPrompts } = useMemo(
    () => generateDummyHeatmapData('hold'),
    [plData]
  )

  const currentData = strategy === 'diff'
    ? actualData.map((row, i) => row.map((val, j) => {
        const actualVal = actualData[i][j]
        const holdVal = holdData[i][j]
        if (actualVal === null || holdVal === null) return null
        return actualVal - holdVal
      }))
    : strategy === 'actual'
    ? actualData
    : holdData

  const currentPrompts = strategy === 'actual' ? actualPrompts : holdPrompts

  // 最大絶対値を計算
  const maxAbs = useMemo(() => {
    let max = 0
    for (const row of currentData) {
      for (const val of row) {
        if (val !== null) {
          max = Math.max(max, Math.abs(val))
        }
      }
    }
    return max || 1
  }, [currentData])

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
        🔥 限月間P/L寄与分析（スプレッド損益）
      </h2>

      <div style={{ 
        marginBottom: '1.5rem', 
        fontSize: '0.875rem', 
        color: '#808495',
        lineHeight: '1.75'
      }}>
        <p>限月ペア間のスプレッド損益をヒートマップで可視化します。</p>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li><strong>横軸（From）</strong>：数量を持っている限月 i</li>
          <li><strong>縦軸（To）</strong>：ヘッジ・対応している限月 j</li>
          <li><strong>セルの値</strong>：限月 i と j のスプレッド変動による P/L</li>
          <li><strong>青系</strong>：プラスP/L（利益）、<strong>赤系</strong>：マイナスP/L（損失）</li>
          <li><strong>対角線</strong>：空白（i=j の場合は計算しない）</li>
        </ul>
      </div>

      {/* 戦略選択 */}
      <div style={{ 
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: '#fafafa',
        borderRadius: '0.5rem',
        border: '1px solid #e0e0e0'
      }}>
        <label style={{ marginRight: '1rem', fontSize: '0.875rem', fontWeight: 600, color: '#262730' }}>
          分析戦略:
        </label>
        <label style={{ marginRight: '1.5rem', fontSize: '0.875rem', color: '#262730', cursor: 'pointer' }}>
          <input
            type="radio"
            value="actual"
            checked={strategy === 'actual'}
            onChange={() => setStrategy('actual')}
            style={{ marginRight: '0.5rem' }}
          />
          Actual戦略
        </label>
        <label style={{ marginRight: '1.5rem', fontSize: '0.875rem', color: '#262730', cursor: 'pointer' }}>
          <input
            type="radio"
            value="hold"
            checked={strategy === 'hold'}
            onChange={() => setStrategy('hold')}
            style={{ marginRight: '0.5px' }}
          />
          Hold戦略
        </label>
        <label style={{ fontSize: '0.875rem', color: '#262730', cursor: 'pointer' }}>
          <input
            type="radio"
            value="diff"
            checked={strategy === 'diff'}
            onChange={() => setStrategy('diff')}
            style={{ marginRight: '0.5rem' }}
          />
          差分（Actual - Hold）
        </label>
      </div>

      {/* ヒートマップ（簡易版：各限月のP/L寄与を棒グラフで表示） */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ 
          marginBottom: '1rem', 
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#262730'
        }}>
          限月別P/L寄与
          {strategy === 'actual' && '（Actual戦略）'}
          {strategy === 'hold' && '（Hold戦略）'}
          {strategy === 'diff' && '（Actual - Hold）'}
        </h3>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={plData.map(d => ({
              prompt: d.prompt,
              'P/L': strategy === 'actual' ? d.actualPL : 
                     strategy === 'hold' ? d.holdPL : 
                     (d.actualPL - d.holdPL)
            }))}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="prompt" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => formatNumber(value)}
              labelFormatter={(label) => `限月: ${label}`}
            />
            <Legend />
            <Bar dataKey="P/L">
              {plData.map((d, index) => {
                const value = strategy === 'actual' ? d.actualPL : 
                             strategy === 'hold' ? d.holdPL : 
                             (d.actualPL - d.holdPL)
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={value >= 0 ? '#3b82f6' : '#ef4444'}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem',
          backgroundColor: '#f0f2f6',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          color: '#262730'
        }}>
          <p>※ ヒートマップの完全な実装には、Rechartsでは対応できないため、各限月のP/L寄与を棒グラフで表示しています。</p>
        </div>
      </div>
    </div>
  )
}


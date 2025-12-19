'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import Tab1 from '@/components/Tab1'
import Tab2 from '@/components/Tab2'
import Tab3 from '@/components/Tab3'
import Tab4 from '@/components/Tab4'
import { processExcelData } from '@/utils/dataProcessor'

export default function Home() {
  const [priceData, setPriceData] = useState<any>(null)
  const [qtyData, setQtyData] = useState<any>(null)
  const [dateStart, setDateStart] = useState<string>('')
  const [dateEnd, setDateEnd] = useState<string>('')
  const [activeTab, setActiveTab] = useState(0)
  const [error, setError] = useState<string>('')

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      
      const result = processExcelData(workbook)
      
      if (result.error) {
        setError(result.error)
        return
      }

      setPriceData(result.priceData)
      setQtyData(result.qtyData)
      setDateStart(result.dateStart)
      setDateEnd(result.dateEnd)
      setError('')
    } catch (err: any) {
      setError(`エラー: ${err.message}`)
    }
  }

  const tabs = [
    { id: 0, label: '📊 限月別P/L', component: Tab1 },
    { id: 1, label: '📈 Spread分析', component: Tab2 },
    { id: 2, label: '🔄 戦略比較', component: Tab3 },
    { id: 3, label: '🔥 限月間P/L寄与分析', component: Tab4 },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* サイドバー - Streamlit風 */}
      <aside style={{
        width: '264px',
        padding: '1rem',
        backgroundColor: '#f0f2f6',
        borderRight: '1px solid rgba(250, 250, 250, 0.2)',
        minHeight: '100vh'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ 
            marginBottom: '1rem', 
            fontSize: '1.25rem', 
            fontWeight: 600,
            color: '#262730'
          }}>
            データ入力
          </h2>
          <div style={{
            position: 'relative',
            marginBottom: '1rem'
          }}>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileUpload}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            />
          </div>
          {error && (
            <div style={{ 
              padding: '0.75rem',
              marginTop: '0.5rem',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              color: '#991b1b'
            }}>
              {error}
            </div>
          )}
          {priceData && qtyData && (
            <div style={{ 
              padding: '0.75rem',
              marginTop: '1rem',
              backgroundColor: '#d1fae5',
              border: '1px solid #a7f3d0',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              color: '#065f46'
            }}>
              ✓ データ読み込み完了
              <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem' }}>
                分析期間: {dateStart} → {dateEnd}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* メインコンテンツ - Streamlit風 */}
      <main style={{ 
        flex: 1, 
        padding: '2rem 3rem',
        backgroundColor: '#ffffff',
        maxWidth: 'calc(100vw - 264px)'
      }}>
        <h1 style={{ 
          marginBottom: '1.5rem', 
          fontSize: '2.25rem',
          fontWeight: 700,
          color: '#262730'
        }}>
          非鉄金属ポジション損益シミュレーター（MVP）
        </h1>

        {!priceData || !qtyData ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            color: '#808495',
            backgroundColor: '#fafafa',
            borderRadius: '0.5rem',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
              👈 サイドバーからExcelファイルをアップロードしてください
            </div>
            <div style={{ 
              marginTop: '2rem', 
              fontSize: '0.875rem', 
              textAlign: 'left', 
              maxWidth: '600px', 
              margin: '2rem auto',
              padding: '1.5rem',
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 600 }}>データ形式について</h3>
              <p style={{ marginBottom: '0.75rem' }}>Excelファイルには以下の2つのシートが必要です：</p>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', lineHeight: '1.75' }}>
                <li><strong>価格シート</strong>: Prompt列と日付列（例: 1月末、2月末）</li>
                <li><strong>数量シート</strong>: Prompt列と日付列（例: 1月末、2月末）</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {/* 分析期間表示 */}
            <div style={{
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              backgroundColor: '#e0f2fe',
              border: '1px solid #bae6fd',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              color: '#0c4a6e'
            }}>
              分析期間: {dateStart} → {dateEnd}
            </div>

            {/* タブナビゲーション - Streamlit風 */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e0e0e0',
              marginBottom: '1.5rem',
              gap: '0'
            }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '3px solid #ff4b4b' : '3px solid transparent',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    color: activeTab === tab.id ? '#262730' : '#808495',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* タブコンテンツ */}
            {tabs.map((tab) => {
              const Component = tab.component
              return (
                <div
                  key={tab.id}
                  style={{ display: activeTab === tab.id ? 'block' : 'none' }}
                >
                  <Component
                    priceData={priceData}
                    qtyData={qtyData}
                    dateStart={dateStart}
                    dateEnd={dateEnd}
                  />
                </div>
              )
            })}
          </>
        )}
      </main>
    </div>
  )
}


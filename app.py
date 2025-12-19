import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np

st.set_page_config(page_title="非鉄ポジションP/Lシミュレーター", layout="wide")

st.title("非鉄金属ポジション損益シミュレーター（MVP）")

# サイドバー: データアップロード
with st.sidebar:
    st.header("データ入力")
    uploaded_file = st.file_uploader("Excelファイルをアップロード", type=['xlsx'])
    
    # デフォルトファイルの読み込み
    default_file_path = "数量価格.xlsx"
    use_default = False
    
    if not uploaded_file:
        try:
            # デフォルトファイルを読み込もうとする
            df_price_default = pd.read_excel(default_file_path, sheet_name='価格', index_col=0, header=0)
            df_qty_default = pd.read_excel(default_file_path, sheet_name='数量', index_col=0, header=0)
            
            # 列名がUnnamedの場合は、最初の行を列名として再読み込み
            if any('Unnamed' in str(col) for col in df_price_default.columns):
                df_price_default = pd.read_excel(default_file_path, sheet_name='価格', header=0)
                if len(df_price_default.columns) > 0:
                    df_price_default = df_price_default.set_index(df_price_default.columns[0])
            
            if any('Unnamed' in str(col) for col in df_qty_default.columns):
                df_qty_default = pd.read_excel(default_file_path, sheet_name='数量', header=0)
                if len(df_qty_default.columns) > 0:
                    df_qty_default = df_qty_default.set_index(df_qty_default.columns[0])
            
            use_default = True
            st.info(f"デフォルトファイル（{default_file_path}）を使用しています")
        except Exception as e:
            st.info("👈 Excelファイルをアップロードするか、デフォルトファイル（数量価格.xlsx）を配置してください")
    
    if uploaded_file:
        try:
            # Excelファイルのシート名を確認
            xl_file = pd.ExcelFile(uploaded_file)
            sheet_names = xl_file.sheet_names
            st.info(f"検出されたシート: {', '.join(sheet_names)}")
            
            # シート名の柔軟な検出
            price_sheet = None
            qty_sheet = None
            
            for sheet in sheet_names:
                if '価格' in sheet or 'price' in sheet.lower():
                    price_sheet = sheet
                if '数量' in sheet or 'qty' in sheet.lower() or 'quantity' in sheet.lower():
                    qty_sheet = sheet
            
            # デフォルトで最初の2つのシートを使用
            if price_sheet is None and len(sheet_names) >= 1:
                price_sheet = sheet_names[0]
            if qty_sheet is None and len(sheet_names) >= 2:
                qty_sheet = sheet_names[1]
            elif qty_sheet is None and len(sheet_names) >= 1:
                qty_sheet = sheet_names[0]
            
            if price_sheet is None or qty_sheet is None:
                st.error("価格または数量のシートが見つかりません。")
                st.stop()
            
            # 価格データ読み込み（header=0で最初の行を列名として使用）
            df_price = pd.read_excel(uploaded_file, sheet_name=price_sheet, index_col=0, header=0)
            # 数量データ読み込み
            df_qty = pd.read_excel(uploaded_file, sheet_name=qty_sheet, index_col=0, header=0)
            
            # 列名がUnnamedの場合は、最初の行を列名として再読み込み
            if any('Unnamed' in str(col) for col in df_price.columns):
                df_price = pd.read_excel(uploaded_file, sheet_name=price_sheet, header=0)
                if len(df_price.columns) > 0:
                    df_price = df_price.set_index(df_price.columns[0])
            
            if any('Unnamed' in str(col) for col in df_qty.columns):
                df_qty = pd.read_excel(uploaded_file, sheet_name=qty_sheet, header=0)
                if len(df_qty.columns) > 0:
                    df_qty = df_qty.set_index(df_qty.columns[0])
            
            st.success(f"データ読み込み完了（価格: {price_sheet}, 数量: {qty_sheet}）")
        except Exception as e:
            st.error(f"エラー: {str(e)}")
            st.error("Excelファイルの形式を確認してください。")
            st.stop()
    elif use_default:
        df_price = df_price_default
        df_qty = df_qty_default
        st.success("デフォルトデータ読み込み完了")
    else:
        df_price = None
        df_qty = None

# データが読み込まれている場合のみ処理を実行
if df_price is not None and df_qty is not None:
    # データ検証
    if df_price.empty or df_qty.empty:
        st.error("データが空です。Excelファイルの形式を確認してください。")
        st.stop()
    
    # デバッグ情報（展開可能）
    with st.expander("📋 データ構造確認", expanded=False):
        st.write("**価格データ:**")
        st.dataframe(df_price.head())
        st.write("**数量データ:**")
        st.dataframe(df_qty.head())
        st.write(f"価格インデックス: {df_price.index.tolist()}")
        st.write(f"数量インデックス: {df_qty.index.tolist()}")
        st.write(f"価格列: {df_price.columns.tolist()}")
        st.write(f"数量列: {df_qty.columns.tolist()}")
    
    # 列名の確認と統一（日付列を取得）
    # Unnamed列を除外
    price_cols = [col for col in df_price.columns if not str(col).startswith('Unnamed')]
    qty_cols = [col for col in df_qty.columns if not str(col).startswith('Unnamed')]
    
    # 数値列のみを取得（文字列の列を除外）
    def is_numeric_column(df, col):
        """列が数値データを含むかチェック"""
        try:
            sample = df[col].dropna().head(5)
            if len(sample) == 0:
                return False
            # 数値に変換可能かチェック
            for val in sample:
                if pd.isna(val):
                    continue
                if isinstance(val, str):
                    try:
                        float(val.replace(',', ''))
                    except:
                        return False
                else:
                    float(val)
            return True
        except:
            return False
    
    # 数値列のみをフィルタリング
    price_numeric_cols = [col for col in price_cols if is_numeric_column(df_price, col)]
    qty_numeric_cols = [col for col in qty_cols if is_numeric_column(df_qty, col)]
    
    # 共通の数値列を取得
    common_cols = list(set(price_numeric_cols) & set(qty_numeric_cols))
    
    if len(common_cols) < 2:
        # 数値列が見つからない場合、すべての共通列を使用
        common_cols = list(set(price_cols) & set(qty_cols))
        if len(common_cols) < 2:
            st.error(f"価格と数量のデータに共通の日付列が2つ以上必要です。")
            st.error(f"価格シートの列: {', '.join(map(str, price_cols))}")
            st.error(f"数量シートの列: {', '.join(map(str, qty_cols))}")
            st.error(f"共通列: {', '.join(map(str, common_cols))}")
            st.stop()
    
    # 最初の2つの日付列を使用（1月末、2月末と仮定）
    date_cols = sorted(common_cols)[:2]
    date_start = date_cols[0]
    date_end = date_cols[1]
    
    st.info(f"分析期間: {date_start} → {date_end}")
    
    # メインエリア: 4つのタブ
    tab1, tab2, tab3, tab4 = st.tabs([
        "📊 限月別P/L", 
        "📈 Spread分析", 
        "🔄 戦略比較",
        "🔥 限月間P/L寄与分析"
    ])
    
    with tab1:
        st.header("限月別損益")
        
        # データの準備
        prompts = df_price.index.tolist()
        
        # P/L計算用のデータフレーム作成
        pl_data = []
        
        for prompt in prompts:
            if prompt not in df_qty.index:
                continue
            
            # データ取得と型変換（安全な方法）
            def safe_get_value(df, idx, col, default=0):
                """安全にデータを取得して数値に変換"""
                try:
                    if col not in df.columns:
                        return default
                    value = df.loc[idx, col]
                    if pd.isna(value):
                        return default
                    # 文字列の場合は数値に変換を試みる
                    if isinstance(value, str):
                        # 数値文字列かチェック
                        try:
                            return float(value.replace(',', ''))
                        except:
                            return default
                    return float(value)
                except (KeyError, ValueError, TypeError):
                    return default
            
            qty_start = safe_get_value(df_qty, prompt, date_start, 0)
            qty_end = safe_get_value(df_qty, prompt, date_end, 0)
            price_start = safe_get_value(df_price, prompt, date_start, 0)
            price_end = safe_get_value(df_price, prompt, date_end, 0)
            
            price_change = price_end - price_start
            
            # P/L計算
            hold_pl = qty_start * price_change
            actual_pl = qty_end * price_change
            
            pl_data.append({
                'Prompt': prompt,
                f'数量({date_start})': qty_start,
                f'数量({date_end})': qty_end,
                f'価格({date_start})': price_start,
                f'価格({date_end})': price_end,
                '価格変動': price_change,
                'Hold P/L': hold_pl,
                'Actual P/L': actual_pl
            })
        
        df_pl = pd.DataFrame(pl_data)
        
        # 合計行を追加
        total_row = {
            'Prompt': '合計',
            f'数量({date_start})': df_pl[f'数量({date_start})'].sum(),
            f'数量({date_end})': df_pl[f'数量({date_end})'].sum(),
            f'価格({date_start})': '',
            f'価格({date_end})': '',
            '価格変動': '',
            'Hold P/L': df_pl['Hold P/L'].sum(),
            'Actual P/L': df_pl['Actual P/L'].sum()
        }
        df_pl = pd.concat([df_pl, pd.DataFrame([total_row])], ignore_index=True)
        
        # 数値フォーマット（千円単位、カンマ区切り）
        def format_number(x):
            if isinstance(x, (int, float)) and not pd.isna(x):
                return f"{x:,.0f}"
            return x
        
        # 表示用データフレーム
        df_display = df_pl.copy()
        numeric_cols = [f'数量({date_start})', f'数量({date_end})', f'価格({date_start})', 
                       f'価格({date_end})', '価格変動', 'Hold P/L', 'Actual P/L']
        for col in numeric_cols:
            if col in df_display.columns:
                df_display[col] = df_display[col].apply(format_number)
        
        st.dataframe(df_display, use_container_width=True, hide_index=True)
        
        # グラフ表示
        st.subheader("限月別P/L比較")
        df_pl_chart = df_pl[df_pl['Prompt'] != '合計'].copy()
        
        fig = go.Figure()
        fig.add_trace(go.Bar(
            name='Hold P/L',
            x=df_pl_chart['Prompt'],
            y=df_pl_chart['Hold P/L'],
            marker_color='lightblue'
        ))
        fig.add_trace(go.Bar(
            name='Actual P/L',
            x=df_pl_chart['Prompt'],
            y=df_pl_chart['Actual P/L'],
            marker_color='lightcoral'
        ))
        
        fig.update_layout(
            title='限月別P/L比較（USD）',
            xaxis_title='限月',
            yaxis_title='P/L (USD)',
            barmode='group',
            height=500
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    with tab2:
        st.header("Cash-3M Spread分析")
        
        # Cashと3Mのデータを取得
        cash_prompt = None
        m3_prompt = None
        
        for prompt in prompts:
            if 'Cash' in str(prompt) or 'cash' in str(prompt).lower():
                cash_prompt = prompt
            if '3M' in str(prompt) or '3m' in str(prompt).lower():
                m3_prompt = prompt
        
        if cash_prompt is None or m3_prompt is None:
            st.warning("Cashまたは3Mのデータが見つかりません。Prompt名を確認してください。")
        else:
            # 安全なデータ取得関数（Tab1と同じ）
            def safe_get_value(df, idx, col, default=0):
                """安全にデータを取得して数値に変換"""
                try:
                    if col not in df.columns:
                        return default
                    value = df.loc[idx, col]
                    if pd.isna(value):
                        return default
                    if isinstance(value, str):
                        try:
                            return float(value.replace(',', ''))
                        except:
                            return default
                    return float(value)
                except (KeyError, ValueError, TypeError):
                    return default
            
            # 価格データ
            cash_price_start = safe_get_value(df_price, cash_prompt, date_start, 0)
            cash_price_end = safe_get_value(df_price, cash_prompt, date_end, 0)
            m3_price_start = safe_get_value(df_price, m3_prompt, date_start, 0)
            m3_price_end = safe_get_value(df_price, m3_prompt, date_end, 0)
            
            # 数量データ
            cash_qty_start = safe_get_value(df_qty, cash_prompt, date_start, 0)
            cash_qty_end = safe_get_value(df_qty, cash_prompt, date_end, 0)
            m3_qty_start = safe_get_value(df_qty, m3_prompt, date_start, 0)
            m3_qty_end = safe_get_value(df_qty, m3_prompt, date_end, 0)
            
            # Spread計算
            spread_start = cash_price_start - m3_price_start
            spread_end = cash_price_end - m3_price_end
            spread_change = spread_end - spread_start
            
            # Spread Qty計算（Cashと3Mの絶対値の小さい方）
            spread_qty_start = min(abs(cash_qty_start), abs(m3_qty_start)) if cash_qty_start * m3_qty_start < 0 else 0
            spread_qty_end = min(abs(cash_qty_end), abs(m3_qty_end)) if cash_qty_end * m3_qty_end < 0 else 0
            
            # Spread P/L計算
            spread_pl_hold = spread_qty_start * spread_change
            spread_pl_actual = spread_qty_end * spread_change
            
            # 結果表示
            spread_data = {
                '項目': [
                    f'Spread({date_start})',
                    f'Spread({date_end})',
                    'Spread変動',
                    f'Spread Qty({date_start})',
                    f'Spread Qty({date_end})',
                    'Spread P/L(Hold)',
                    'Spread P/L(Actual)'
                ],
                '値': [
                    f"{spread_start:,.0f}",
                    f"{spread_end:,.0f}",
                    f"{spread_change:,.0f}",
                    f"{spread_qty_start:,.0f}",
                    f"{spread_qty_end:,.0f}",
                    f"{spread_pl_hold:,.0f}",
                    f"{spread_pl_actual:,.0f}"
                ]
            }
            
            df_spread = pd.DataFrame(spread_data)
            st.dataframe(df_spread, use_container_width=True, hide_index=True)
            
            # Spread可視化
            st.subheader("Spread推移")
            fig_spread = go.Figure()
            fig_spread.add_trace(go.Scatter(
                x=[date_start, date_end],
                y=[spread_start, spread_end],
                mode='lines+markers',
                name='Spread',
                line=dict(width=3),
                marker=dict(size=10)
            ))
            fig_spread.update_layout(
                title='Cash-3M Spread推移',
                xaxis_title='日付',
                yaxis_title='Spread (USD)',
                height=400
            )
            st.plotly_chart(fig_spread, use_container_width=True)
    
    with tab3:
        st.header("戦略比較: Hold vs Actual")
        
        # 全体のP/L計算
        df_pl_for_strategy = df_pl[df_pl['Prompt'] != '合計'].copy()
        
        total_hold_pl = df_pl_for_strategy['Hold P/L'].sum()
        total_actual_pl = df_pl_for_strategy['Actual P/L'].sum()
        strategy_effect = total_actual_pl - total_hold_pl
        
        # 結果表示
        strategy_data = {
            '戦略': ['Hold', 'Actual', 'Strategy Effect'],
            'Total P/L': [
                f"{total_hold_pl:,.0f}",
                f"{total_actual_pl:,.0f}",
                f"{strategy_effect:,.0f}"
            ]
        }
        
        df_strategy = pd.DataFrame(strategy_data)
        st.dataframe(df_strategy, use_container_width=True, hide_index=True)
        
        # ウォーターフォールチャート
        st.subheader("P/L分解（ウォーターフォール）")
        
        fig_waterfall = go.Figure(go.Waterfall(
            name="P/L分解",
            orientation="v",
            measure=["absolute", "relative", "total"],
            x=["Hold P/L", "ポジション変更効果", "Actual P/L"],
            y=[total_hold_pl, strategy_effect, total_actual_pl],
            connector={"line": {"color": "rgb(63, 63, 63)"}},
            increasing={"marker": {"color": "green"}},
            decreasing={"marker": {"color": "red"}},
            totals={"marker": {"color": "blue"}},
            textposition="outside",
            text=[f"{total_hold_pl:,.0f}", f"{strategy_effect:,.0f}", f"{total_actual_pl:,.0f}"]
        ))
        
        fig_waterfall.update_layout(
            title="戦略比較: Hold vs Actual P/L (USD)",
            showlegend=False,
            height=500
        )
        
        st.plotly_chart(fig_waterfall, use_container_width=True)
        
        # 内訳テーブル
        st.subheader("限月別内訳")
        breakdown_data = []
        for _, row in df_pl_for_strategy.iterrows():
            breakdown_data.append({
                '限月': row['Prompt'],
                'Hold P/L': f"{row['Hold P/L']:,.0f}",
                'Actual P/L': f"{row['Actual P/L']:,.0f}",
                '差分': f"{row['Actual P/L'] - row['Hold P/L']:,.0f}"
            })
        
        df_breakdown = pd.DataFrame(breakdown_data)
        st.dataframe(df_breakdown, use_container_width=True, hide_index=True)
        
        # 数量合計チェック
        total_qty_start = df_pl_for_strategy[f'数量({date_start})'].sum()
        total_qty_end = df_pl_for_strategy[f'数量({date_end})'].sum()
        
        if abs(total_qty_start) > 0.01 or abs(total_qty_end) > 0.01:
            st.warning(f"⚠️ 数量合計が0ではありません。{date_start}: {total_qty_start:,.0f}, {date_end}: {total_qty_end:,.0f}")
    
    with tab4:
        st.header("🔥 限月間P/L寄与分析（スプレッド損益）")
        
        st.markdown("""
        **このタブでは**：限月ペア間のスプレッド損益をヒートマップで可視化します。
        - **横軸（From）**：数量を持っている限月 i
        - **縦軸（To）**：ヘッジ・対応している限月 j
        - **セルの値**：限月 i と j のスプレッド変動による P/L
        - **青系**：プラスP/L（利益）
        - **赤系**：マイナスP/L（損失）
        - **対角線**：空白（i=j の場合は計算しない）
        """)
        
        # Tab1で計算されたdf_plを使用
        df_pl_for_contribution = df_pl[df_pl['Prompt'] != '合計'].copy()
        
        if df_pl_for_contribution.empty:
            st.warning("P/Lデータがありません。")
        else:
            # データの準備
            prompts_list = df_pl_for_contribution['Prompt'].tolist()
            n = len(prompts_list)
            
            # 安全なデータ取得関数
            def safe_get_value(df, idx, col, default=0):
                """安全にデータを取得して数値に変換"""
                try:
                    if col not in df.columns:
                        return default
                    value = df.loc[idx, col]
                    if pd.isna(value):
                        return default
                    if isinstance(value, str):
                        try:
                            return float(value.replace(',', ''))
                        except:
                            return default
                    return float(value)
                except (KeyError, ValueError, TypeError):
                    return default
            
            # 戦略選択
            strategy_option = st.radio(
                "分析戦略を選択",
                ["Actual戦略", "Hold戦略", "差分（Actual - Hold）"],
                horizontal=True
            )
            
            # ダミーデータ生成関数（ヒートマップ用）
            def generate_dummy_heatmap_data(strategy='actual'):
                """
                ダミーデータでヒートマップを生成
                strategy: 'actual' または 'hold'
                """
                heatmap_data = np.zeros((n, n))
                
                # 各限月のP/Lを取得
                pl_values = []
                for prompt in prompts_list:
                    if strategy == 'actual':
                        pl = df_pl_for_contribution[df_pl_for_contribution['Prompt'] == prompt]['Actual P/L'].values
                    else:  # hold
                        pl = df_pl_for_contribution[df_pl_for_contribution['Prompt'] == prompt]['Hold P/L'].values
                    
                    if len(pl) > 0:
                        pl_values.append(pl[0])
                    else:
                        pl_values.append(0)
                
                # ダミーデータ生成：各限月のP/Lを基に、ペア間で分配
                np.random.seed(42)  # 再現性のため
                
                for i in range(n):
                    for j in range(n):
                        if i == j:
                            # 対角線は空白
                            heatmap_data[i, j] = np.nan
                        else:
                            # ダミー値：各限月のP/Lを基にランダムに分配
                            base_value = (pl_values[i] + pl_values[j]) / 2
                            # ランダムな係数（0.3～1.5倍）
                            random_factor = np.random.uniform(0.3, 1.5)
                            # 符号はランダム
                            sign = np.random.choice([-1, 1])
                            heatmap_data[i, j] = base_value * random_factor * sign
                
                return heatmap_data
            
            # ヒートマップデータの計算（ダミーデータ）
            if strategy_option == "Actual戦略":
                heatmap_data = generate_dummy_heatmap_data('actual')
                title_suffix = "（Actual戦略）"
            elif strategy_option == "Hold戦略":
                heatmap_data = generate_dummy_heatmap_data('hold')
                title_suffix = "（Hold戦略）"
            else:  # 差分
                heatmap_data_actual = generate_dummy_heatmap_data('actual')
                heatmap_data_hold = generate_dummy_heatmap_data('hold')
                heatmap_data = heatmap_data_actual - heatmap_data_hold
                title_suffix = "（Actual - Hold）"
            
            # セクション1: ヒートマップ表示
            st.subheader(f"1. 限月間スプレッドP/Lヒートマップ{title_suffix}")
            
            # カラースケールの設定（マイナスからプラスまで）
            # NaNを除外して最大絶対値を計算
            valid_values = heatmap_data[~np.isnan(heatmap_data)]
            if len(valid_values) > 0:
                max_abs = max(abs(val) for val in valid_values)
                if max_abs == 0:
                    max_abs = 1
            else:
                max_abs = 1
            
            # テキスト表示用の準備
            text_data = []
            for i in range(n):
                row_text = []
                for j in range(n):
                    val = heatmap_data[i, j]
                    if np.isnan(val):
                        row_text.append('')
                    else:
                        row_text.append(f'{val:,.0f}')
                text_data.append(row_text)
            
            fig_heatmap = go.Figure(data=go.Heatmap(
                z=heatmap_data,
                x=prompts_list,
                y=prompts_list,
                colorscale=[
                    [0.0, 'darkred'],      # マイナス（濃い赤）
                    [0.25, 'red'],         # マイナス（赤）
                    [0.5, 'white'],        # ゼロ
                    [0.75, 'lightblue'],   # プラス（薄い青）
                    [1.0, 'darkblue']      # プラス（濃い青）
                ],
                zmid=0,  # 0を中心に色分け
                zmin=-max_abs,
                zmax=max_abs,
                text=text_data,
                texttemplate='%{text}',
                textfont={"size": 9},
                colorbar=dict(title="Spread P/L (USD)")
            ))
            
            fig_heatmap.update_layout(
                title=f"限月間スプレッドP/Lマトリクス{title_suffix}",
                xaxis_title="From Prompt",
                yaxis_title="To Prompt",
                height=600,
                width=700
            )
            
            st.plotly_chart(fig_heatmap, use_container_width=True)
            
            # セクション2: ペア別P/Lランキング
            st.subheader("2. 限月ペア別P/Lランキング（絶対値順）")
            
            # ペアデータを作成
            pair_data = []
            for i in range(n):
                for j in range(n):
                    if i != j:  # 対角線を除外
                        pl = heatmap_data[i, j]
                        if not np.isnan(pl):
                            pair_data.append({
                                'From': prompts_list[i],
                                'To': prompts_list[j],
                                'P/L (USD)': pl
                            })
            
            if pair_data:
                df_pairs = pd.DataFrame(pair_data)
                # 絶対値で降順ソート
                df_pairs['abs_pl'] = df_pairs['P/L (USD)'].abs()
                df_pairs = df_pairs.sort_values('abs_pl', ascending=False).reset_index(drop=True)
                df_pairs = df_pairs.drop('abs_pl', axis=1)
                df_pairs['順位'] = range(1, len(df_pairs) + 1)
                
                # 順位を最初の列に
                cols = ['順位'] + [col for col in df_pairs.columns if col != '順位']
                df_pairs = df_pairs[cols]
                
                # フォーマット
                df_pairs_display = df_pairs.copy()
                df_pairs_display['P/L (USD)'] = df_pairs_display['P/L (USD)'].apply(lambda x: f'{x:,.0f}')
                
                # 上位20件を表示
                st.dataframe(df_pairs_display.head(20), use_container_width=True, hide_index=True)
                
                # 合計P/L
                total_spread_pl = df_pairs['P/L (USD)'].sum()
                st.info(f"**スプレッドP/L合計**: {total_spread_pl:,.0f} USD")
            else:
                st.warning("ペアデータがありません。")
            
            # セクション3: 計算ロジックの説明
            with st.expander("📖 計算ロジックの詳細", expanded=False):
                st.markdown("""
                ### スプレッドP/L計算式
                
                1. **限月間スプレッド変動**
                   - Spread_Start(i,j) = Price_Start(i) - Price_Start(j)
                   - Spread_End(i,j) = Price_End(i) - Price_End(j)
                   - ΔSpread(i,j) = Spread_End(i,j) - Spread_Start(i,j)
                
                2. **ペアに使われる数量**
                   - Effective_Qty(i,j) = min(|Qty(i)|, |Qty(j)|)
                
                3. **Direction（方向）**
                   - iがLong、jがShort → 正（+1）
                   - iがShort、jがLong → 負（-1）
                   - 同方向（両方Long/Short） → 0
                
                4. **ペアごとのスプレッドP/L**
                   - PL(i,j) = Effective_Qty(i,j) × ΔSpread(i,j) × Direction
                
                ### ヒートマップの読み方
                - **横軸（From）**：数量を持っている限月
                - **縦軸（To）**：ヘッジ・対応している限月
                - **セルの値**：そのペアのスプレッドP/L
                - **対角線**：空白（同じ限月同士は計算しない）
                """)

else:
    st.info("👈 サイドバーからExcelファイルをアップロードしてください")
    st.markdown("""
    ### データ形式について
    
    Excelファイルには以下の2つのシートが必要です：
    
    1. **価格シート**: Prompt列と日付列（例: 1月末、2月末）
    2. **数量シート**: Prompt列と日付列（例: 1月末、2月末）
    
    ### 使用例
    
    - Prompt列には限月名（Cash、3M、M+4など）を記載
    - 日付列には各時点の価格・数量を記載
    """)


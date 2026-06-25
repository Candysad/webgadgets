import { useEffect, useState } from 'react';
import { HomeButton } from '../../../components/HomeButton';
import { useI18n } from '../../../i18n';
import styles from './JpExchange.module.css';

type BaseCurrency = 'CNY' | 'USD';

interface RateResponse {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

type RateStatus = 'idle' | 'loading' | 'success' | 'error';

const defaultComparisonQuotes = ['THB'];
const pinnedQuote = 'JPY';
const comparisonQuoteOptions = ['EUR', 'RUB', 'ARS', 'UAH', 'THB', 'SGD'];
const chartSpanDays = 30;

const chartStyles: Record<string, { color: string }> = {
  ARS: { color: '#00ffff' },
  EUR: { color: '#ffcc00' },
  JPY: { color: '#f8fafc' },
  RUB: { color: '#d52b1e' },
  SGD: { color: '#22c55e' },
  THB: { color: '#fb923c' },
  UAH: { color: '#3b82f6' },
};

const currencySymbols: Record<string, string> = {
  ARS: '$',
  EUR: '€',
  JPY: '¥',
  RUB: '₽',
  SGD: 'S$',
  THB: '฿',
  UAH: '₴',
};

// 拼装 Frankfurter 的 /rates 查询地址，支持最新汇率和历史区间复用。
function buildRatesUrl(baseCurrency: BaseCurrency, quoteCurrencies?: string[], fromDate?: string) {
  const url = new URL('https://api.frankfurter.dev/v2/rates');
  url.searchParams.set('base', baseCurrency);

  if (quoteCurrencies && quoteCurrencies.length > 0) {
    url.searchParams.set('quotes', quoteCurrencies.join(','));
  }

  if (fromDate) {
    url.searchParams.set('from', fromDate);
  }

  return url;
}

// 生成 Bilibili iframe 播放地址，资源由 aid、bvid 和 cid 共同定位。
function buildBilibiliPlayerUrl(aid: number, bvid: string, cid: number) {
  const params = new URLSearchParams({
    aid: aid.toString(),
    bvid,
    cid: cid.toString(),
    isOutside: 'true',
    p: '1',
  });

  return `//player.bilibili.com/player.html?${params.toString()}`;
}

// 请求 Frankfurter /rates 接口，统一处理批量最新汇率和历史汇率数组。
async function fetchRates(baseCurrency: BaseCurrency, signal: AbortSignal, quoteCurrencies?: string[], fromDate?: string) {
  const response = await fetch(buildRatesUrl(baseCurrency, quoteCurrencies, fromDate), { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch rates for ${baseCurrency}`);
  }

  return (await response.json()) as RateResponse[];
}

// 计算 CNY 和 USD 当前都支持的目标货币交集，供页面下方多选框使用。
async function fetchSharedQuoteCurrencies(signal: AbortSignal) {
  const [cnyRates, usdRates] = await Promise.all([fetchRates('CNY', signal), fetchRates('USD', signal)]);
  const usdQuotes = new Set(usdRates.map((rate) => rate.quote));
  const cnyQuotes = new Set(cnyRates.map((rate) => rate.quote));

  return comparisonQuoteOptions.filter((quoteCurrency) => cnyQuotes.has(quoteCurrency) && usdQuotes.has(quoteCurrency));
}

// 把接口返回的汇率整理成按目标货币索引的数据，方便卡片读取固定货币。
function indexRatesByQuote(rates: RateResponse[]) {
  return rates.reduce<Record<string, RateResponse>>((indexedRates, rate) => {
    indexedRates[rate.quote] = rate;
    return indexedRates;
  }, {});
}

// 返回包含今天在内的最近 30 天日期，用于历史折线图查询。
function getHistoryStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - (chartSpanDays - 1));

  return date.toISOString().slice(0, 10);
}

// 根据当前选择生成图表展示的货币列表，日元始终作为主线保留。
function getVisibleQuotes(selectedQuotes: string[]) {
  return [pinnedQuote, ...selectedQuotes.filter((quoteCurrency) => quoteCurrency !== pinnedQuote)];
}

// 格式化汇率数值，统一保留 3 位小数，避免接口精度直接暴露给界面。
function formatRateValue(value?: number) {
  if (value === undefined) {
    return '--';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 3,
    minimumFractionDigits: 3,
  }).format(value);
}

// 将历史汇率转为以首日为 0 的相对涨跌幅路径，避免不同币种绝对值差异压扁走势。
function buildChartSeries(historyRates: RateResponse[], visibleQuotes: string[]) {
  const dates = Array.from(new Set(historyRates.map((rate) => rate.date))).sort();
  const chartWidth = 1280;
  const chartHeight = 440 + Math.max(0, visibleQuotes.length - 2) * 56;
  const padding = 96;
  const plotWidth = chartWidth - padding * 2;
  const plotHeight = chartHeight - padding * 2;
  const plotEndX = chartWidth - padding;
  const plotEndY = chartHeight - padding;
  const normalizedSeries = visibleQuotes.map((quoteCurrency) => {
    const quoteRates = dates
      .map((date) => historyRates.find((rate) => rate.quote === quoteCurrency && rate.date === date))
      .filter((rate): rate is RateResponse => rate !== undefined);
    const firstRate = quoteRates[0]?.rate ?? 1;

    return quoteRates.map((rate) => ({
      date: rate.date,
      value: ((rate.rate - firstRate) / firstRate) * 100,
    }));
  });
  const values = normalizedSeries.flatMap((series) => series.map((point) => point.value));
  const minValue = values.length > 0 ? Math.min(...values) : -1;
  const maxValue = values.length > 0 ? Math.max(...values) : 1;
  const valueRange = maxValue - minValue || 1;
  const ticks = Array.from({ length: 5 }, (_, index) => {
    const value = maxValue - (index / 4) * valueRange;
    const y = padding + ((maxValue - value) / valueRange) * plotHeight;

    return { label: `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`, value, y };
  });

  const series = visibleQuotes.map((quoteCurrency, index) => {
    const ratesByDate = new Map(
      normalizedSeries[index].map((point) => [point.date, point.value]),
    );
    const rawRatesByDate = new Map(
      historyRates
        .filter((rate) => rate.quote === quoteCurrency)
        .map((rate) => [rate.date, rate.rate]),
    );

    const points = dates
      .map((date, dateIndex) => {
        const value = ratesByDate.get(date);
        const rawRate = rawRatesByDate.get(date);

        if (value === undefined || rawRate === undefined) {
          return null;
        }

        const x = padding + (dates.length <= 1 ? 0 : (dateIndex / (dates.length - 1)) * plotWidth);
        const y = padding + plotHeight - ((value - minValue) / valueRange) * plotHeight;
        return { date, rawRate, value, x, y };
      })
      .filter((point): point is { date: string; rawRate: number; value: number; x: number; y: number } => point !== null);
    const style = chartStyles[quoteCurrency] ?? { color: '#38bdf8' };
    const path = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' L ');

    return {
      color: style.color,
      path: points.length > 0 ? `M ${path}` : '',
      points,
      quote: quoteCurrency,
    };
  });
  const orderedSeries = [
    ...series.filter((item) => item.quote !== pinnedQuote),
    ...series.filter((item) => item.quote === pinnedQuote),
  ];

  const columns = dates.map((date, dateIndex) => ({
    date,
    x: padding + (dates.length <= 1 ? 0 : (dateIndex / (dates.length - 1)) * plotWidth),
  }));

  return { chartHeight, chartWidth, columns, dates, maxValue, minValue, padding, plotEndX, plotEndY, series: orderedSeries, ticks };
}

// 渲染带半字号货币符号的汇率数字，避免符号抢占数字视觉层级。
function renderRateValue(quoteCurrency: string, value?: number) {
  const formattedValue = formatRateValue(value);

  if (formattedValue === '--') {
    return formattedValue;
  }

  const symbol = currencySymbols[quoteCurrency];

  if (!symbol) {
    return formattedValue;
  }

  return (
    <>
      <span className={styles.currencySymbol}>{symbol}</span>
      {formattedValue}
    </>
  );
}

// 根据翻译表返回货币名称，缺少专门名称时回退到货币代码。
function getCurrencyName(quoteNames: Partial<Record<string, string>>, quoteCurrency: string) {
  return quoteNames[quoteCurrency] ?? quoteCurrency;
}

// 读取某一天某个货币的原始汇率和相对首日涨跌幅，用于图表 hover 明细。
function getChartDetail(historyRates: RateResponse[], quoteCurrency: string, date: string) {
  const quoteRates = historyRates.filter((rate) => rate.quote === quoteCurrency);
  const firstRate = quoteRates[0]?.rate;
  const targetRate = quoteRates.find((rate) => rate.date === date)?.rate;

  if (firstRate === undefined || targetRate === undefined) {
    return null;
  }

  return {
    change: ((targetRate - firstRate) / firstRate) * 100,
    rate: targetRate,
  };
}

// 根据鼠标在 SVG 内的位置吸附到最近的日期纵线。
function getNearestChartPoint(clientX: number, svgElement: SVGSVGElement, chart: ReturnType<typeof buildChartSeries>) {
  const bounds = svgElement.getBoundingClientRect();
  const x = ((clientX - bounds.left) / bounds.width) * chart.chartWidth;

  return chart.columns.reduce((nearestColumn, column) => {
    return Math.abs(column.x - x) < Math.abs(nearestColumn.x - x) ? column : nearestColumn;
  }, chart.columns[0]);
}

// 显示 1 人民币或 1 美元兑换多种目标货币的最新汇率与历史走势。
export function JpExchange() {
  const { t } = useI18n();
  const [baseCurrency, setBaseCurrency] = useState<BaseCurrency>('CNY');
  const [availableQuotes, setAvailableQuotes] = useState<string[]>([]);
  const [selectedQuotes, setSelectedQuotes] = useState(defaultComparisonQuotes);
  const [ratesByQuote, setRatesByQuote] = useState<Record<string, RateResponse>>({});
  const [historyRates, setHistoryRates] = useState<RateResponse[]>([]);
  const [rateStatus, setRateStatus] = useState<RateStatus>('idle');
  const [currencyStatus, setCurrencyStatus] = useState<RateStatus>('idle');
  const [activeChartPoint, setActiveChartPoint] = useState<{ date: string; x: number; y: number } | null>(null);
  const [isHumorVisible, setIsHumorVisible] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    setCurrencyStatus('loading');

    fetchSharedQuoteCurrencies(controller.signal)
      .then((sharedQuotes) => {
        setAvailableQuotes(sharedQuotes);
        setSelectedQuotes((currentQuotes) => currentQuotes.filter((quoteCurrency) => sharedQuotes.includes(quoteCurrency)));
        setCurrencyStatus('success');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setCurrencyStatus('error');
      });

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const visibleQuotes = getVisibleQuotes(selectedQuotes);

    setRateStatus('loading');

    Promise.all([
      fetchRates(baseCurrency, controller.signal, visibleQuotes),
      fetchRates(baseCurrency, controller.signal, visibleQuotes, getHistoryStartDate()),
    ])
      .then(([latestRates, historicalRates]) => {
        setRatesByQuote(indexRatesByQuote(latestRates));
        setHistoryRates(historicalRates);
        setRateStatus('success');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setRatesByQuote({});
        setHistoryRates([]);
        setRateStatus('error');
      });

    return () => {
      controller.abort();
    };
  }, [baseCurrency, selectedQuotes]);

  // 在多选框中切换除日元外的对比货币，选中后会同步更新右侧卡片和折线图。
  function toggleQuoteCurrency(quoteCurrency: string) {
    setSelectedQuotes((currentQuotes) => {
      if (currentQuotes.includes(quoteCurrency)) {
        return currentQuotes.filter((currentQuote) => currentQuote !== quoteCurrency);
      }

      return [...currentQuotes, quoteCurrency];
    });
  }

  // 点击后展开或收起 Bilibili 视频 iframe。
  function toggleHumorVideos() {
    setIsHumorVisible((visible) => !visible);
  }

  const isCnySelected = baseCurrency === 'CNY';
  const baseLabel = t.projects.jpExchange.base[baseCurrency];
  const updatedDate = ratesByQuote[pinnedQuote]?.date ?? selectedQuotes.map((quoteCurrency) => ratesByQuote[quoteCurrency]?.date).find((date) => date !== undefined);
  const visibleQuotes = getVisibleQuotes(selectedQuotes);
  const chart = buildChartSeries(historyRates, visibleQuotes);
  const otherRates = selectedQuotes.map((quoteCurrency) => ratesByQuote[quoteCurrency]).filter((rate): rate is RateResponse => rate !== undefined);
  const activeChartDetails = activeChartPoint
    ? visibleQuotes
        .map((quoteCurrency) => {
          const detail = getChartDetail(historyRates, quoteCurrency, activeChartPoint.date);

          if (detail === null) {
            return null;
          }

          return { quoteCurrency, ...detail };
        })
        .filter((detail): detail is { change: number; quoteCurrency: string; rate: number } => detail !== null)
    : [];
  const activeColumnPoints = activeChartPoint
    ? chart.series.flatMap((series) => {
        const point = series.points.find((seriesPoint) => seriesPoint.date === activeChartPoint.date);
        return point ? [{ ...point, color: series.color, quote: series.quote }] : [];
      })
    : [];

  return (
    <main className={styles.page} aria-label={t.projects.jpExchange.ariaPage}>
      <HomeButton />

      <section className={styles.panel}>
        <p className={styles.kicker}>{t.projects.jpExchange.kicker}</p>
        <h1>{t.projects.jpExchange.title}</h1>

        <section className={styles.chartPanel} aria-label="汇率变化折线图">
          <svg
            className={styles.chart}
            onMouseLeave={() => setActiveChartPoint(null)}
            onMouseMove={(event) => {
              const nearestPoint = getNearestChartPoint(event.clientX, event.currentTarget, chart);
              setActiveChartPoint({ date: nearestPoint.date, x: nearestPoint.x, y: chart.padding });
            }}
            viewBox={`0 0 ${chart.chartWidth} ${chart.chartHeight}`}
            role="img"
          >
            <title>Exchange rate movement</title>
            {chart.ticks.map((tick) => (
              <g key={tick.label}>
                <line className={styles.chartGrid} x1={chart.padding} x2={chart.plotEndX} y1={tick.y} y2={tick.y} />
                <text className={styles.chartTick} x={chart.padding - 18} y={tick.y + 7}>
                  {tick.label}
                </text>
              </g>
            ))}
            <line className={styles.chartAxis} x1={chart.padding} x2={chart.plotEndX} y1={chart.plotEndY} y2={chart.plotEndY} />
            <line className={styles.chartAxis} x1={chart.padding} x2={chart.padding} y1={chart.padding} y2={chart.plotEndY} />
            {activeChartPoint && (
              <line
                className={styles.chartHoverLine}
                x1={activeChartPoint.x}
                x2={activeChartPoint.x}
                y1={chart.padding}
                y2={chart.plotEndY}
              />
            )}
            {chart.series.map((series) => (
              <g key={series.quote}>
                <path className={styles.chartLine} d={series.path} stroke={series.color} />
                {series.points.map((point) => (
                  <circle
                    className={styles.chartPoint}
                    cx={point.x}
                    cy={point.y}
                    fill={series.color}
                    key={`${series.quote}-${point.date}`}
                    r="7"
                  >
                    <title>
                      {`${getCurrencyName(t.projects.jpExchange.quote, series.quote)} ${point.date}: ${formatRateValue(point.rawRate)} (${point.value >= 0 ? '+' : ''}${point.value.toFixed(2)}%)`}
                    </title>
                  </circle>
                ))}
                {activeColumnPoints
                  .filter((point) => point.quote === series.quote)
                  .map((point) => (
                    <circle
                      className={styles.chartActivePoint}
                      cx={point.x}
                      cy={point.y}
                      fill={point.color}
                      key={`${point.quote}-${point.date}-active`}
                      r="9"
                    />
                  ))}
                {series.quote === pinnedQuote && series.points.length > 0 && (
                  <text
                    className={styles.pinnedLabel}
                    x={Math.min(series.points[series.points.length - 1].x + 12, chart.chartWidth - 180)}
                    y={Math.max(series.points[series.points.length - 1].y - 10, chart.padding + 20)}
                  >
                    {getCurrencyName(t.projects.jpExchange.quote, series.quote)}
                  </text>
                )}
              </g>
            ))}
          </svg>
          {activeChartPoint && activeChartDetails.length > 0 && (
            <div
              className={styles.chartTooltip}
              style={{
                left: `${(activeChartPoint.x / chart.chartWidth) * 100}%`,
                top: `${(chart.padding / chart.chartHeight) * 100}%`,
              }}
            >
              <strong>{activeChartPoint.date}</strong>
              {activeChartDetails.map((detail) => (
                <span key={detail.quoteCurrency}>
                  {getCurrencyName(t.projects.jpExchange.quote, detail.quoteCurrency)}
                  <b>{`${detail.change >= 0 ? '+' : ''}${detail.change.toFixed(2)}%`}</b>
                  <em>
                    {currencySymbols[detail.quoteCurrency]}
                    {formatRateValue(detail.rate)}
                  </em>
                </span>
              ))}
            </div>
          )}
          <div className={styles.legend}>
            {chart.series.map((series) => (
              <span className={styles.legendItem} key={series.quote}>
                <span className={styles.legendColor} style={{ background: series.color }} />
                {getCurrencyName(t.projects.jpExchange.quote, series.quote)}
              </span>
            ))}
          </div>
          <p className={styles.chartNote}>{t.projects.jpExchange.chartNote}</p>
        </section>

        <div className={styles.switchWrap} aria-label={t.projects.jpExchange.switchLabel} role="group">
          <button
            aria-pressed={isCnySelected}
            className={styles.switchButton}
            onClick={() => setBaseCurrency('CNY')}
            type="button"
          >
            {t.projects.jpExchange.base.CNY}
          </button>
          <button
            aria-pressed={!isCnySelected}
            className={styles.switchButton}
            onClick={() => setBaseCurrency('USD')}
            type="button"
          >
            {t.projects.jpExchange.base.USD}
          </button>
          <span className={styles.switchThumb} data-position={baseCurrency} />
        </div>

        <p className={styles.baseLine}>{t.projects.jpExchange.baseLine.replace('{base}', baseLabel)}</p>

        <section className={styles.quotePicker} aria-label="选择其他对比货币">
          <label className={`${styles.quoteOption} ${styles.quoteOptionPinned}`}>
            <input
              checked
              disabled
              readOnly
              type="checkbox"
            />
            <span>{getCurrencyName(t.projects.jpExchange.quote, pinnedQuote)}</span>
          </label>
          {availableQuotes.map((quoteCurrency) => (
            <label className={styles.quoteOption} key={quoteCurrency}>
              <input
                checked={selectedQuotes.includes(quoteCurrency)}
                disabled={currencyStatus === 'loading'}
                onChange={() => toggleQuoteCurrency(quoteCurrency)}
                type="checkbox"
              />
              <span>{getCurrencyName(t.projects.jpExchange.quote, quoteCurrency)}</span>
            </label>
          ))}
        </section>

        <div className={styles.cards}>
          <article className={styles.card}>
            <span className={styles.currencyName}>{getCurrencyName(t.projects.jpExchange.quote, pinnedQuote)}</span>
            <strong>{renderRateValue(pinnedQuote, ratesByQuote[pinnedQuote]?.rate)}</strong>
            <span className={styles.currencyCode}>JPY</span>
          </article>

          <article className={`${styles.card} ${styles.comparisonCard}`}>
            {otherRates.length === 0 && <span className={styles.emptyComparison}>Select currencies below</span>}
            {otherRates.map((rate) => (
              <div className={styles.rateRow} key={rate.quote}>
                <span>{getCurrencyName(t.projects.jpExchange.quote, rate.quote)}</span>
                <strong>{renderRateValue(rate.quote, rate.rate)}</strong>
                <span>{rate.quote}</span>
              </div>
            ))}
          </article>
        </div>

        <p className={styles.status} role={rateStatus === 'error' || currencyStatus === 'error' ? 'alert' : 'status'}>
          {(rateStatus === 'loading' || currencyStatus === 'loading') && t.projects.jpExchange.loading}
          {(rateStatus === 'error' || currencyStatus === 'error') && t.projects.jpExchange.error}
          {rateStatus === 'success' &&
            updatedDate &&
            t.projects.jpExchange.updatedAt.replace('{date}', updatedDate)}
        </p>

        <section className={styles.humorSection}>
          <button className={styles.humorButton} onClick={toggleHumorVideos} type="button">
            {t.projects.jpExchange.humorButton}
          </button>

          {isHumorVisible && (
            <div className={styles.videoList}>
              <article className={styles.videoCard}>
                <iframe
                  allowFullScreen={false}
                  className={styles.videoFrame}
                  referrerPolicy="no-referrer"
                  scrolling="no"
                  src={buildBilibiliPlayerUrl(116808547901221, 'BV1Cw786NEtS', 39385827447)}
                  title="幽默一下"
                />
              </article>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

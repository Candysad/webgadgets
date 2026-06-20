import { X } from 'lucide-react';
import { type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { HomeButton } from '../../../components/HomeButton';
import { type Language, useI18n } from '../../../i18n';
import styles from './EatTonight.module.css';

interface FoodItem {
  id: string;
  text: string;
  color: string;
}

type FoodStyle = CSSProperties & Record<`--${string}`, string>;

const FOOD_COOKIE_PREFIX = 'webgadgets-eat-tonight';
const FAST_PICK_CYCLES = 2;
const FAST_PICK_STEP_MS = 70;
const SLOW_PICK_START_MS = 120;
const SLOW_PICK_STEP_INCREASE_MS = 38;
const FOOD_COLORS = [
  '#fb7185',
  '#f97316',
  '#facc15',
  '#34d399',
  '#22d3ee',
  '#60a5fa',
  '#a78bfa',
  '#f472b6',
  '#c084fc',
  '#4ade80',
] as const;

// 创建轻量唯一 id，用于列表项渲染和删除操作。
const createFoodId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

// 从候选色中随机挑一个文字颜色，配合白色描边保持可读性。
const getRandomFoodColor = () => {
  return FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)];
};

// 生成食物项对象，集中补齐 id 和随机颜色。
const createFoodItem = (text: string): FoodItem => {
  return {
    id: createFoodId(),
    text,
    color: getRandomFoodColor(),
  };
};

// 将字符串数组转成列表项，默认配置和 cookie 读取都复用这条路径。
const createFoodItems = (texts: readonly string[]) => {
  return texts.map((text) => createFoodItem(text));
};

// 简单占位符替换，用于拼接抽选结果标题。
const replaceTextParams = (template: string, params: Record<string, string | number>) => {
  return Object.entries(params).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
};

// 按语言隔离 cookie，避免中英文默认配置和用户配置互相覆盖。
const getCookieName = (language: Language) => {
  return `${FOOD_COOKIE_PREFIX}-${language}`;
};

// 从 document.cookie 中读取指定名称的值；没有或解析失败时返回 null。
const readCookieValue = (name: string) => {
  const target = `${name}=`;
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(target));

  if (cookie === undefined) {
    return null;
  }

  return decodeURIComponent(cookie.slice(target.length));
};

// 将当前列表保存到 cookie，保留一年，便于下次打开页面恢复配置。
const writeFoodCookie = (language: Language, items: FoodItem[]) => {
  const cookieValue = encodeURIComponent(JSON.stringify(items.map((item) => item.text)));
  document.cookie = `${getCookieName(language)}=${cookieValue}; max-age=31536000; path=/; SameSite=Lax`;
};

// 按语言读取 cookie 列表；没有缓存时使用该语言默认配置。
const loadFoodItems = (language: Language, defaultItems: readonly string[]) => {
  const cookieValue = readCookieValue(getCookieName(language));

  if (cookieValue === null) {
    return createFoodItems(defaultItems);
  }

  try {
    const parsedValue = JSON.parse(cookieValue);

    if (!Array.isArray(parsedValue)) {
      return createFoodItems(defaultItems);
    }

    const savedItems = parsedValue.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
    return savedItems.length > 0 ? createFoodItems(savedItems) : createFoodItems(defaultItems);
  } catch {
    return createFoodItems(defaultItems);
  }
};

// 今晚吃什么页面：维护候选餐食列表、cookie 持久化和随机抽选展示。
export function EatTonight() {
  const { language, t } = useI18n();
  const projectText = t.projects.eatTonight;
  const [inputValue, setInputValue] = useState('');
  const [items, setItems] = useState<FoodItem[]>(() => loadFoodItems(language, projectText.defaultItems));
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const pickTimerRef = useRef<number | null>(null);

  const hasItems = items.length > 0;
  const foodCountLabel = replaceTextParams(projectText.countLabel, { count: items.length });

  const foodListStyle = useMemo(
    () =>
      items.reduce<Record<string, string>>((style, item) => {
        style[`--food-color-${item.id}`] = item.color;
        return style;
      }, {}),
    [items],
  );

  // 停止抽选轮询计时器，供语言切换、删除项和组件卸载时复用。
  const clearPickTimer = () => {
    if (pickTimerRef.current !== null) {
      window.clearTimeout(pickTimerRef.current);
      pickTimerRef.current = null;
    }
  };

  // 切换语言时加载该语言自己的 cookie；没有 cookie 时回退到该语言默认项。
  useEffect(() => {
    clearPickTimer();
    setItems(loadFoodItems(language, projectText.defaultItems));
    setSelectedItem(null);
    setHighlightedItemId(null);
    setIsPicking(false);
    setInputValue('');
  }, [language, projectText.defaultItems]);

  // 列表变化后写入当前语言 cookie，保留下次访问的配置。
  useEffect(() => {
    writeFoodCookie(language, items);
  }, [items, language]);

  // 页面卸载时清理仍在运行的抽选计时器，避免组件销毁后继续更新状态。
  useEffect(() => {
    return () => clearPickTimer();
  }, []);

  // 提交输入框内容，把非空文本追加到候选列表底部。
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextText = inputValue.trim();

    if (nextText === '' || isPicking) {
      return;
    }

    setItems((currentItems) => [...currentItems, createFoodItem(nextText)]);
    setInputValue('');
  };

  // 随机从当前候选项中选择一个，并打开顶层结果展示。
  const chooseFood = () => {
    if (!hasItems || isPicking) {
      setSelectedItem(null);
      return;
    }

    clearPickTimer();
    setSelectedItem(null);
    setIsPicking(true);

    const finalIndex = Math.floor(Math.random() * items.length);
    const slowSteps = items.length + finalIndex + 1;
    const totalSteps = FAST_PICK_CYCLES * items.length + slowSteps;

    // 轮询两圈后继续减速到最终下标，形成“抽选”而非直接出结果的反馈。
    const runStep = (stepIndex: number) => {
      const currentIndex = stepIndex % items.length;
      setHighlightedItemId(items[currentIndex].id);

      if (stepIndex >= totalSteps - 1) {
        pickTimerRef.current = window.setTimeout(() => {
          setSelectedItem(items[finalIndex]);
          setIsPicking(false);
          pickTimerRef.current = null;
        }, SLOW_PICK_START_MS + slowSteps * SLOW_PICK_STEP_INCREASE_MS);
        return;
      }

      const isSlowPhase = stepIndex >= FAST_PICK_CYCLES * items.length - 1;
      const slowStepIndex = Math.max(0, stepIndex - FAST_PICK_CYCLES * items.length + 1);
      const nextDelay = isSlowPhase
        ? SLOW_PICK_START_MS + slowStepIndex * SLOW_PICK_STEP_INCREASE_MS
        : FAST_PICK_STEP_MS;

      pickTimerRef.current = window.setTimeout(() => runStep(stepIndex + 1), nextDelay);
    };

    runStep(0);
  };

  // 删除指定候选项；如果它正显示在结果层中，也同步关闭结果。
  const removeFood = (itemId: string) => {
    if (isPicking) {
      return;
    }

    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
    setSelectedItem((currentItem) => (currentItem?.id === itemId ? null : currentItem));
    setHighlightedItemId((currentItemId) => (currentItemId === itemId ? null : currentItemId));
  };

  return (
    <main className={styles.page} aria-label={projectText.ariaGame}>
      <HomeButton />
      <div className={`${styles.appSurface} ${selectedItem !== null ? styles.blurred : ''}`}>
        <section className={styles.header}>
          <p className={styles.kicker}>{projectText.kicker}</p>
          <h1>{projectText.title}</h1>
          <p>{projectText.description}</p>
        </section>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            aria-label={projectText.inputLabel}
            className={styles.input}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={projectText.inputPlaceholder}
            type="text"
            value={inputValue}
          />
          <button className={styles.pickButton} disabled={!hasItems || isPicking} onClick={chooseFood} type="button">
            {projectText.pickButton}
          </button>
        </form>

        <section className={styles.listPanel} aria-label={projectText.listLabel}>
          <div className={styles.listTopline}>
            <h2>{projectText.listTitle}</h2>
            <span>{foodCountLabel}</span>
          </div>

          {hasItems ? (
            <ol className={styles.foodList} style={foodListStyle as FoodStyle}>
              {items.map((item, index) => (
                <li
                  className={`${styles.foodItem} ${highlightedItemId === item.id ? styles.highlightedItem : ''}`}
                  key={item.id}
                >
                  <span className={styles.itemIndex}>{index + 1}</span>
                  <span
                    className={styles.itemText}
                    style={{ '--current-food-color': `var(--food-color-${item.id})` } as FoodStyle}
                  >
                    {item.text}
                  </span>
                  <button
                    aria-label={replaceTextParams(projectText.removeLabel, { item: item.text })}
                    className={styles.removeButton}
                    disabled={isPicking}
                    onClick={() => removeFood(item.id)}
                    type="button"
                  >
                    <X aria-hidden="true" size={18} />
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.emptyText}>{projectText.emptyText}</p>
          )}
        </section>
      </div>

      {selectedItem !== null ? (
        <div className={styles.resultOverlay} onClick={() => setSelectedItem(null)} role="presentation">
          <section className={styles.resultCard} aria-live="assertive">
            <p>{replaceTextParams(projectText.resultPrefix, { item: selectedItem.text })}</p>
          </section>
        </div>
      ) : null}
    </main>
  );
}

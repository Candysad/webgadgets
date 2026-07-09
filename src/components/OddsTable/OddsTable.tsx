import styles from './OddsTable.module.css';

export interface OddsRow {
  label: string;
  value: string;
}

interface OddsTableProps {
  rows: readonly OddsRow[];
  /** 表头：第一列为标签名，第二列为数值名 */
  headerLabel: string;
  headerValue: string;
}

/**
 * 通用胜率 / 赔率表格组件。
 * 第一列展示参与者 / 结果名称，第二列展示对应概率 / 赔率。
 * 数据通过 translations 中的 label / value 数组传入。
 */
export function OddsTable({ rows, headerLabel, headerValue }: OddsTableProps) {
  if (rows.length === 0) return null;

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>{headerLabel}</th>
          <th>{headerValue}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <td>{row.label}</td>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

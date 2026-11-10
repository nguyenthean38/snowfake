/* Tô màu SQL đơn giản (không cần thư viện) cho trang giới thiệu */
const KW = /^(SELECT|FROM|WHERE|GROUP|BY|ORDER|LIMIT|JOIN|LEFT|ON|AND|OR|AS|WITH|DESC|ASC|HAVING|CASE|WHEN|THEN|ELSE|END|IN|NOT|NULL|IS|OVER|DISTINCT|SHOW|TABLES|USE|DATABASE|SCHEMA|CREATE|TABLE|INSERT|INTO|VALUES)$/i
const FN = /^(SUM|COUNT|AVG|MIN|MAX|ROUND|DATE_TRUNC|DATEADD|DATEDIFF|IFF|LAG|HOUR|MONTH|QUARTER|DATE|DAYOFWEEK|THU_TRONG_TUAN|AI_[A-Z_]+|CURRENT_DATE)$/i

export function highlightSQL(sql = '') {
  const out = []
  const re = /(--[^\n]*)|('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([^\sA-Za-z0-9_']+)/g
  let m, k = 0
  while ((m = re.exec(sql))) {
    const [t, cmt, str, num, word] = m
    let color = null
    if (cmt) color = 'var(--c-code-cmt)'
    else if (str) color = 'var(--c-code-str)'
    else if (num) color = 'var(--c-code-num)'
    else if (word && KW.test(word)) color = 'var(--c-code-kw)'
    else if (word && FN.test(word)) color = 'var(--c-code-fn)'
    out.push(color ? <span key={k++} style={{ color, fontWeight: word && KW.test(word) ? 600 : undefined }}>{t}</span> : t)
  }
  return out
}

export function SqlCode({ sql, caret, className = '' }) {
  return (
    <pre className={`font-mono text-[12px] sm:text-[12.5px] leading-[1.7] whitespace-pre-wrap break-words ${className}`}>
      {highlightSQL(sql)}
      {caret && <span className="inline-block w-[7px] h-[1.05em] align-[-2px] bg-brand-500 animate-blink ml-px" />}
    </pre>
  )
}

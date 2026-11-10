/* ==========================================================
   Trình soạn SQL dựa trên CodeMirror 6
   - Tô màu theo biến CSS (--c-code-*) nên đổi sáng / tối tự động
   - Gợi ý tên bảng, cột (kể cả tên đầy đủ DB.LƯỢC_ĐỒ.BẢNG) và hàm AI
   - Ctrl/Cmd + Enter: chạy câu dưới con trỏ · Ctrl/Cmd + Shift + Enter: chạy tất cả
   ========================================================== */
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState, Compartment, Prec } from '@codemirror/state'
import { keymap, placeholder } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { sql, StandardSQL } from '@codemirror/lang-sql'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { completeFromList } from '@codemirror/autocomplete'
import { tags as t } from '@lezer/highlight'
import { statementAt } from './sqlUtils'

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword, t.modifier], color: 'var(--c-code-kw)', fontWeight: '600' },
  { tag: [t.typeName], color: 'var(--c-code-num)' },
  { tag: [t.string, t.special(t.string)], color: 'var(--c-code-str)' },
  { tag: [t.number, t.bool, t.null], color: 'var(--c-code-num)' },
  { tag: [t.lineComment, t.blockComment, t.comment], color: 'var(--c-code-cmt)', fontStyle: 'italic' },
  { tag: [t.standard(t.name), t.function(t.variableName)], color: 'var(--c-code-fn)' },
  { tag: [t.special(t.name)], color: 'var(--c-code-fn)' },
  { tag: [t.operator, t.punctuation, t.paren, t.separator], color: 'var(--c-muted)' },
])

const FUNCTIONS = [
  ['AI_CAM_XUC', 'Phân loại cảm xúc văn bản tiếng Việt'],
  ['AI_DIEM_CAM_XUC', 'Điểm cảm xúc −1 … 1'],
  ['AI_PHAN_LOAI', "Gán nhãn: AI_PHAN_LOAI(văn_bản, 'a, b, c')"],
  ['AI_TOM_TAT', 'Tóm tắt ý chính'],
  ['AI_TRICH_XUAT', "Trích xuất: 'mon' | 'van_de' | 'email'"],
  ['AI_DICH', 'Dịch sang tiếng Anh'],
  ['KHONG_DAU', 'Bỏ dấu tiếng Việt'],
  ['DINH_DANG_VND', 'Định dạng tiền đồng'],
  ['THU_TRONG_TUAN', 'Thứ trong tuần bằng tiếng Việt'],
  ['DATE_TRUNC', "DATE_TRUNC('month', ngày)"],
  ['DATEADD', 'DATEADD(day, n, ngày)'],
  ['DATEDIFF', 'DATEDIFF(day, từ, đến)'],
  ['IFF', 'IFF(điều_kiện, a, b)'],
  ['DIV0', 'Chia, trả 0 khi mẫu bằng 0'],
  ['CURRENT_DATE', 'Ngày hiện tại của bản demo'],
].map(([label, detail]) => ({ label, detail, type: 'function', apply: label + '(', boost: 2 }))

const editorTheme = EditorView.theme({
  '&': { height: '100%' },
  '.cm-content': { padding: '10px 0' },
  '.cm-gutterElement': { padding: '0 10px 0 14px !important' },
  '.cm-foldGutter .cm-gutterElement': { padding: '0 4px !important' },
  '.cm-placeholder': { color: 'var(--c-faint)' },
})

/**
 * <SqlEditor ref value onChange onRun onRunAll onCursor schema onToggleAssistant onSave />
 * ref: { getText, getSelection, getRunTarget, insertAtCursor, append, setText, focus }
 */
export const SqlEditor = forwardRef(function SqlEditor({ value, onChange, onRun, onRunAll, onCursor, schema, onToggleAssistant, onSave }, ref) {
  const host = useRef(null)
  const view = useRef(null)
  const schemaComp = useRef(new Compartment())
  const cbs = useRef({})
  cbs.current = { onChange, onRun, onRunAll, onCursor, onToggleAssistant, onSave }

  useEffect(() => {
    const runKeys = Prec.highest(keymap.of([
      { key: 'Mod-Enter', run: () => { cbs.current.onRun?.(); return true } },
      { key: 'Mod-Shift-Enter', run: () => { cbs.current.onRunAll?.(); return true } },
      { key: 'Mod-i', run: () => { cbs.current.onToggleAssistant?.(); return true } },
      { key: 'Mod-s', run: () => { cbs.current.onSave?.(); return true } },
    ]))
    const state = EditorState.create({
      doc: value || '',
      extensions: [
        runKeys,
        basicSetup,
        keymap.of([indentWithTab]),
        schemaComp.current.of(sql({ dialect: StandardSQL, upperCaseKeywords: true, schema: schema || {} })),
        StandardSQL.language.data.of({ autocomplete: completeFromList(FUNCTIONS) }),
        syntaxHighlighting(highlight),
        editorTheme,
        placeholder('-- Viết SQL ở đây, rồi bấm Ctrl + Enter để chạy'),
        EditorView.lineWrapping,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) cbs.current.onChange?.(u.state.doc.toString())
          if (u.selectionSet || u.docChanged) {
            const pos = u.state.selection.main.head
            const line = u.state.doc.lineAt(pos)
            cbs.current.onCursor?.({ line: line.number, col: pos - line.from + 1, selected: u.state.selection.main.to - u.state.selection.main.from })
          }
        }),
      ],
    })
    const v = new EditorView({ state, parent: host.current })
    view.current = v
    return () => { v.destroy(); view.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    view.current?.dispatch({ effects: schemaComp.current.reconfigure(sql({ dialect: StandardSQL, upperCaseKeywords: true, schema: schema || {} })) })
  }, [schema])

  useImperativeHandle(ref, () => ({
    getText: () => view.current?.state.doc.toString() ?? '',
    getSelection: () => {
      const s = view.current?.state
      if (!s) return ''
      const { from, to } = s.selection.main
      return s.sliceDoc(from, to)
    },
    /** Đoạn sẽ chạy: vùng đang chọn, nếu không có thì câu lệnh dưới con trỏ */
    getRunTarget: () => {
      const s = view.current?.state
      if (!s) return null
      const { from, to, head } = s.selection.main
      if (to > from) return { text: s.sliceDoc(from, to), from, to }
      const st = statementAt(s.doc.toString(), head)
      if (!st) return null
      // đánh dấu câu sẽ chạy để người dùng thấy
      view.current.dispatch({ selection: { anchor: st.from, head: Math.min(s.doc.length, st.to) }, scrollIntoView: true })
      setTimeout(() => {
        const v = view.current
        if (v) v.dispatch({ selection: { anchor: Math.min(head, v.state.doc.length) } })
      }, 450)
      return st
    },
    insertAtCursor: (text) => {
      const v = view.current
      if (!v) return
      const { from, to } = v.state.selection.main
      v.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length } })
      v.focus()
    },
    /** Thêm vào cuối, trả về vị trí bắt đầu của đoạn mới */
    append: (text) => {
      const v = view.current
      if (!v) return 0
      const doc = v.state.doc.toString()
      const sep = !doc.trim() ? '' : doc.endsWith('\n\n') ? '' : doc.endsWith('\n') ? '\n' : '\n\n'
      const from = doc.length
      v.dispatch({ changes: { from, insert: sep + text }, selection: { anchor: from + sep.length + text.length }, scrollIntoView: true })
      v.focus()
      return from + sep.length
    },
    setText: (text) => {
      const v = view.current
      if (!v) return
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: text } })
    },
    focus: () => view.current?.focus(),
  }), [])

  return <div ref={host} className="h-full min-h-0 overflow-hidden" />
})

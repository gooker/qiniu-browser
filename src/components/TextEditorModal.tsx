import { useEffect, useRef } from "react";
import { Check, FileText, Loader2, Save, X } from "lucide-react";
import type { QiniuFile } from "../lib/qiniu";

interface TextEditorModalProps {
  file: QiniuFile;
  content: string;
  loading: boolean;
  saving: boolean;
  error: string;
  dirty: boolean;
  onChange: (content: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function TextEditorModal({
  file,
  content,
  loading,
  saving,
  error,
  dirty,
  onChange,
  onSave,
  onClose,
}: TextEditorModalProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const filename = file.key.split('/').pop() || file.key;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (!loading && !saving && dirty) onSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dirty, loading, onClose, onSave, saving]);

  useEffect(() => {
    if (!loading && !error) editorRef.current?.focus();
  }, [error, loading]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="text-editor-title" className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/55 p-4 backdrop-blur-[2px]">
      <div className="flex h-[min(760px,calc(100vh-32px))] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-950">
        <header className="flex shrink-0 items-center gap-3 border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-950/50 dark:text-blue-400">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 id="text-editor-title" className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100" title={file.key}>{filename}</h2>
              {dirty && <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">未保存</span>}
            </div>
            <p className="truncate text-[11px] text-zinc-400 dark:text-zinc-500" title={file.key}>{file.key}</p>
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={loading || saving || !dirty || Boolean(error)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? '保存中…' : '保存'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="关闭编辑器"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 bg-zinc-50 p-3 dark:bg-zinc-900/70">
          {error ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 text-center text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-zinc-400 dark:text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />正在读取文件…
            </div>
          ) : (
            <textarea
              ref={editorRef}
              value={content}
              onChange={event => onChange(event.target.value)}
              spellCheck={false}
              aria-label={`编辑 ${filename}`}
              className="h-full w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 font-mono text-[13px] leading-6 text-zinc-800 outline-none ring-blue-500/20 transition-shadow focus:border-blue-400 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
            />
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between border-t border-zinc-200 px-5 py-2.5 text-[11px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          <span>{loading || error ? '' : `${content.length.toLocaleString()} 个字符`}</span>
          <span className="flex items-center gap-1.5">
            {dirty ? 'Ctrl/⌘ + S 保存' : <><Check className="h-3 w-3" />已保存</>}
          </span>
        </footer>
      </div>
    </div>
  );
}
/** `mobileNav` namespace dictionaries: drawer controls. */
export const NS = 'mobileNav'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'open': '打开目录',
  'close': '收起目录',
  'backdrop': '点击关闭目录',
  'sessionLog': '导出会话日志',
  'files': '文件浏览',
  'previewFullscreen': '全屏预览',
  'previewExitFullscreen': '退出全屏',
  'deleteSession': '删除会话',
  'deleteConfirmTitle': '删除当前会话？',
  'deleteConfirmDesc': '会话记录将被永久删除，此操作不可恢复。',
  'deleteConfirmYes': '删除',
  'deleteConfirmNo': '取消',
  'deletePending': '正在删除…',
  'deleteErrorSessionActive': '该会话正在运行，或已在本次启动后被使用过，无法删除。',
  'deleteErrorNotFound': '会话不存在或已被删除。',
  'deleteErrorGeneric': '删除失败：{message}',
} as const

/** English dictionary, key-identical to the Chinese source of truth. */
export const en: Record<MobileNavKey, string> = {
  'open': 'Open directory',
  'close': 'Close directory',
  'backdrop': 'Click to close directory',
  'sessionLog': 'Session log',
  'files': 'Files',
  'previewFullscreen': 'Fullscreen preview',
  'previewExitFullscreen': 'Exit fullscreen',
  'deleteSession': 'Delete session',
  'deleteConfirmTitle': 'Delete the current session?',
  'deleteConfirmDesc': 'The session log will be permanently removed. This cannot be undone.',
  'deleteConfirmYes': 'Delete',
  'deleteConfirmNo': 'Cancel',
  'deletePending': 'Deleting…',
  'deleteErrorSessionActive': 'This session is running, or has been used since the host started, so it cannot be deleted.',
  'deleteErrorNotFound': 'The session does not exist or was already deleted.',
  'deleteErrorGeneric': 'Delete failed: {message}',
}

/** Key domain of the `mobileNav` namespace (zh is the source of truth). */
export type MobileNavKey = keyof typeof zh

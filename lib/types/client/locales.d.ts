/** `mobileNav` namespace dictionaries: drawer controls. */
export declare const NS = "mobileNav";
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    readonly open: "打开目录";
    readonly close: "收起目录";
    readonly backdrop: "点击关闭目录";
    readonly sessionLog: "导出会话日志";
    readonly files: "文件浏览";
    readonly previewFullscreen: "全屏预览";
    readonly previewExitFullscreen: "退出全屏";
    readonly deleteSession: "删除会话";
    readonly deleteConfirmTitle: "删除当前会话？";
    readonly deleteConfirmDesc: "会话记录将被永久删除，此操作不可恢复。";
    readonly deleteConfirmYes: "删除";
    readonly deleteConfirmNo: "取消";
    readonly deletePending: "正在删除…";
    readonly deleteErrorSessionActive: "该会话正在运行，或已在本次启动后被使用过，无法删除。";
    readonly deleteErrorNotFound: "会话不存在或已被删除。";
    readonly deleteErrorGeneric: "删除失败：{message}";
};
/** English dictionary, key-identical to the Chinese source of truth. */
export declare const en: Record<MobileNavKey, string>;
/** Key domain of the `mobileNav` namespace (zh is the source of truth). */
export type MobileNavKey = keyof typeof zh;
//# sourceMappingURL=locales.d.ts.map
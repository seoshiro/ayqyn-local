/** Checked localization boundary; the remaining bridge is audited by IPC/runtime-schema tests. */
interface Window {
  ayqyn?: {
    getLanguage?: () => Promise<{language:string;found:boolean;fallback:boolean}>;
    setLanguage?: (language:string) => Promise<{language:string;saved:boolean}>;
  };
}

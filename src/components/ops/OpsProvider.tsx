import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { PublishModal, type PublishTab } from './PublishModal';
import { ConfirmDialog, type ConfirmOptions } from './ConfirmDialog';

interface OpenPublishOptions {
  tab?: PublishTab;
  onSuccess?: () => void;
}

interface OpsContextValue {
  /** Open the Publish dialog (register a server or publish a catalog entity). */
  openPublish: (opts?: OpenPublishOptions) => void;
  /** Promise-based confirmation dialog for destructive actions. */
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const OpsContext = createContext<OpsContextValue | undefined>(undefined);

export const OpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Publish modal state
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishTab, setPublishTab] = useState<PublishTab>('server');
  const successRef = useRef<(() => void) | undefined>(undefined);

  const openPublish = useCallback((opts?: OpenPublishOptions) => {
    setPublishTab(opts?.tab ?? 'server');
    successRef.current = opts?.onSuccess;
    setPublishOpen(true);
  }, []);

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const confirmResolve = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setConfirmState(opts);
    return new Promise<boolean>((resolve) => {
      confirmResolve.current = resolve;
    });
  }, []);

  const resolveConfirm = useCallback((v: boolean) => {
    confirmResolve.current?.(v);
    confirmResolve.current = null;
    setConfirmState(null);
  }, []);

  return (
    <OpsContext.Provider value={{ openPublish, confirm }}>
      {children}
      <PublishModal
        open={publishOpen}
        initialTab={publishTab}
        onClose={() => setPublishOpen(false)}
        onSuccess={() => successRef.current?.()}
      />
      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title ?? ''}
        body={confirmState?.body}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        danger={confirmState?.danger}
        onResolve={resolveConfirm}
      />
    </OpsContext.Provider>
  );
};

export function useOps(): OpsContextValue {
  const ctx = useContext(OpsContext);
  if (!ctx) throw new Error('useOps must be used within an OpsProvider');
  return ctx;
}

export default OpsProvider;

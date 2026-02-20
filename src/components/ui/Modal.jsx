import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center sm:p-4 animate-fadeIn">

            {/* ── Backdrop ─────────────────────────────── */}
            <div
                className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xl"
                onClick={onClose}
            />

            {/* ── Sheet / Card ─────────────────────────── */}
            <div className="
                relative w-full sm:max-w-lg
                flex flex-col
                h-[92dvh] sm:h-auto sm:max-h-[88vh]
                bg-white dark:bg-[#111318]
                rounded-t-[2.5rem] sm:rounded-[2.5rem]
                border border-gray-100 dark:border-white/5
                shadow-[0_32px_80px_rgba(0,0,0,0.25)]
                overflow-hidden
                animate-slideUp sm:animate-scaleIn
            ">
                {/* ── Drag handle (mobile) ──────────────── */}
                <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>

                {/* ── Header ───────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-md shadow-indigo-500/50" />
                        <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="
                            w-9 h-9 flex items-center justify-center rounded-xl
                            bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10
                            text-gray-500 dark:text-gray-400
                            transition-all active:scale-90
                        "
                        aria-label="Cerrar modal"
                    >
                        <XMarkIcon className="w-4.5 h-4.5" />
                    </button>
                </div>

                {/* ── Body ─────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-6 py-5 pb-28 sm:pb-5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
                    {children}
                </div>

                {/* ── Footer (optional) ─────────────────── */}
                {footer && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/80 dark:bg-white/2 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;

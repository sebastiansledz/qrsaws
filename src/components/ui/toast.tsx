// src/components/ui/toast.tsx
// Minimal, single-source re-exports to avoid duplicate names.
// If you need styled variants, wrap these primitives in your own components elsewhere.

export {
  Provider as ToastProvider,
  Root as Toast,
  Title as ToastTitle,
  Description as ToastDescription,
  Close as ToastClose,
  Action as ToastAction,
  Viewport as ToastViewport,
} from '@radix-ui/react-toast'
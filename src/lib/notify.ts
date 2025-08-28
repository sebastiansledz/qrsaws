// src/lib/notify.ts
import { toast } from "../hooks/useToast";

export function useNotify() {
  return {
    success: (title: string, description?: string) =>
      toast({ title, description, variant: "default" }),
    error: (title: string, description?: string) =>
      toast({ title, description, variant: "destructive" }),
    info: (title: string, description?: string) =>
      toast({ title, description, variant: "default" }),
  };
}
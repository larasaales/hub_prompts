import { useState, useCallback } from "react";

// Functions to securely get and set from localStorage (to avoid SSR/iframe issues)
const getFromLocal = (key: string, defaultVal: any) => {
  if (typeof window !== 'undefined') {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  }
  return defaultVal;
};

const saveToLocal = (key: string, val: any) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }
};

// Mock TRPC for the frontend
let mockPrompts = getFromLocal('mockPrompts', [
  { id: 1, title: "Refatoração de Código", content: "Analise o código a seguir e sugira melhorias de performance e legibilidade:\n\n[COLOQUE SEU CÓDIGO AQUI]", isFavorite: 1, tagIds: [1] },
  { id: 2, title: "Revisão de Texto (PT-BR)", content: "Por favor, revise o texto abaixo para clareza, gramática e tom corporativo, sem perder a essência da mensagem original:\n\n[SEU TEXTO AQUI]", isFavorite: 0, tagIds: [2] }
]);

let mockTags = getFromLocal('mockTags', [
  { id: 1, name: "Dev", color: "#3b82f6" },
  { id: 2, name: "Copy", color: "#10b981" }
]);

export const trpc = {
  prompts: {
    list: {
      useQuery: () => {
        const [data, setData] = useState(mockPrompts);
        const refetch = useCallback(() => setData([...mockPrompts]), []);
        return { data, refetch };
      }
    },
    create: {
      useMutation: ({ onSuccess, onError }: any) => {
        return {
          isPending: false,
          mutate: (input: any, options?: any) => {
            const newItem = { ...input, id: Date.now(), isFavorite: 0 };
            mockPrompts.push(newItem);
            saveToLocal('mockPrompts', mockPrompts);
            onSuccess?.(newItem);
            options?.onSuccess?.(newItem);
          }
        };
      }
    },
    update: {
      useMutation: ({ onSuccess }: any) => {
        return {
          isPending: false,
          mutate: (input: any) => {
            const idx = mockPrompts.findIndex((p: any) => p.id === input.promptId || p.id === input.id);
            if (idx > -1) {
              mockPrompts[idx] = { ...mockPrompts[idx], ...input };
              saveToLocal('mockPrompts', mockPrompts);
              onSuccess?.();
            }
          }
        };
      }
    },
    delete: {
      useMutation: ({ onSuccess }: any) => {
        return {
          isPending: false,
          mutate: (id: number) => {
            mockPrompts = mockPrompts.filter((p: any) => p.id !== id);
            saveToLocal('mockPrompts', mockPrompts);
            onSuccess?.();
          }
        };
      }
    }
  },
  tags: {
    list: {
      useQuery: () => {
        const [data, setData] = useState(mockTags);
        const refetch = useCallback(() => setData([...mockTags]), []);
        return { data, refetch };
      }
    },
    create: {
      useMutation: ({ onSuccess }: any) => {
        return {
          isPending: false,
          mutate: (input: any, options?: any) => {
            const newTag = { ...input, id: Date.now() };
            mockTags.push(newTag);
            saveToLocal('mockTags', mockTags);
            onSuccess?.(newTag);
            options?.onSuccess?.(newTag);
          }
        };
      }
    },
    update: {
      useMutation: ({ onSuccess }: any) => {
        return {
          isPending: false,
          mutate: (input: any) => {
            const idx = mockTags.findIndex((t: any) => t.id === input.tagId || t.id === input.id);
            if (idx > -1) {
              mockTags[idx] = { ...mockTags[idx], ...input };
              saveToLocal('mockTags', mockTags);
              onSuccess?.();
            }
          }
        };
      }
    },
    delete: {
      useMutation: ({ onSuccess }: any) => {
        return {
          isPending: false,
          mutate: (id: number) => {
            mockTags = mockTags.filter((t: any) => t.id !== id);
            saveToLocal('mockTags', mockTags);
            onSuccess?.();
          }
        };
      }
    }
  }
};

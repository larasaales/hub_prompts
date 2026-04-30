import { useState, useCallback } from "react";

// Mock TRPC for the frontend
let mockPrompts = [
  { id: 1, title: "Refatoração de Código", content: "Analise o código a seguir e sugira melhorias de performance e legibilidade:\n\n[COLOQUE SEU CÓDIGO AQUI]", isFavorite: 1, tagIds: [1] },
  { id: 2, title: "Revisão de Texto (PT-BR)", content: "Por favor, revise o texto abaixo para clareza, gramática e tom corporativo, sem perder a essência da mensagem original:\n\n[SEU TEXTO AQUI]", isFavorite: 0, tagIds: [2] }
];

let mockTags = [
  { id: 1, name: "Dev", color: "#3b82f6" },
  { id: 2, name: "Copy", color: "#10b981" }
];

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
          mutate: (input: any) => {
            mockPrompts.push({ ...input, id: Date.now(), isFavorite: 0 });
            onSuccess?.();
          }
        };
      }
    },
    update: {
      useMutation: ({ onSuccess }: any) => {
        return {
          isPending: false,
          mutate: (input: any) => {
            const idx = mockPrompts.findIndex(p => p.id === input.promptId);
            if (idx > -1) {
              mockPrompts[idx] = { ...mockPrompts[idx], ...input };
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
            mockPrompts = mockPrompts.filter(p => p.id !== id);
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
          mutate: (input: any) => {
            mockTags.push({ ...input, id: Date.now() });
            onSuccess?.();
          }
        };
      }
    },
    update: {
      useMutation: ({ onSuccess }: any) => {
        return {
          isPending: false,
          mutate: (input: any) => {
            const idx = mockTags.findIndex(t => t.id === input.tagId);
            if (idx > -1) {
              mockTags[idx] = { ...mockTags[idx], ...input };
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
            mockTags = mockTags.filter(t => t.id !== id);
            onSuccess?.();
          }
        };
      }
    }
  }
};

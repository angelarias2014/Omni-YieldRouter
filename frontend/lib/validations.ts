import { z } from 'zod';

export const depositSchema = z.object({
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Dirección de token inválida'),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'La cantidad debe ser un número positivo',
  }),
  chainId: z.string().min(1, 'Debes seleccionar una cadena de destino'),
  strategyAddress: z.string().min(1, 'Debes seleccionar una estrategia'),
});

export type DepositFormValues = z.infer<typeof depositSchema>;

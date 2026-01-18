import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { WagmiConfig, createConfig } from 'wagmi'
import { localhost, mainnet, arbitrum, optimism, polygon, base, sepolia, arbitrumSepolia, optimismSepolia, baseSepolia, polygonMumbai } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { createPublicClient, http } from 'viem'
import { Toaster } from 'react-hot-toast'

// Configuración de las cadenas soportadas por la aplicación
const chains = [
  mainnet, arbitrum, optimism, polygon, base,
  sepolia, arbitrumSepolia, optimismSepolia, baseSepolia, polygonMumbai,
  localhost // Para desarrollo local
]

const config = createConfig({
  autoConnect: true,
  publicClient: createPublicClient({
    chain: localhost, // Temporalmente configurado para localhost; se puede ajustar según la necesidad
    transport: http()
  }),
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={config}>
      <Toaster position="top-right" />
      <Component {...pageProps} />
    </WagmiConfig>
  )
} 
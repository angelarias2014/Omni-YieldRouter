export interface YieldOption {
  chain: string;
  protocol: string;
  apy: number;
  address: string;
}

export interface YieldData {
  best: string;
  options: YieldOption[];
  error?: string;
}

export interface DeployedAddresses {
  aaveStrategy: string;
  yearnStrategy: string;
  beefyStrategy: string;
  crossChainRouter: string;
  yieldRouter: string;
  error?: string;
}

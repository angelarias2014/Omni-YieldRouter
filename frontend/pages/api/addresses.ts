import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Try to read the deployed addresses file
    const addressesPath = path.join(process.cwd(), '..', 'deployed-addresses.json');
    const addressesData = fs.readFileSync(addressesPath, 'utf8');
    const addresses = JSON.parse(addressesData);
    
    res.status(200).json(addresses);
  } catch (error) {
    // Return default addresses if file doesn't exist
    res.status(200).json({
      aaveStrategy: "0x...",
      yearnStrategy: "0x...",
      beefyStrategy: "0x...",
      agglayerRouter: "0x...",
      yieldRouter: "0x...",
      error: "Contracts not deployed yet"
    });
  }
}

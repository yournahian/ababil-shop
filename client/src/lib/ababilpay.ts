/**
 * AbabilPay Custom Integration (Option B)
 * Handles: create intent → sign EIP-3009 → submit settlement
 */

const ABABIL_API = '/ababil-api/api/v1';
const ABABIL_API_KEY = process.env.ABABIL_API_KEY || process.env.VITE_ABABIL_API_KEY || '';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentRequirement {
  scheme: string;
  network: string;           // e.g. "eip155:84532"
  maxAmountRequired: string; // atomic USDC units (×1_000_000)
  payTo: string;             // merchant wallet address
  asset: string;             // USDC contract address
  maxTimeoutSeconds: number;
  usdcDomainName: string;    // always read from API — never hardcode
  x402Version: number;
}

export interface PaymentIntent {
  intent_id: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  amount_usdc: number;
  order_id?: string;
  expires_at: string;
  checkout_url: string;
  payment_requirements: PaymentRequirement[];
  supported_chains: string[];
}

export interface SettlementResult {
  tx_hash: string;
  settled_at: string;
  amount_usdc: number;
  network: string;
}

// ─── Step 1: Create Intent ─────────────────────────────────────────────────

export async function createPaymentIntent(params: {
  amount_usdc: number;
  description?: string;
  order_id?: string;
}): Promise<PaymentIntent> {
  const res = await fetch(`${ABABIL_API}/x402/intents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ABABIL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Failed to create payment intent');
  }
  return json.data as PaymentIntent;
}

// ─── Step 2: Connect wallet + get address ─────────────────────────────────

export async function connectWallet(): Promise<string> {
  if (!window.ethereum) {
    throw new Error('No Ethereum wallet found. Please install MetaMask.');
  }
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  }) as string[];
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts returned from wallet.');
  }
  return accounts[0];
}

export async function getConnectedChainId(): Promise<number> {
  if (!window.ethereum) throw new Error('No Ethereum wallet found.');
  const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' }) as string;
  return parseInt(chainIdHex, 16);
}

// ─── Step 2: Sign EIP-3009 typed data ─────────────────────────────────────

function generateNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface EIP3009Payload {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
  signature: string;
}

export async function signEIP3009(
  buyerAddress: string,
  req: PaymentRequirement
): Promise<EIP3009Payload> {
  if (!window.ethereum) throw new Error('No Ethereum wallet found.');

  const chainId = parseInt(req.network.split(':')[1]); // "eip155:84532" → 84532
  const nonce = generateNonce();
  const validBefore = Math.floor(Date.now() / 1000) + 900; // 15 minutes from now

  const typedData = {
    types: {
      EIP712Domain: [
        { name: 'name',              type: 'string'  },
        { name: 'version',           type: 'string'  },
        { name: 'chainId',           type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      TransferWithAuthorization: [
        { name: 'from',        type: 'address' },
        { name: 'to',          type: 'address' },
        { name: 'value',       type: 'uint256' },
        { name: 'validAfter',  type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce',       type: 'bytes32' },
      ],
    },
    primaryType: 'TransferWithAuthorization',
    domain: {
      name:              req.usdcDomainName, // from API — never hardcode
      version:           '2',
      chainId,
      verifyingContract: req.asset,
    },
    message: {
      from:        buyerAddress,
      to:          req.payTo,
      value:       req.maxAmountRequired, // atomic USDC units as string
      validAfter:  '0',
      validBefore: validBefore.toString(),
      nonce,
    },
  };

  const signature = await window.ethereum.request({
    method: 'eth_signTypedData_v4',
    params: [buyerAddress, JSON.stringify(typedData)],
  }) as string;

  return {
    from:        buyerAddress,
    to:          req.payTo,
    value:       req.maxAmountRequired,
    validAfter:  '0',
    validBefore: validBefore.toString(),
    nonce,
    signature,
  };
}

// ─── Step 3: Submit settlement ─────────────────────────────────────────────

export async function submitSettlement(
  intentId: string,
  req: PaymentRequirement,
  payload: EIP3009Payload
): Promise<SettlementResult> {
  const res = await fetch(`${ABABIL_API}/x402/pay`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ABABIL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent_id: intentId,
      payment_signature: {
        scheme:      req.scheme,
        network:     req.network,
        x402Version: req.x402Version,
        payload,
      },
    }),
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Settlement failed');
  }
  return json.data as SettlementResult;
}

// ─── Switch wallet chain ────────────────────────────────────────────────────

export async function switchToChain(chainId: number): Promise<void> {
  if (!window.ethereum) throw new Error('No Ethereum wallet found.');
  const hex = '0x' + chainId.toString(16);
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hex }],
    });
  } catch (err: any) {
    // Error 4902 = chain not added to wallet yet
    if (err.code === 4902) {
      await addChainToWallet(chainId);
    } else {
      throw err;
    }
  }
}

async function addChainToWallet(chainId: number): Promise<void> {
  const CHAINS: Record<number, object> = {
    84532: {
      chainId: '0x14A34',
      chainName: 'Base Sepolia',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://sepolia.base.org'],
      blockExplorerUrls: ['https://sepolia-explorer.base.org'],
    },
    11155111: {
      chainId: '0xAA36A7',
      chainName: 'Ethereum Sepolia',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://rpc.sepolia.org'],
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
    },
    5042002: {
      chainId: '0x4CEEA2',
      chainName: 'Arc Testnet',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://rpc.arc-testnet.xyz'],
      blockExplorerUrls: ['https://explorer.arc-testnet.xyz'],
    },
  };
  const params = CHAINS[chainId];
  if (!params) throw new Error(`Unknown chain ID: ${chainId}`);
  await window.ethereum!.request({
    method: 'wallet_addEthereumChain',
    params: [params],
  });
}

// Extend Window to include ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

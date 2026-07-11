/**
 * Arc Blockchain Contract Helpers
 * Zero-dependency raw JSON-RPC interface to interact with MetaMask and the Arc Testnet (5042002).
 */

// Contract Addresses on Arc Testnet
export const ARC_USDC = '0x3600000000000000000000000000000000000000';
export const ARC_EURC = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';
export const ARC_ERC8183_JOB = '0x0747EEf0706327138c69792bF28Cd525089e4583';
export const ARC_IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e';
export const ARC_REPUTATION_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713';
export const ARC_VALIDATION_REGISTRY = '0x8004Cb1BF31DAf7788923b405b754f57acEB4272';
export const ARC_STABLE_FX_ESCROW = '0x867650F5eAe8df91445971f14d89fd84F0C9a9f8';
export const ARC_PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

// 4-Byte Function Selectors
const SELECTOR_APPROVE = '0x095ea7b3'; // approve(address,uint256)
const SELECTOR_CREATE_JOB = '0x437d8961'; // createJob(address,address,uint256,string,address)
const SELECTOR_FUND = '0xe62c8e27'; // fund(uint256,bytes)
const SELECTOR_SUBMIT = '0xfd576a8f'; // submit(uint256,bytes32,bytes)
const SELECTOR_COMPLETE = '0xd75bbdf3'; // complete(uint256,bytes32,bytes)
const SELECTOR_REGISTER = '0x47153f82'; // register(string)

// Helper: Pad address to 32 bytes (64 hex characters)
function padAddress(address: string): string {
  return address.toLowerCase().replace('0x', '').padStart(64, '0');
}

// Helper: Pad uint256/bigint to 32 bytes (64 hex characters)
function padUint256(value: number | string | bigint): string {
  const hex = BigInt(value).toString(16);
  return hex.padStart(64, '0');
}

// Helper: Pad bytes32 to 32 bytes
function padBytes32(hexStr: string): string {
  return hexStr.toLowerCase().replace('0x', '').padEnd(64, '0').slice(0, 64);
}

// Helper: ABI encode a string dynamically
function encodeString(str: string): string {
  const utf8 = new TextEncoder().encode(str);
  const len = utf8.length;
  let lenHex = padUint256(len);
  let dataHex = '';
  for (let i = 0; i < len; i++) {
    dataHex += utf8[i].toString(16).padStart(2, '0');
  }
  const padLen = (32 - (len % 32)) % 32;
  dataHex += '0'.repeat(padLen * 2);
  return lenHex + dataHex;
}

// Check if wallet is connected and returns the active account
export async function getArcWalletAddress(): Promise<string | null> {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  try {
    const accounts = (await window.ethereum.request({ method: 'eth_accounts' })) as string[];
    return accounts[0] || null;
  } catch {
    return null;
  }
}

// Check if wallet is on Arc Testnet (Chain ID 5042002)
export async function isConnectedToArc(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) return false;
  try {
    const chainIdHex = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
    const chainId = parseInt(chainIdHex, 16);
    return chainId === 5042002;
  } catch {
    return false;
  }
}

// Switch network to Arc Testnet
export async function switchToArcNetwork(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) return false;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x4ceea2' }] // 5042002 in hex
    });
    return true;
  } catch (err: any) {
    if (err.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x4ceea2',
            chainName: 'Arc Testnet',
            nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
            rpcUrls: ['https://rpc.testnet.arc.network'],
            blockExplorerUrls: ['https://testnet.arcscan.app']
          }]
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

// Fetch ERC-20 token balance (USDC or EURC)
export async function getArcTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) return '0.00';
  try {
    const data = '0x70a08231' + padAddress(walletAddress); // balanceOf(address)
    const resultHex = (await window.ethereum.request({
      method: 'eth_call',
      params: [{ to: tokenAddress, data }, 'latest']
    })) as string;
    
    if (!resultHex || resultHex === '0x') return '0.00';
    const rawVal = BigInt(resultHex);
    // USDC and EURC use 6 decimals on Arc
    const balance = Number(rawVal) / 1_000_000;
    return balance.toFixed(2);
  } catch (err) {
    console.error('[Arc-Contracts] Failed to fetch balance:', err);
    return '0.00';
  }
}

// ERC-20: Approve spender to spend amount
export async function approveTokenSpending(
  tokenAddress: string,
  spenderAddress: string,
  amountUsdc: number
): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('No Web3 wallet detected.');
  const from = await getArcWalletAddress();
  if (!from) throw new Error('Please connect your Web3 wallet first.');

  const atomicAmount = BigInt(Math.round(amountUsdc * 1_000_000));
  const data = SELECTOR_APPROVE + padAddress(spenderAddress) + padUint256(atomicAmount);

  return (await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: tokenAddress,
      data
    }]
  })) as string;
}

// ERC-8183: createJob(address provider, address evaluator, uint256 expiredAt, string description, address hook)
export async function createJobOnArc(
  provider: string,
  evaluator: string,
  expiredAtDays: number,
  description: string
): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('No Web3 wallet detected.');
  const from = await getArcWalletAddress();
  if (!from) throw new Error('Please connect your Web3 wallet first.');

  const expiredAtSecs = BigInt(Math.floor(Date.now() / 1000) + expiredAtDays * 86400);
  const hook = '0x0000000000000000000000000000000000000000'; // No hook callback

  // description offset is 5 * 32 = 160 (0xa0)
  const data = SELECTOR_CREATE_JOB +
    padAddress(provider) +
    padAddress(evaluator) +
    padUint256(expiredAtSecs) +
    padUint256(160) +
    padAddress(hook) +
    encodeString(description);

  return (await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: ARC_ERC8183_JOB,
      data
    }]
  })) as string;
}

// ERC-8183: fund(uint256 jobId, bytes optParams)
export async function fundJobOnArc(jobId: number | string): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('No Web3 wallet detected.');
  const from = await getArcWalletAddress();
  if (!from) throw new Error('Please connect your Web3 wallet first.');

  // Word 0: jobId
  // Word 1: offset to optParams (64)
  // Word 2: length of optParams (0)
  const data = SELECTOR_FUND +
    padUint256(jobId) +
    padUint256(64) +
    padUint256(0);

  return (await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: ARC_ERC8183_JOB,
      data
    }]
  })) as string;
}

// ERC-8183: complete(uint256 jobId, bytes32 reason, bytes optParams)
export async function completeJobOnArc(
  jobId: number | string,
  reasonStr: string
): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('No Web3 wallet detected.');
  const from = await getArcWalletAddress();
  if (!from) throw new Error('Please connect your Web3 wallet first.');

  // Simple keccak mockup for reason hash
  const reasonHash = '0x' + Array.from(new TextEncoder().encode(reasonStr))
    .reduce((acc, val) => acc + val.toString(16), '')
    .padEnd(64, '0')
    .slice(0, 64);

  // Word 0: jobId
  // Word 1: reasonHash
  // Word 2: offset to optParams (96)
  // Word 3: length of optParams (0)
  const data = SELECTOR_COMPLETE +
    padUint256(jobId) +
    padBytes32(reasonHash) +
    padUint256(96) +
    padUint256(0);

  return (await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: ARC_ERC8183_JOB,
      data
    }]
  })) as string;
}

// ERC-8004: register(string metadataURI)
export async function registerAgentOnArc(metadataURI: string): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('No Web3 wallet detected.');
  const from = await getArcWalletAddress();
  if (!from) throw new Error('Please connect your Web3 wallet first.');

  const data = SELECTOR_REGISTER +
    padUint256(32) + // Offset to metadataURI string
    encodeString(metadataURI);

  return (await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: ARC_IDENTITY_REGISTRY,
      data
    }]
  })) as string;
}

// ERC-8004: giveFeedback(uint256 agentId, int128 score, uint8 rating, string tag, ...)
// To keep execution simple, we trigger a standard transaction to the Reputation registry
export async function giveAgentFeedbackOnArc(
  agentId: string | number,
  score: number,
  tag: string
): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('No Web3 wallet detected.');
  const from = await getArcWalletAddress();
  if (!from) throw new Error('Please connect your Web3 wallet first.');

  // Signature: giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)
  // Selector: 0x7b6a09e0 (mock selector for giveFeedback)
  const selector = '0x7b6a09e0'; 
  const tagHash = '0x' + '0'.repeat(64); // mock

  const data = selector +
    padUint256(agentId) +
    padUint256(score) +
    padUint256(0) + // rating type
    padUint256(256) + // offsets for strings
    padUint256(320) +
    padUint256(384) +
    padUint256(448) +
    padBytes32(tagHash);

  return (await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: ARC_REPUTATION_REGISTRY,
      data
    }]
  })) as string;
}

// Stablecoin FX: Swap EURC for USDC
export async function swapStablecoinOnArc(amountEurc: number): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('No Web3 wallet detected.');
  const from = await getArcWalletAddress();
  if (!from) throw new Error('Please connect your Web3 wallet first.');

  // 1. Approve Permit2 contract to spend EURC
  const approveTx = await approveTokenSpending(ARC_EURC, ARC_PERMIT2, amountEurc);
  console.log('[StableFX] Spender approved via Permit2:', approveTx);

  // 2. Mock execute the Swap call on FxEscrow StableFX Engine
  const selectorSwap = '0x5b39922e'; // mock swap function selector
  const atomicAmount = BigInt(Math.round(amountEurc * 1_000_000));
  const data = selectorSwap + padUint256(atomicAmount) + padAddress(from);

  return (await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: ARC_STABLE_FX_ESCROW,
      data
    }]
  })) as string;
}

// ERC-20: Transfer token (USDC or EURC) on Arc Testnet
export async function transferToken(
  tokenAddress: string,
  toAddress: string,
  amount: number
): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('No Web3 wallet detected.');
  const from = await getArcWalletAddress();
  if (!from) throw new Error('Please connect your Web3 wallet first.');

  const SELECTOR_TRANSFER = '0xa9059cbb'; // transfer(address,uint256)
  const atomicAmount = BigInt(Math.round(amount * 1_000_000));
  const data = SELECTOR_TRANSFER + padAddress(toAddress) + padUint256(atomicAmount);

  return (await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: tokenAddress,
      data
    }]
  })) as string;
}

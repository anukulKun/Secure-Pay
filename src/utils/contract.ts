import { ethers } from 'ethers';

const CONTRACT_ADDRESSES = {
	12227332: '0xF93132d75c20EfeD556EC2Bc5aC777750665D3a9', // NeoX Testnet
	656476: '0x03c4fb7563e593ca0625C1c64959AC56081785cE', // EduChain Testnet
	41923: '0x5bA4CB3929C75DF47B8b5E6ca6c7414a5E1a3DB0', // Educhain Mainnet
	1001: '0xca36dd890f987edce1d6d7c74fb9df627c216bf6', // KAIA Testnet
	41: '0xCa36dD890F987EDcE1D6D7C74Fb9df627c216BF6', // Telos Testnet
	28122024: '0xCa36dD890F987EDcE1D6D7C74Fb9df627c216BF6', // Ancient8 Testnet
	5003: '0x74689f77e03D8213DF5037b681F05b80bAAe3504', // Mantle Testnet
	59141: '0xd150d34976Ac00D5e892aDFE565ba47de11c2656', // Linea Testnet
	4157: '0xCa36dD890F987EDcE1D6D7C74Fb9df627c216BF6', // CrossFi Testnet
	66665: '0xCa36dD890F987EDcE1D6D7C74Fb9df627c216BF6', // Creator Testnet
	5201420: '0x186a621d17819788c9aa170065ff3bbEEF37E7B7', // Electroneum Testnet
	52014: '0xC27106b03AadbFFec555C64F461784fCE850A51b', // Electroneum Mainnet
} as const;
  
const CONTRACT_ABI = [
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_potId",
				"type": "bytes32"
			}
		],
		"name": "breakPot",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_senderAddress",
				"type": "address"
			}
		],
		"name": "claimTransferByAddress",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_transferId",
				"type": "bytes32"
			}
		],
		"name": "claimTransferById",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_senderUsername",
				"type": "string"
			}
		],
		"name": "claimTransferByUsername",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_paymentId",
				"type": "bytes32"
			}
		],
		"name": "contributeToGroupPayment",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_potId",
				"type": "bytes32"
			}
		],
		"name": "contributeToSavingsPot",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_numParticipants",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_remarks",
				"type": "string"
			}
		],
		"name": "createGroupPayment",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_targetAmount",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_remarks",
				"type": "string"
			}
		],
		"name": "createSavingsPot",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "paymentId",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "GroupPaymentCompleted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "paymentId",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "contributor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "GroupPaymentContributed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "paymentId",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "numParticipants",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "remarks",
				"type": "string"
			}
		],
		"name": "GroupPaymentCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "potId",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "PotBroken",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "potId",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "contributor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "PotContribution",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_transferId",
				"type": "bytes32"
			}
		],
		"name": "refundTransfer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_username",
				"type": "string"
			}
		],
		"name": "registerUsername",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "potId",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "targetAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "remarks",
				"type": "string"
			}
		],
		"name": "SavingsPotCreated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_recipient",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "_remarks",
				"type": "string"
			}
		],
		"name": "sendToAddress",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_username",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_remarks",
				"type": "string"
			}
		],
		"name": "sendToUsername",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "transferId",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "TransferClaimed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "transferId",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "remarks",
				"type": "string"
			}
		],
		"name": "TransferInitiated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "transferId",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "TransferRefunded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "userAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "username",
				"type": "string"
			}
		],
		"name": "UserRegistered",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_paymentId",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getGroupPaymentContribution",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_paymentId",
				"type": "bytes32"
			}
		],
		"name": "getGroupPaymentDetails",
		"outputs": [
			{
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "totalAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amountPerPerson",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "numParticipants",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amountCollected",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "enum SecurePay.GroupPaymentStatus",
				"name": "status",
				"type": "uint8"
			},
			{
				"internalType": "string",
				"name": "remarks",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_sender",
				"type": "address"
			}
		],
		"name": "getPendingTransfers",
		"outputs": [
			{
				"internalType": "bytes32[]",
				"name": "",
				"type": "bytes32[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_potId",
				"type": "bytes32"
			}
		],
		"name": "getSavingsPotDetails",
		"outputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "targetAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "currentAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "enum SecurePay.PotStatus",
				"name": "status",
				"type": "uint8"
			},
			{
				"internalType": "string",
				"name": "remarks",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_transferId",
				"type": "bytes32"
			}
		],
		"name": "getTransferDetails",
		"outputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "enum SecurePay.TransferStatus",
				"name": "status",
				"type": "uint8"
			},
			{
				"internalType": "string",
				"name": "remarks",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_userAddress",
				"type": "address"
			}
		],
		"name": "getUserByAddress",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_username",
				"type": "string"
			}
		],
		"name": "getUserByUsername",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_userAddress",
				"type": "address"
			}
		],
		"name": "getUserProfile",
		"outputs": [
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			},
			{
				"internalType": "bytes32[]",
				"name": "transferIds",
				"type": "bytes32[]"
			},
			{
				"internalType": "bytes32[]",
				"name": "groupPaymentIds",
				"type": "bytes32[]"
			},
			{
				"internalType": "bytes32[]",
				"name": "participatedGroupPayments",
				"type": "bytes32[]"
			},
			{
				"internalType": "bytes32[]",
				"name": "savingsPotIds",
				"type": "bytes32[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_userAddress",
				"type": "address"
			}
		],
		"name": "getUserTransfers",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "recipient",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "enum SecurePay.TransferStatus",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "string",
						"name": "remarks",
						"type": "string"
					}
				],
				"internalType": "struct SecurePay.Transfer[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "groupPayments",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "paymentId",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "totalAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amountPerPerson",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "numParticipants",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amountCollected",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "remarks",
				"type": "string"
			},
			{
				"internalType": "enum SecurePay.GroupPaymentStatus",
				"name": "status",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_paymentId",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "hasContributedToGroupPayment",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "pendingTransfersBySender",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "savingsPots",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "potId",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "targetAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "currentAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "enum SecurePay.PotStatus",
				"name": "status",
				"type": "uint8"
			},
			{
				"internalType": "string",
				"name": "remarks",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "transfers",
		"outputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "enum SecurePay.TransferStatus",
				"name": "status",
				"type": "uint8"
			},
			{
				"internalType": "string",
				"name": "remarks",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "usernameToAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "users",
		"outputs": [
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

// Types for all events and returns
interface TransferEvent {
	type: 'TransferInitiated' | 'TransferClaimed' | 'TransferRefunded';
	transferId: string;
	sender?: string;
	recipient?: string;
	amount: string;
	remarks?: string;
	event: ethers.Event;
  }
  
  interface GroupPaymentEvent {
	type: 'GroupPaymentCreated' | 'GroupPaymentContributed' | 'GroupPaymentCompleted';
	paymentId: string;
	creator?: string;
	recipient?: string;
	amount: string;
	numParticipants?: number;
	remarks?: string;
	event: ethers.Event;
  }
  
  interface SavingsPotEvent {
	type: 'SavingsPotCreated' | 'PotContribution' | 'PotBroken';
	potId: string;
	owner?: string;
	amount?: string;
	name?: string;
	targetAmount?: string;
	remarks?: string;
	event: ethers.Event;
  }
  
  interface UserProfile {
	username: string;
	transferIds: string[];
	groupPaymentIds: string[];
	participatedGroupPayments: string[];
	savingsPotIds: string[];
  }
  
  interface RawContractTransfer {
	sender: string;
	recipient: string;
	amount: ethers.BigNumber;
	timestamp: ethers.BigNumber;
	status: number;
	remarks: string;
  }
  
  export interface Transfer {
	sender: string;
	recipient: string;
	amount: string;
	timestamp: number;
	status: number;
	remarks: string;
  }
  
  export interface GroupPayment {
	id: string;
	paymentId: string;
	creator: string;
	recipient: string;
	totalAmount: string;
	amountPerPerson: string;
	numParticipants: number;
	amountCollected: string;
	timestamp: number;
	status: number;
	remarks: string;
  }
  
  export interface SavingsPot {
	id: string;
	potId: string;
	owner: string;
	name: string;
	targetAmount: string;
	currentAmount: string;
	timestamp: number;
	status: number;
	remarks: string;
  }
  
  // Gets the appropriate contract address based on chainId
  const getContractAddress = async (signer: ethers.Signer) => {
	const chainId = await signer.getChainId();
	return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] 
	  || CONTRACT_ADDRESSES[656476]; // Default to Educhain if chain not found
  };
  
  // Contract instance getter with chain awareness
  export const getContract = async (signer: ethers.Signer) => {
	const address = await getContractAddress(signer);
	return new ethers.Contract(address, CONTRACT_ABI, signer);
  };
  
  // Basic Contract Interaction Functions
  export const getPaymentAmount = async (signer: ethers.Signer, paymentId: string) => {
	try {
	  const contract = await getContract(signer);
	  const payment = await contract.getGroupPaymentDetails(paymentId);
	  return ethers.utils.formatEther(payment.amountPerPerson);
	} catch (error) {
	  console.error('Error fetching payment amount:', error);
	  throw error;
	}
  };
  
  // User Registration and Management
  export const registerUsername = async (signer: ethers.Signer, username: string) => {
	const contract = await getContract(signer);
	const tx = await contract.registerUsername(username);
	await tx.wait();
  };
  
  export const getUserByUsername = async (signer: ethers.Signer, username: string) => {
	const contract = await getContract(signer);
	return await contract.getUserByUsername(username);
  };
  
  export const getUserByAddress = async (signer: ethers.Signer, address: string) => {
	const contract = await getContract(signer);
	return await contract.getUserByAddress(address);
  };
  
  export const getUserProfile = async (signer: ethers.Signer, userAddress: string): Promise<UserProfile> => {
	const contract = await getContract(signer);
	return await contract.getUserProfile(userAddress);
  };
  
  // Transfer Functions
  export const sendToAddress = async (signer: ethers.Signer, recipient: string, amount: string, remarks: string) => {
	const contract = await getContract(signer);
	const tx = await contract.sendToAddress(recipient, remarks, { value: ethers.utils.parseEther(amount) });
	await tx.wait();
  };
  
  export const sendToUsername = async (signer: ethers.Signer, username: string, amount: string, remarks: string) => {
	const contract = await getContract(signer);
	const tx = await contract.sendToUsername(username, remarks, { value: ethers.utils.parseEther(amount) });
	await tx.wait();
  };
  
  export const claimTransferByAddress = async (signer: ethers.Signer, senderAddress: string) => {
	const contract = await getContract(signer);
	const tx = await contract.claimTransferByAddress(senderAddress);
	await tx.wait();
  };
  
  export const claimTransferByUsername = async (signer: ethers.Signer, senderUsername: string) => {
	const contract = await getContract(signer);
	const tx = await contract.claimTransferByUsername(senderUsername);
	await tx.wait();
  };
  
  export const claimTransferById = async (signer: ethers.Signer, transferId: string) => {
	const contract = await getContract(signer);
	const tx = await contract.claimTransferById(transferId);
	await tx.wait();
  };
  
  export const refundTransfer = async (signer: ethers.Signer, transferId: string) => {
	const contract = await getContract(signer);
	const tx = await contract.refundTransfer(transferId);
	await tx.wait();
  };
  
  // Group Payment Functions
  export const createGroupPayment = async (
	signer: ethers.Signer,
	recipient: string,
	numParticipants: number,
	amount: string,
	remarks: string
  ) => {
	const contract = await getContract(signer);
	const tx = await contract.createGroupPayment(
	  recipient,
	  numParticipants,
	  remarks,
	  { value: ethers.utils.parseEther(amount) }
	);
	await tx.wait();
  };
  
  export const contributeToGroupPayment = async (
	signer: ethers.Signer,
	paymentId: string,
	amount: string
  ) => {
	const contract = await getContract(signer);
	const tx = await contract.contributeToGroupPayment(paymentId, {
	  value: ethers.utils.parseEther(amount)
	});
	await tx.wait();
  };
  
  export const getGroupPaymentDetails = async (signer: ethers.Signer, paymentId: string) => {
	const contract = await getContract(signer);
	const details = await contract.getGroupPaymentDetails(paymentId);
	return {
	  id: paymentId,
	  paymentId,
	  creator: details.creator,
	  recipient: details.recipient,
	  totalAmount: ethers.utils.formatEther(details.totalAmount),
	  amountPerPerson: ethers.utils.formatEther(details.amountPerPerson),
	  numParticipants: details.numParticipants.toNumber(),
	  amountCollected: ethers.utils.formatEther(details.amountCollected),
	  timestamp: details.timestamp.toNumber(),
	  status: details.status,
	  remarks: details.remarks
	};
  };
  
  export const hasContributedToGroupPayment = async (
	signer: ethers.Signer,
	paymentId: string,
	userAddress: string
  ) => {
	const contract = await getContract(signer);
	return await contract.hasContributedToGroupPayment(paymentId, userAddress);
  };
  
  export const getGroupPaymentContribution = async (
	signer: ethers.Signer,
	paymentId: string,
	userAddress: string
  ) => {
	const contract = await getContract(signer);
	const contribution = await contract.getGroupPaymentContribution(paymentId, userAddress);
	return ethers.utils.formatEther(contribution);
  };
  
  // Savings Pot Functions
  export const createSavingsPot = async (
	signer: ethers.Signer,
	name: string,
	targetAmount: string,
	remarks: string
  ) => {
	const contract = await getContract(signer);
	const tx = await contract.createSavingsPot(
	  name,
	  ethers.utils.parseEther(targetAmount),
	  remarks
	);
	await tx.wait();
  };
  
  export const contributeToSavingsPot = async (
	signer: ethers.Signer,
	potId: string,
	amount: string
  ) => {
	const contract = await getContract(signer);
	const tx = await contract.contributeToSavingsPot(potId, {
	  value: ethers.utils.parseEther(amount)
	});
	await tx.wait();
  };
  
  export const breakPot = async (signer: ethers.Signer, potId: string) => {
	const contract = await getContract(signer);
	const tx = await contract.breakPot(potId);
	await tx.wait();
  };
  
  export const getSavingsPotDetails = async (signer: ethers.Signer, potId: string) => {
	const contract = await getContract(signer);
	const details = await contract.getSavingsPotDetails(potId);
	return {
	  id: potId,
	  potId,
	  owner: details.owner,
	  name: details.name,
	  targetAmount: ethers.utils.formatEther(details.targetAmount),
	  currentAmount: ethers.utils.formatEther(details.currentAmount),
	  timestamp: details.timestamp.toNumber(),
	  status: details.status,
	  remarks: details.remarks
	};
  };
  
  // Transaction History Functions
  export const getUserTransfers = async (
	signer: ethers.Signer,
	userAddress: string
  ): Promise<Transfer[]> => {
	const contract = await getContract(signer);
	const transfers: RawContractTransfer[] = await contract.getUserTransfers(userAddress);
  
	return transfers.map((transfer: RawContractTransfer) => ({
	  sender: transfer.sender,
	  recipient: transfer.recipient,
	  amount: ethers.utils.formatEther(transfer.amount),
	  timestamp: transfer.timestamp.toNumber(),
	  status: transfer.status,
	  remarks: transfer.remarks,
	}));
  };
  
  export const getTransferDetails = async (signer: ethers.Signer, transferId: string) => {
	const contract = await getContract(signer);
	const transfer = await contract.getTransferDetails(transferId);
	return {
	  sender: transfer.sender,
	  recipient: transfer.recipient,
	  amount: ethers.utils.formatEther(transfer.amount),
	  timestamp: transfer.timestamp.toNumber(),
	  status: transfer.status,
	  remarks: transfer.remarks
	};
  };
  
  export const getPendingTransfers = async (signer: ethers.Signer, userAddress: string) => {
	const contract = await getContract(signer);
	return await contract.getPendingTransfers(userAddress);
  };
  
  // Event Listeners
  export const listenForAllEvents = async (
	signer: ethers.Signer,
	callback: (event: TransferEvent | GroupPaymentEvent | SavingsPotEvent) => void
  ) => {
	const contract = await getContract(signer);
  
	// Transfer Events
	contract.on('TransferInitiated', 
	  (transferId, sender, recipient, amount, remarks, event) => {
		callback({
		  type: 'TransferInitiated',
		  transferId,
		  sender,
		  recipient,
		  amount: ethers.utils.formatEther(amount),
		  remarks,
		  event
		});
	  }
	);
  
	contract.on('TransferClaimed',
	  (transferId, recipient, amount, event) => {
		callback({
		  type: 'TransferClaimed',
		  transferId,
		  recipient,
		  amount: ethers.utils.formatEther(amount),
		  event
		});
	  }
	);
  
	contract.on('TransferRefunded',
	  (transferId, sender, amount, event) => {
		callback({
		  type: 'TransferRefunded',
		  transferId,
		  sender,
		  amount: ethers.utils.formatEther(amount),
		  event
		});
	  }
	);
  
	// Group Payment Events
	contract.on('GroupPaymentCreated', 
	  (paymentId, creator, recipient, totalAmount, numParticipants, remarks, event) => {
		callback({
		  type: 'GroupPaymentCreated',
		  paymentId,
		  creator,
		  recipient,
		  amount: ethers.utils.formatEther(totalAmount),
		  numParticipants,
		  remarks,
		  event
		});
	  }
	);
  
	contract.on('GroupPaymentContributed',
	  (paymentId, contributor, amount, event) => {
		callback({
		  type: 'GroupPaymentContributed',
		  paymentId,
		  creator: contributor,
		  amount: ethers.utils.formatEther(amount),
		  event
		});
	  }
	);
  
	contract.on('GroupPaymentCompleted',
	  (paymentId, recipient, amount, event) => {
		callback({
		  type: 'GroupPaymentCompleted',
		  paymentId,
		  recipient,
		  amount: ethers.utils.formatEther(amount),
		  event
		});
	  }
	);
  
	// Savings Pot Events
	contract.on('SavingsPotCreated', 
	  (potId, owner, name, targetAmount, remarks, event) => {
		callback({
		  type: 'SavingsPotCreated',
		  potId,
		  owner,
		  name,
		  targetAmount: ethers.utils.formatEther(targetAmount),
		  remarks,
		  event
		});
	  }
	);
  
	contract.on('PotContribution',
	  (potId, contributor, amount, event) => {
		callback({
		  type: 'PotContribution',
		  potId,
		  owner: contributor,
		  amount: ethers.utils.formatEther(amount),
		  event
		});
	  }
	);
  
	contract.on('PotBroken',
	  (potId, owner, amount, event) => {
		callback({
		  type: 'PotBroken',
		  potId,
		  owner,
		  amount: ethers.utils.formatEther(amount),
		  event
		});
	  }
	);
  
	return () => {
	  contract.removeAllListeners();
	};
  };
  
  // Helper Functions
  export const formatAmount = (amount: ethers.BigNumber): string => {
	return ethers.utils.formatEther(amount);
  };
  
  export const parseAmount = (amount: string): ethers.BigNumber => {
	return ethers.utils.parseEther(amount);
  };
  
  export const formatTimestamp = (timestamp: ethers.BigNumber): Date => {
	return new Date(timestamp.toNumber() * 1000);
  };
  
  // Chain specific helpers
  export const getCurrentChainId = async (signer: ethers.Signer): Promise<number> => {
	return await signer.getChainId();
  };
  
  export const getChainNativeCurrency = (chainId: number) => {
	switch (chainId) {
	  case 12227332:
		return {
		  name: 'GAS',
		  symbol: 'GAS',
		  decimals: 18
		};
	  case 656476:
		return {
		  name: 'EDU',
		  symbol: 'EDU',
		  decimals: 18
		};
	  default:
		return {
		  name: 'GAS',
		  symbol: 'GAS',
		  decimals: 18
		};
	}
  };
  
  export const getExplorerUrl = (chainId: number) => {
	switch (chainId) {
	  case 12227332:
		return 'https://xt4scan.ngd.network/';
	  case 656476:
		return 'https://opencampus-codex.blockscout.com/';
	  default:
		return 'https://xt4scan.ngd.network/';
	}
  };
  
  export const isContractDeployed = async (signer: ethers.Signer): Promise<boolean> => {
	try {
	  const address = await getContractAddress(signer);
	  const provider = signer.provider;
	  if (!provider) return false;
	  
	  const code = await provider.getCode(address);
	  return code !== '0x';
	} catch (error) {
	  console.error('Error checking contract deployment:', error);
	  return false;
	}
  };
  
  // Error handling helper
  export class ContractError extends Error {
	constructor(
	  message: string,
	  public readonly code?: string,
	  public readonly chainId?: number
	) {
	  super(message);
	  this.name = 'ContractError';
	}
  }
  
  export const handleContractError = (error: unknown, chainId?: number): string => {
	if (error instanceof ContractError) {
	  return `Chain ${chainId}: ${error.message}`;
	}
	
	if (error instanceof Error) {
	  if (error.message.includes('user rejected')) {
		return 'Transaction was rejected by user';
	  }
	  if (error.message.includes('insufficient funds')) {
		return `Insufficient ${getChainNativeCurrency(chainId || 12227332).symbol} for transaction`;
	  }
	  return error.message;
	}
	
	return 'An unexpected error occurred';
  };
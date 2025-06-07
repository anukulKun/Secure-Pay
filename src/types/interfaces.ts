// types/interfaces.ts

import { ReactNode } from 'react';

  export interface RawContractPayment {
    creator: string;
    recipient: string;
    totalAmount: string;
    amountPerPerson: string;
    numParticipants: number;
    amountCollected: string;
    timestamp: unknown;
    status: unknown;
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
  
  export interface RawContractPot {
    owner: string;
    name: string;
    targetAmount: string;
    currentAmount: string;
    timestamp: unknown;
    status: unknown;
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

  export interface TabButtonProps {
    isActive: boolean;
    onClick: () => void;
    icon: ReactNode;
    text: string;
    count?: number;
  }
  
  export interface PotCardProps {
    pot: SavingsPot;
    onContribute: (id: string, amount: string) => void;
    onBreak: (id: string) => void;
    isLoading: boolean;
  }
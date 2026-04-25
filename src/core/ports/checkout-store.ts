export interface CheckoutStore {
  readCheckoutUid(): Promise<string | undefined>;
  writeCheckoutUid(uid: string): Promise<void>;
  clearCheckoutUid(): Promise<void>;
}

import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface FolderRecord {
    ownerPrincipal: Principal;
    createTime: Time;
    folderName: string;
    folderId: bigint;
}
export interface Plan {
    active: boolean;
    planId: bigint;
    durationSeconds: bigint;
    priceE8s: bigint;
    storageLimitBytes: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface FileMetadata {
    contentType: string;
    ownerPrincipal: Principal;
    fileName: string;
    fileSize: bigint;
    fileId: bigint;
    folderId?: bigint;
    uploadTime: Time;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Subscription {
    startTime: Time;
    status: SubscriptionStatus;
    principal: Principal;
    usedStorageBytes: bigint;
    endTime: Time;
    planId: bigint;
    storageLimitBytes: bigint;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface SubscribedUserEntry {
    startTime: Time;
    status: SubscriptionStatus;
    principal: Principal;
    endTime: Time;
    planId: bigint;
    storageLimitBytes: bigint;
}
export interface UserProfile {
    name: string;
    email: string;
}
export enum SubscriptionStatus {
    active = "active",
    revoked = "revoked"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    activateSubscription(planId: bigint, blockIndex: bigint): Promise<void>;
    adminDeleteFile(fileId: bigint): Promise<boolean>;
    adminDeleteUserFiles(userPrincipal: Principal): Promise<void>;
    adminDeleteUserSubscription(user: Principal): Promise<void>;
    adminListUsers(): Promise<Array<Subscription>>;
    adminRevokeSubscription(user: Principal): Promise<void>;
    adminSetSubscription(principal: Principal, planId: bigint, startTime: Time, endTime: Time, status: SubscriptionStatus): Promise<boolean>;
    adminViewUserInfos(): Promise<Array<[Principal, string, bigint, bigint, string, string]>>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkHasActiveSubscription(user: Principal): Promise<boolean>;
    confirmExtendSubscription(newPlanId: bigint, blockIndex: bigint): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createFolder(folderName: string): Promise<bigint>;
    createPlan(plan: Plan): Promise<boolean>;
    deleteFile(fileId: bigint): Promise<boolean>;
    deleteFolder(folderId: bigint): Promise<void>;
    deletePlan(planId: bigint): Promise<boolean>;
    downloadFile(fileId: bigint): Promise<ExternalBlob | null>;
    getAdminPrincipal(): Promise<Principal | null>;
    getAllUsersWithSubscriptionStatus(): Promise<Array<[Principal, string]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExtensionDetails(planId: bigint): Promise<[string, bigint]>;
    getPaymentDestination(): Promise<string | null>;
    getPlan(planId: bigint): Promise<Plan | null>;
    getPurchaseDetails(planId: bigint): Promise<[string, bigint]>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getSubscribedUsers(): Promise<Array<SubscribedUserEntry>>;
    getSubscription(): Promise<Subscription | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listFiles(): Promise<Array<FileMetadata>>;
    listFilesInFolder(folderId: bigint): Promise<Array<FileMetadata>>;
    listPlans(): Promise<Array<Plan>>;
    listUserFolders(): Promise<Array<FolderRecord>>;
    purchaseSubscription(planId: bigint): Promise<[string, bigint]>;
    renameFolder(folderId: bigint, newName: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setAdminPrincipal(admin: Principal): Promise<void>;
    setPaymentDestination(destination: string): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updatePlan(plan: Plan): Promise<boolean>;
    uploadFile(fileName: string, contentType: string, blobData: ExternalBlob, folderId: bigint | null, fileSize: bigint): Promise<bigint | null>;
}

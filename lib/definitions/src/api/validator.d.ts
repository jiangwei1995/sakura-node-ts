import { ApiError } from './apierror';
export declare class Validator {
    errors: Array<ApiError>;
    hasErrors(): boolean;
    toNumber(param: any, reason?: string): number;
    toNumberArray(param: string, reason?: string): number[];
    toStr(param: any, reason?: string): string;
    toDate(param: any, reason?: string): Date;
    toUnixTimestamp(param: any, reason?: string): number;
    toBoolean(param: any, reason?: string): boolean;
    assert(cond: boolean, reason: string): void;
}

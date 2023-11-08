import { consolePushLine } from "../slices/consoleSlice";

export type ConsoleAccents = 'error' | 'warning';

export interface ConsoleLine {
    text: string;
    accent?: ConsoleAccents;
}

export interface ConsoleSliceState {
    lines: ConsoleLine[];
}

export class AppException extends Error {}

export function except(message: string): never {
    throw new AppException(message);
}

export function createConsoleError(e: Error) {
    return consolePushLine({
        line: {
            text: `${e.message || 'An unknown error occured.'}\n`,
            accent: 'error',
        }
    });
}

export function createConsoleWarn(msg: string) {
    return consolePushLine({
        line: {
            text: `${msg}\n`,
            accent: 'warning',
        }
    });
}
import { consolePushLine } from "../slices/consoleSlice";
import { AppException } from "../types";

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

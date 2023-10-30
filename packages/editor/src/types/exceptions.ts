
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

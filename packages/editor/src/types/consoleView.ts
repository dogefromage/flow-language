
export const CONSOLE_VIEW_TYPE = 'console';

export type ConsoleAccents = 'error' | 'warning';

export interface ConsoleLine {
    text: string;
    accent?: ConsoleAccents;
}

export interface ConsoleSliceState {
    lines: ConsoleLine[];
}

export class AppException extends Error {}

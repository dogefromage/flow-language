import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../redux/rootReducer";
import { ConsoleLine, ConsoleSliceState } from "../types";

const initialState: ConsoleSliceState = {
    lines: [
        { text: '> NoodleStudio 0\n' },
    ],
};

export const consoleSlice = createSlice({
    name: 'console',
    initialState,
    reducers: {
        pushLine: (s, a: PayloadAction<{ line: ConsoleLine }>) => {
            s.lines = s.lines.slice()
            s.lines.push(a.payload.line);
        },
    },
});

export const {
    pushLine: consolePushLine,
} = consoleSlice.actions;

export const selectConsole = (state: RootState) => state.console;

const consoleReducer = consoleSlice.reducer;

export default consoleReducer;
import { createSlice } from "@reduxjs/toolkit";
import { defaultCommands } from "../content/commands/defaultCommands";
import { RootState } from "../redux/store";
import { CommandsSliceState } from "../types";

const defaultCommandMap = Object.fromEntries(
    defaultCommands.map(c => ([ c.id, c ]))
);

const initialState: CommandsSliceState = {
    commands: defaultCommandMap,
};

export const commandsSlice = createSlice({
    name: 'commands',
    initialState,
    reducers: {}
});

// export const {
// } = CommandsSlice.actions;

export const selectCommands = (state: RootState) => state.commands;

const commandsReducer = commandsSlice.reducer;

export default commandsReducer;
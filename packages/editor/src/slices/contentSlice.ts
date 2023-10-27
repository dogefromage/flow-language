import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../redux/rootReducer";
import { ContentSliceState } from "../types/content";

const initialState: ContentSliceState = {
    commands: {},
    toolbarInlineMenuComponents: [],
    toolbarWidgetComponents: [],
    managerComponents: [],
};

export const contentSlice = createSlice({
    name: 'content',
    initialState,
    reducers: {}
});

// export const {
// } = contentSlice.actions;

export const selectContent = (state: RootState) => state.content;

const contentReducer = contentSlice.reducer;

export default contentReducer;
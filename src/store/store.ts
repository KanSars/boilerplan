import { configureStore } from "@reduxjs/toolkit";
import { editorSlice } from "@/store/editorSlice";
import { projectSlice } from "@/store/projectSlice";

export const store = configureStore({
  reducer: {
    project: projectSlice.reducer,
    editor: editorSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

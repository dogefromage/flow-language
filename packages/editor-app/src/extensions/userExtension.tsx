import { EditorExtension, Menus, createExtensionSelector, makeGlobalCommand, useAppDispatch, useAppSelector } from "@noodles/editor";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { supabaseSignIn } from "../auth";
import { supabase } from "../supabase";
import { AppUser } from "../types";
import { useEffect } from "react";

interface UserExtensionState {
    user: AppUser | null;
}

const initialState: UserExtensionState = {
    user: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (s, a: PayloadAction<{ user: AppUser | null }>) => {
            s.user = a.payload.user;
        },
    },
});
const {
    setUser: userSliceSetUser,
} = userSlice.actions;

export const userExtension: EditorExtension = config => {
    const extensionId = 'user';
    // add user state
    config.stateReducers[extensionId] = userSlice.reducer;
    const selectUser = createExtensionSelector<UserExtensionState>(extensionId);

    const signinCommand = `${extensionId}.signin`;
    config.commands[signinCommand] = makeGlobalCommand(
        signinCommand, 'Sign in',
        async () => {
            const user = await supabaseSignIn(true);
            return userSliceSetUser({ user: user || null });
        },
    );

    const signoutCommand = `${extensionId}.signout`;
    config.commands[signoutCommand] = makeGlobalCommand(
        signoutCommand, 'Sign Out',
        async () => {
            await supabase.auth.signOut();
            return userSliceSetUser({ user: null });
        },
    );

    const UserManager = () => {
        const dispatch = useAppDispatch();

        // tries load user from token
        async function loadToken() {
            const user = await supabaseSignIn(false);
            dispatch(userSliceSetUser({ user: user || null }))
        }

        useEffect(() => {
            loadToken();
        }, []);

        return null;
    };
    config.managerComponents.push(UserManager);

    const UserToolbarMenu = () => {
        const { user } = useAppSelector(selectUser);

        return (
            <Menus.ExpandInline name='Profile'> {
                user ? (
                    <Menus.Command commandId={signoutCommand} />
                ) : (
                    <Menus.Command commandId={signinCommand} />
                )
            }
                <Menus.Divider />
                <Menus.HyperLink name='Go To NoodleStudio' href={import.meta.env.VITE_FRONT_PAGE_URL} />
            </Menus.ExpandInline>
        );
    }
    config.toolbarInlineMenuComponents.push(UserToolbarMenu);


    const UserToolbarWidget = () => {
        const { user } = useAppSelector(selectUser);

        return (
            <div> {
                user ? (
                    <p>{user.username}</p>
                ) : (
                    <p>Unauthenticated</p>
                )
            }
            </div>
        );
    }
    config.toolbarWidgetComponents.push(UserToolbarWidget);
}

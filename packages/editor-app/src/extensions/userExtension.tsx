import { EditorExtension, Menus, ToolTip, createExtensionSelector, makeGlobalCommand, useAppDispatch, useAppSelector } from "@noodles/editor";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { useLayoutEffect } from "react";
import { supabaseSignIn } from "../appAuth";
import { supabase } from "../supabase";
import { AppUser } from "../types";

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
            config.storage?.emit('reset');
            return userSliceSetUser({ user: user || null });
        },
    );

    const signoutCommand = `${extensionId}.signout`;
    config.commands[signoutCommand] = makeGlobalCommand(
        signoutCommand, 'Sign Out',
        async () => {
            await supabase.auth.signOut();
            config.storage?.emit('reset');
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

        useLayoutEffect(() => {
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

    const WidgetToolTip = () => {
        const { user } = useAppSelector(selectUser);

        if (user) {
            return (
                <ToolTip.SectionDiv>
                    <p>Logged in as user {user.username}.</p>
                </ToolTip.SectionDiv>
            )
        } else {
            return (
                <ToolTip.SectionDiv>
                    <p>You are not logged in.</p>
                </ToolTip.SectionDiv>
            )
        }
    }

    const UserToolbarWidget = () => {
        const { user } = useAppSelector(selectUser);
        const name = user ? user.username : 'Guest';

        return (
            <ToolTip.Anchor tooltip={WidgetToolTip}>
                <p>{ name }</p>
            </ToolTip.Anchor>
        );
    }
    config.toolbarWidgetComponents.push(UserToolbarWidget);
}

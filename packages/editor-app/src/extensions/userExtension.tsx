import { EditorExtension, Menus, ToolTip, createExtensionSelector, except, makeGlobalCommand, useAppDispatch, useAppSelector } from "@noodles/editor";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { useLayoutEffect } from "react";
import { startOAuthSignIn } from "../appAuth";
import { selectUserById } from "../queries";
import { supabase } from "../supabase";
import { AppUser } from "../types";
import { assertDef } from "../utils";

interface UserExtensionState {
    user: AppUser | null;
    userStatus: 'idle' | 'pending' | 'failed';
}

const initialState: UserExtensionState = {
    user: null,
    userStatus: 'idle',
};

const userSignIn = createAsyncThunk(
    'user/signin',
    async (args: { onlyCheckToken?: boolean }) => {
        let res = await supabase.auth.getSession();
        if (res.error) except('Could not retrieve session.');
    
        if (!args.onlyCheckToken && res.data.session == null) {
            await startOAuthSignIn();
            res = await supabase.auth.getSession();
            if (res.error) except('Could not retrieve session after authenticating.');
        }

        if (!res.data.session) {
            return null;
        }
    
        // get user from session
        const { data, error } = await selectUserById(res.data.session.user.id)
        if (error) except('Could not find user profile. Did you create a username for your profile?');

        assertDef(typeof data.id !== 'string' || typeof data.username !== 'string');
    
        return {
            user: {
                id: data.id,
                username: data.username,
            }
        };
    },
)

const userSignOut = createAsyncThunk(
    'user/signout',
    async () => {
        await supabase.auth.signOut();
    }
)

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        // setUser: (s, a: PayloadAction<{ user: AppUser | null }>) => {
        //     s.user = a.payload.user;
        // },
    },
    extraReducers(builder) {
        builder.addCase(userSignIn.pending, s => {
            s.userStatus = 'pending';
        });
        builder.addCase(userSignIn.rejected, (s, a) => {
            s.userStatus = 'failed';
        });
        builder.addCase(userSignIn.fulfilled, (s, a) => {
            s.userStatus = 'idle';
            s.user = a.payload?.user || null;
        });
        
        // signout status not really needed
        builder.addCase(userSignOut.fulfilled, (s, a) => {
            s.userStatus = 'idle';
            s.user = null
        });
    },
});

const {
    // setUser: userSliceSetUser,
} = userSlice.actions;

export const userExtension: EditorExtension = config => {
    const extensionId = 'user';
    // add user state
    config.stateReducers[extensionId] = userSlice.reducer;
    const selectUser = createExtensionSelector<UserExtensionState>(extensionId);

    const signinCommand = `${extensionId}.signin`;
    config.commands[signinCommand] = makeGlobalCommand(
        signinCommand, 'Sign in',
        () => {
            // config.storage?.emit('reset');
            return userSignIn({ onlyCheckToken: false });
        },
    );

    const signoutCommand = `${extensionId}.signout`;
    config.commands[signoutCommand] = makeGlobalCommand(
        signoutCommand, 
        'Sign Out',
        () => {
            // config.storage?.emit('reset');
            return userSignOut();
        },
    );

    const UserManager = () => {
        const dispatch = useAppDispatch();

        // tries load user from token
        function loadToken() {
            dispatch(userSignIn({ onlyCheckToken: true }));
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
                <p>{name}</p>
            </ToolTip.Anchor>
        );
    }
    config.toolbarWidgetComponents.push(UserToolbarWidget);
}

import { EditorExtension, Menus, ToolTip, createExtensionSelector, createGlobalCommand, except, useAppDispatch, useAppSelector } from "@noodles/editor";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { useLayoutEffect } from "react";
import { startOAuthSignIn } from "../config/appAuth";
import { supabase } from "../config/supabase";
import { selectUserById } from "../queries";
import { AppUser } from "../types";
import { LoadingStatus } from "../types/utils";
import { assertDef } from "../utils/utils";

interface UserExtensionState {
    user: {
        data: AppUser | null;
        status: LoadingStatus;
    }
}

const initialState: UserExtensionState = {
    user: {
        data: null,
        status: 'idle',
    }
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
            s.user.status = 'pending';
        });
        builder.addCase(userSignIn.rejected, (s, a) => {
            s.user.status = 'failed';
        });
        builder.addCase(userSignIn.fulfilled, (s, a) => {
            s.user = {
                status: 'idle',
                data: a.payload?.user || null
            }
        });

        // signout status not really needed
        builder.addCase(userSignOut.fulfilled, (s, a) => {
            s.user = {
                status: 'idle',
                data: null,
            }
        });
    },
});

const {
    // setUser: userSliceSetUser,
} = userSlice.actions;

const extensionId = 'user';
export const selectUser = createExtensionSelector<UserExtensionState>(extensionId);

export const userExtension: EditorExtension = config => {
    // add user state
    config.customReducers[extensionId] = userSlice.reducer;

    const signinCommand = `${extensionId}.signin`;
    config.commands[signinCommand] = createGlobalCommand(
        signinCommand, 'Sign in',
        () => {
            // config.storage?.emit('reset');
            return userSignIn({ onlyCheckToken: false });
        },
    );

    const signoutCommand = `${extensionId}.signout`;
    config.commands[signoutCommand] = createGlobalCommand(
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
            <> {
                user.data ? (
                    <Menus.Command commandId={signoutCommand} />
                ) : (
                    <Menus.Command commandId={signinCommand} />
                )
            }
                <Menus.HyperLink name='Go To NoodleStudio' href={import.meta.env.VITE_FRONT_PAGE_URL} />
            </>
        );
    }
    config.toolbar.inlineMenus.push([ 'Profile', UserToolbarMenu ]);

    const WidgetToolTip = () => {
        const { user } = useAppSelector(selectUser);

        if (user.data) {
            return (
                <ToolTip.SectionDiv>
                    <p>Logged in as user {user.data.username}.</p>
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
        const name = user.data ? user.data.username : 'Guest';

        return (
            <ToolTip.Anchor tooltip={WidgetToolTip}>
                <p>{name}</p>
            </ToolTip.Anchor>
        );
    }
    config.toolbar.widgetsRight.push(UserToolbarWidget);
}

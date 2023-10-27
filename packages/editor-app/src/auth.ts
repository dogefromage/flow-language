import { supabase } from "./supabase";
import { AppUser } from "./types";
import { assertDef } from "./utils";

async function popupAuthenticate(popupUrl: string, redirectUrl: string) {
    const popup = window.open(popupUrl, 'popup', 'popup=true');
    assertDef(popup, 'Cannot open popup.');

    type Tokens = Parameters<typeof supabase.auth.setSession>[0];

    const tokens = await new Promise<Tokens | undefined>((res, rej) => {
        const checkPopup = setInterval(() => {
            if (popup?.window.location.href.includes(redirectUrl)) {
                // popup has redirected,
                // transfer tokens in hash
                const params = new URLSearchParams(popup.window.location.hash.replace('#', ''));

                const access_token = params.get('access_token');
                const refresh_token = params.get('refresh_token');

                if (access_token != null && refresh_token != null) {
                    res({ access_token, refresh_token });
                } else {
                    console.error(`Could not get tokens from hash.`);
                    res(undefined);
                }
                popup.close();
            }

            if (popup.closed) {
                clearInterval(checkPopup);
            }
        }, 1000);
    });

    if (tokens != null) {
        await supabase.auth.setSession(tokens);
    }
}

export async function supabaseSignIn(makeRequest: boolean): Promise<AppUser | undefined> {
    let res = await supabase.auth.getSession();
    if (res.error) { console.error(res.error); }

    if (makeRequest && res.data.session == null) {
        await supabaseExecuteNewSignIn();
        res = await supabase.auth.getSession();
        if (res.error) { console.error(res.error); }
    }

    if (res.data.session == null) {
        return; // login didn't work
    }

    // get user from session
    const { data, error } = await supabase
        .from('users')
        .select(`
            id, 
            username
        `)
        .eq('id', res.data.session.user.id)
        .single();
    if (error) { console.error(error); }

    if (data?.username == null) {
        console.error(`User does not have public user profile created.`);
        return;
    }

    if (typeof data.id !== 'string' || typeof data.username !== 'string') {
        console.error(`Invalid data.`);
        return;
    }

    return {
        id: data.id,
        username: data.username,
    };
}

async function supabaseExecuteNewSignIn() {
    const redirectUrl = import.meta.env.VITE_SUPABASE_AUTH_POPUP_URL;

    const res = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
            skipBrowserRedirect: true,
            redirectTo: redirectUrl,
        }
    });
    if (res.error) {
        console.error(res.error);
        return;
    }

    await popupAuthenticate(res.data.url, redirectUrl);
}

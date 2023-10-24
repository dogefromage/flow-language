import { supabase } from "./supabase";

async function popupAuthenticate(popupUrl: string, redirectUrl: string) {
    const popup = window.open(popupUrl, 'popup', 'popup=true');

    type Tokens = Parameters<typeof supabase.auth.setSession>[0];

    const tokens = await new Promise<Tokens>(res => {
        const checkPopup = setInterval(() => {
            if (popup?.window.location.href.includes(redirectUrl)) {
                // popup has redirected,
                // transfer tokens in hash
                const params = new URLSearchParams(popup.window.location.hash.replace('#', ''));
                const tokens = {
                    access_token: params.get('access_token'),
                    refresh_token: params.get('refresh_token'),
                };
                popup.close();
                res(tokens);
            }

            if (popup.closed) {
                clearInterval(checkPopup);
            }
        }, 1000);
    });

    await supabase.auth.setSession(tokens);
}

export async function supabaseSignIn() {
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

// const res = await supabase.auth.getSession();

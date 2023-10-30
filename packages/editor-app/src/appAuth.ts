import { except } from '@noodles/editor';
import { supabase } from "./supabase";

export async function startOAuthSignIn() {
    const redirectUrl = import.meta.env.VITE_SUPABASE_AUTH_POPUP_URL;
    const oauthRequestRes = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
            skipBrowserRedirect: true,
            redirectTo: redirectUrl,
        }
    });
    if (oauthRequestRes.error) {
        except('Could not get github OAuth url.');
    }

    const tokens = await getOAuthTokensPopup(oauthRequestRes.data.url, redirectUrl);
    await supabase.auth.setSession(tokens);
}

async function getOAuthTokensPopup(popupUrl: string, redirectUrl: string) {
    const popup = window.open(popupUrl, 'popup', 'popup=true');
    if (!popup) {
        except('Could not open popup.');
    }

    try {
        return readTokensFromPopupWindow(popup, redirectUrl);        
    } catch (e: any) {
        except(e.message);
    }
}

function readTokensFromPopupWindow(popup: Window, targetUrl: string) {
    type Tokens = Parameters<typeof supabase.auth.setSession>[0];

    return new Promise<Tokens>((res, rej) => {
        const checkPopup = setInterval(() => {
            if (popup?.window.location.href.includes(targetUrl)) {
                // popup has redirected,
                // transfer tokens in hash
                const params = new URLSearchParams(popup.window.location.hash.replace('#', ''));

                const access_token = params.get('access_token');
                const refresh_token = params.get('refresh_token');

                popup.close();

                if (typeof access_token === 'string' &&
                    typeof refresh_token === 'string') {
                    res({ access_token, refresh_token });
                }
            }

            if (popup.closed) {
                clearInterval(checkPopup);
                rej('OAuth did not return any credentials.');
            }

        }, 1000);
    });
}